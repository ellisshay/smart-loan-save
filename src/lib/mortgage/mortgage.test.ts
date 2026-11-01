import { describe, expect, it } from "vitest";
import { pmt, principalFromPayment, monthsToRepay, schedule, num, monthlyIndexFactor } from "./amortization";
import { classifyTrack, fromOfferTracks, fromCaseTrackRows, fromMixTracks, summarizeTracks, projectTracks, type NormalizedTrack } from "./tracks";
import { healthScore } from "./health";
import { simulate, refinanceCompare } from "./scenarios";
import { affordability, repaymentRatio, dtiBand } from "./affordability";
import { compareOffers, explainDifferences } from "./offers";
import { caseProgress } from "./caseProgress";
import { nextAction } from "./nextAction";
import { buildMortgageModel, documentRows, balancedByComposition } from "./model";
import { firstMonthSplit } from "./tracks";
import { marketReferenceRate } from "./affordability";

const finite = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const track = (p: Partial<NormalizedTrack>): NormalizedTrack => ({ kind: "fixed_unlinked", label: "", amount: 100000, rate: 5, months: 240, linked: false, variable: false, ...p });

describe("amortization", () => {
  it("matches known annuity payments", () => {
    expect(Math.round(pmt(1_200_000, 4.5, 300))).toBe(6670);
    expect(Math.round(pmt(900_000, 5.2, 240))).toBe(6039);
  });
  it("handles 0% rate, zero and invalid input without NaN", () => {
    expect(pmt(120000, 0, 120)).toBe(1000);
    expect(pmt(0, 5, 300)).toBe(0);
    expect(pmt(100000, 5, 0)).toBe(0);
    expect(pmt(NaN, 5, 300)).toBe(0);
    expect(pmt("abc" as unknown as number, 5, 300)).toBe(0);
    expect(pmt(100000, -3, 120)).toBeCloseTo(100000 / 120);
    expect(num("1,500,000")).toBe(1_500_000);
    expect(num(Infinity)).toBe(0);
  });
  it("is consistent with its inverse", () => {
    const p = pmt(800000, 4.8, 300);
    expect(principalFromPayment(p, 4.8, 300)).toBeCloseTo(800000, 0);
  });
  it("monthsToRepay returns null when payment does not cover interest", () => {
    expect(monthsToRepay(1_000_000, 6, 4000)).toBeNull();
    expect(monthsToRepay(0, 5, 1000)).toBe(0);
    expect(monthsToRepay(120000, 0, 1000)).toBe(120);
  });
  it("schedule ends at zero balance and sums correctly", () => {
    const s = schedule(500000, 4, 240);
    expect(s.months).toBe(240);
    expect(s.points[s.points.length - 1].balance).toBeLessThan(1);
    expect(s.totalPaid - s.totalInterest).toBeCloseTo(500000, 0);
  });
  it("extra monthly payment shortens the term and cuts interest", () => {
    const a = schedule(500000, 4, 240), b = schedule(500000, 4, 240, 1000);
    expect(b.months).toBeLessThan(a.months);
    expect(b.totalInterest).toBeLessThan(a.totalInterest);
  });
  it("stays finite for very large values", () => {
    const s = schedule(1e10, 5, 360);
    expect(finite(s.monthly) && finite(s.totalInterest)).toBe(true);
  });
});

describe("tracks", () => {
  it("classifies Hebrew track names conservatively", () => {
    expect(classifyTrack("פריים")).toBe("prime");
    expect(classifyTrack("קבועה לא צמודה")).toBe("fixed_unlinked");
    expect(classifyTrack("קבועה צמודה")).toBe("fixed_linked");
    expect(classifyTrack("משתנה כל 5 שנים")).toBe("variable_unlinked");
    expect(classifyTrack("משתנה כל 5 שנים צמודה")).toBe("variable_linked");
    expect(classifyTrack("קבועה", { indexed: "yes" })).toBe("fixed_linked");
    expect(classifyTrack("צמודת מט\"ח")).toBe("fx");
    expect(classifyTrack("משהו לא מוכר")).toBe("other");
  });
  it("normalizes offer tracks and summarizes shares", () => {
    const t = fromOfferTracks([
      { type: "פריים", amount: 300000, months: 300, rate: 5.5, rate_type: "משתנה", indexation: "לא צמוד" },
      { type: "קבועה לא צמודה", amount: 400000, months: 300, rate: 4.9, rate_type: "קבועה", indexation: "לא צמוד" },
      { type: "קבועה צמודה", amount: 300000, months: 300, rate: 3.2, rate_type: "קבועה", indexation: "צמוד מדד" },
      { type: "פריים", amount: 0, months: 300, rate: 5 },
    ]);
    expect(t).toHaveLength(3);
    const s = summarizeTracks(t, 2.5)!;
    expect(s.total).toBe(1_000_000);
    expect(s.variableShare).toBeCloseTo(0.3);
    expect(s.linkedShare).toBeCloseTo(0.3);
    expect(s.kinds).toBe(3);
    expect(s.monthly).toBeGreaterThan(s.monthlyWithoutCpi);
  });
  it("returns null summary for empty / zero tracks", () => {
    expect(summarizeTracks([], 2)).toBeNull();
    expect(fromCaseTrackRows(null)).toEqual([]);
  });
  it("projection balance decreases to zero", () => {
    const p = projectTracks([track({ amount: 200000, months: 120 }), track({ amount: 100000, months: 240, kind: "prime", variable: true })], 0);
    expect(p.points[0].balance).toBeCloseTo(300000, 0);
    expect(p.points[p.points.length - 1].balance).toBeLessThan(1);
    expect(p.totalPrincipal).toBeCloseTo(300000, 0);
  });
});

describe("health score", () => {
  it("requires at least 3 factors", () => {
    expect(healthScore({ dti: 0.3, ltv: 0.5 })).toBeNull();
    expect(healthScore({})).toBeNull();
  });
  it("is rounded to 5, banded and explained", () => {
    const h = healthScore({ dti: 0.28, ltv: 0.5, variableShare: 0.3, linkedShare: 0.2, kinds: 3 })!;
    expect(h.score % 5).toBe(0);
    expect(h.band).toBe("good");
    expect(h.reasons.length).toBeGreaterThan(0);
    const bad = healthScore({ dti: 0.55, ltv: 0.8, variableShare: 0.8, rateGap: 1.5 })!;
    expect(bad.band).toBe("review");
    expect(bad.reasons[0]).toMatch(/מחצי|גבוה/);
  });
  it("ignores invalid values instead of scoring them", () => {
    const h = healthScore({ dti: NaN, ltv: 0.6, variableShare: 0.4, kinds: 2, linkedShare: -1 })!;
    expect(h.factors.map((f) => f.key)).toEqual(["ltv", "variable", "mix"]);
    expect(h.missing).toContain("יחס החזר להכנסה");
  });
});

describe("scenarios", () => {
  const mixed = [track({ amount: 500000, rate: 5, kind: "prime", variable: true, months: 300 }), track({ amount: 500000, rate: 4.8, months: 300 })];
  it("rate change affects only variable tracks", () => {
    const up = simulate(mixed, 0, { kind: "rate", delta: 1 });
    expect(up.monthlyDiff).toBeGreaterThan(0);
    expect(up.affectedShare).toBeCloseTo(0.5);
    const fixedOnly = simulate([track({})], 0, { kind: "rate", delta: 1 });
    expect(fixedOnly.monthlyDiff).toBeCloseTo(0);
    expect(fixedOnly.note).toBeTruthy();
  });
  it("rate decrease never goes below 0%", () => {
    const r = simulate([track({ rate: 0.5, kind: "prime", variable: true })], 0, { kind: "rate", delta: -2 });
    expect(finite(r.monthly)).toBe(true);
  });
  it("extra payment and lump sum reduce interest", () => {
    expect(simulate(mixed, 0, { kind: "extra", amount: 1000 }).interestDiff).toBeLessThan(0);
    const lumpPay = simulate(mixed, 0, { kind: "lump", amount: 50000, mode: "payment" });
    const lumpTerm = simulate(mixed, 0, { kind: "lump", amount: 50000, mode: "term" });
    expect(lumpPay.monthlyDiff).toBeLessThan(0);
    expect(Math.abs(lumpTerm.monthlyDiff)).toBeLessThan(1);
    expect(lumpTerm.monthsDiff).toBeLessThan(0);
    expect(lumpTerm.interestDiff).toBeLessThan(lumpPay.interestDiff);
  });
  it("lump sum larger than the balance repays everything", () => {
    const r = simulate(mixed, 0, { kind: "lump", amount: 5_000_000, mode: "payment" });
    expect(r.monthly).toBe(0);
    expect(r.totalInterest).toBe(0);
  });
  it("shorten term raises payment, lowers interest", () => {
    const r = simulate(mixed, 0, { kind: "shorten", years: 5 });
    expect(r.monthlyDiff).toBeGreaterThan(0);
    expect(r.interestDiff).toBeLessThan(0);
  });
  it("empty tracks give zeros, not NaN", () => {
    const r = simulate([], 2, { kind: "extra", amount: 500 });
    expect([r.monthly, r.totalInterest, r.monthlyDiff].every(finite)).toBe(true);
  });
  it("refinance verdicts are cautious", () => {
    expect(refinanceCompare({ balance: 900000, years: 20, currentRate: 5.2, newRate: 4.3, costs: 5000 }).verdict).toBe("potential");
    expect(refinanceCompare({ balance: 900000, years: 20, currentRate: 4.3, newRate: 4.5, costs: 5000 }).verdict).toBe("none");
    const thin = refinanceCompare({ balance: 200000, years: 5, currentRate: 4.5, newRate: 4.3, costs: 8000 });
    expect(["check", "none"]).toContain(thin.verdict);
    const zero = refinanceCompare({ balance: 0, years: 0, currentRate: 0, newRate: 0, costs: 0 });
    expect([zero.current, zero.next, zero.lifetime].every(finite)).toBe(true);
    expect(zero.breakEven).toBeNull();
  });
});

describe("affordability", () => {
  it("returns conservative, reasonable, caution and regulatory points in order", () => {
    const a = affordability({ netIncome: 20000, obligations: 1000, equity: 2_000_000, years: 25, rate: 4.8 })!;
    expect(a.conservative.payment).toBe(4000);           // 25% of income minus obligations
    expect(a.reasonable.from.payment).toBe(4000);
    expect(a.reasonable.to.payment).toBeCloseTo(5600);   // 33%
    expect(a.caution.to.payment).toBeCloseTo(7000);      // 40%
    expect(a.regulatory.payment).toBe(9000);             // 50%, ceiling only
    expect(a.reasonable.to.loan).toBeGreaterThan(a.reasonable.from.loan);
    expect(a.caution.to.loan).toBeGreaterThan(a.reasonable.to.loan);
    expect(a.regulatory.loan).toBeGreaterThan(a.caution.to.loan);
  });
  it("caps every point by the LTV limit for the given equity", () => {
    const a = affordability({ netIncome: 60000, obligations: 0, equity: 600000, years: 25, rate: 4.8 })!;
    // single home: LTV 75% -> equity 600k caps the loan at 1.8M
    expect(a.regulatory.loan).toBeLessThanOrEqual(1_800_000 + 1);
    expect(a.equityLimited).toBe(true);
  });
  it("returns null without income and floors negative payments", () => {
    expect(affordability({ netIncome: 0, obligations: 0, equity: 0, years: 25, rate: 5 })).toBeNull();
    const a = affordability({ netIncome: 5000, obligations: 4000, equity: 0, years: 25, rate: 5 })!;
    expect(a.reasonable.to.payment).toBe(0);
    expect(a.reasonable.to.loan).toBe(0);
  });
  it("repayment ratio", () => {
    expect(repaymentRatio(5000, 0)).toBeNull();
    expect(repaymentRatio(5000, 20000, 1000)).toBeCloseTo(0.3);
  });
  it("dtiBand: comfortable <=33%, caution <=40%, high-risk <=50%, over the ceiling above", () => {
    expect(dtiBand(0.2)!.key).toBe("comfortable");
    expect(dtiBand(0.33)!.key).toBe("comfortable");
    expect(dtiBand(0.36)!.key).toBe("caution");
    expect(dtiBand(0.45)!.key).toBe("high");
    expect(dtiBand(0.45)!.text).toMatch(/בנק ישראל/);
    expect(dtiBand(0.55)!.key).toBe("over");
    expect(dtiBand(null)).toBeNull();
    expect(dtiBand(NaN)).toBeNull();
  });
});

describe("offers", () => {
  const offerA = { id: "a", bank: "בנק א", first_payment: 5000, tracks: [
    { type: "פריים", amount: 600000, months: 300, rate: 5.2, rate_type: "משתנה", indexation: "לא צמוד" },
    { type: "קבועה לא צמודה", amount: 400000, months: 300, rate: 4.9 } ] };
  const offerB = { id: "b", bank: "בנק ב", first_payment: 5600, tracks: [
    { type: "קבועה לא צמודה", amount: 1000000, months: 300, rate: 4.8 } ] };
  it("awards categories instead of a single best", () => {
    const list = compareOffers([offerA, offerB], 2.5);
    const a = list.find((x) => x.id === "a")!, b = list.find((x) => x.id === "b")!;
    expect(a.categories).toContain("lowest_payment");
    expect(a.categories).toContain("most_flexible");
    expect(b.categories).toContain("most_stable");
    expect(a.maxPayment).toBeGreaterThan(a.firstPayment);
    expect(b.maxPayment).toBeNull();
    expect(explainDifferences(list)).toMatch(/בנק/);
  });
  it("single or empty offers get no categories", () => {
    expect(compareOffers([offerA], 2)[0].categories).toEqual([]);
    expect(compareOffers([], 2)).toEqual([]);
    expect(compareOffers([{ id: "x", bank: "x", tracks: [] }], 2)).toEqual([]);
  });
});

describe("progress and next action", () => {
  const base = { status: "Draft", intakeStarted: true, intakeComplete: false, paymentSucceeded: false, missingDocs: 4, docsNeedUpdate: 0, tenderStage: null, offersCount: 0, selectedOffer: false };
  it("always has 9 steps", () => {
    expect(caseProgress(base)).toHaveLength(9);
    expect(caseProgress(base)[0].state).toBe("action");
  });
  it("marks offers done and choice required when offers exist", () => {
    const s = caseProgress({ ...base, status: "BankOfferReceived", intakeComplete: true, paymentSucceeded: true, missingDocs: 0, tenderStage: "offers", offersCount: 3 });
    expect(s.find((x) => x.key === "offers")!.state).toBe("done");
    expect(s.find((x) => x.key === "choose")!.state).toBe("action");
  });
  const na = { status: "Draft", caseType: "new" as const, intakeComplete: false, paymentSucceeded: false, missingDocs: 2, docsNeedUpdate: 0, offersCount: 0, selectedOffer: false };
  it("prioritizes intake, then docs, then payment, then waiting", () => {
    expect(nextAction(na).cta?.href).toBe("/dashboard/personal");
    expect(nextAction({ ...na, intakeComplete: true }).cta?.href).toBe("/dashboard/documents");
    expect(nextAction({ ...na, intakeComplete: true, missingDocs: 0 }).cta?.href).toBe("/dashboard/payment");
    const waiting = nextAction({ ...na, intakeComplete: true, missingDocs: 0, paymentSucceeded: true, tenderStage: "waiting" });
    expect(waiting.tone).toBe("waiting");
    expect(waiting.body).not.toMatch(/72/);
    const offers = nextAction({ ...na, intakeComplete: true, missingDocs: 0, paymentSucceeded: true, tenderStage: "offers", offersCount: 3 });
    expect(offers.title).toMatch(/3 הצעות/);
  });
});

describe("model", () => {
  it("returns nulls and empty states when data is missing", () => {
    const m = buildMortgageModel({ caseType: "new", intakeData: {}, intakeComplete: false, status: "Draft", paymentSucceeded: false });
    expect(m.propertyValue).toBeNull();
    expect(m.loanAmount).toBeNull();
    expect(m.monthlyPayment).toBeNull();
    expect(m.dti).toBeNull();
    expect(m.health).toBeNull();
    expect(m.tracks).toEqual([]);
    expect(m.trackSource).toBeNull();
    expect(m.next.tone).toBe("action");
  });
  it("builds a refinance model from case tracks", () => {
    const m = buildMortgageModel({
      caseType: "refi", status: "InAnalysis", intakeComplete: true, paymentSucceeded: true,
      intakeData: {
        current_mortgage: { totalBalance: 800000, currentMonthlyPayment: 5200, remainingYears: 20 },
        refi_property: { estimatedValue: 2000000 },
        income: { monthlyNetIncome: 18000, b2MonthlyNetIncome: 7000 },
        liabilities: { existingLoanPayments: 1000 },
      },
      caseTrackRows: [
        { track_type: "פריים", principal_balance: 400000, interest_rate: 5.8, is_indexed: false, remaining_years: 20 },
        { track_type: "קבועה צמודה", principal_balance: 400000, interest_rate: 3.9, is_indexed: true, remaining_years: 20 },
      ],
      rates: { prime: 5.5, fixed_not_linked: 4.9, fixed_linked: 3.2, variable_5: 4.6, cpi_annual: 2.6 },
    });
    expect(m.trackSource).toBe("current");
    expect(m.monthlyPayment).toBe(5200);
    expect(m.paymentIsEstimate).toBe(false);
    expect(m.ltv).toBeCloseTo(0.4);
    expect(m.dti).toBeCloseTo(6200 / 25000);
    expect(m.equity).toBe(1200000);
    expect(m.health).not.toBeNull();
    expect(m.health!.score % 5).toBe(0);
  });
  it("labels new-case tracks from market rates as an example", () => {
    const m = buildMortgageModel({
      caseType: "new", status: "Draft", intakeComplete: false, paymentSucceeded: false,
      intakeData: { property: { purchasePrice: 2000000, ownEquity: 600000, requestedMortgage: 1400000 }, mortgage_request: { requestedAmount: 1400000, desiredYears: 25 } },
      rates: { prime: 5.5, fixed_not_linked: 4.9, fixed_linked: 3.2, variable_5: 4.6, cpi_annual: 2.6 },
    });
    expect(m.trackSource).toBe("example");
    expect(m.paymentIsEstimate).toBe(true);
    expect(m.ltv).toBeCloseTo(0.7);
    expect(m.termMonths).toBe(300);
  });
  it("derives document states from validation data", () => {
    const rows = documentRows("new", { deferred_docs: ["purchase_contract"] }, [
      { doc_type: "id_card", ai_extracted_data: { level: "green" } },
      { doc_type: "payslips", ai_extracted_data: { level: "yellow" } },
      { doc_type: "bank_statements", ai_extracted_data: { level: "red" } },
      { doc_type: "appraisal", ai_extracted_data: null },
    ]);
    const st = Object.fromEntries(rows.map((r) => [r.type, r.state]));
    expect(st).toMatchObject({ id_card: "ok", payslips: "review", bank_statements: "update", appraisal: "received", purchase_contract: "missing" });
    expect(rows.find((r) => r.type === "purchase_contract")!.deferred).toBe(true);
  });
});

describe("first month split", () => {
  it("sums to the modelled first payment; linkage uplift is not interest", () => {
    const t = [track({ amount: 600000, rate: 4, months: 300 }), track({ amount: 400000, rate: 3, months: 300, kind: "fixed_linked", linked: true })];
    const s = firstMonthSplit(t, 2.5);
    const total = summarizeTracks(t, 2.5)!.monthly;
    expect(s.principal + s.interest + s.index).toBeCloseTo(total, 4);
    const f = monthlyIndexFactor(2.5);
    // uplift = linked payment indexed once minus the unindexed payment
    expect(s.index).toBeCloseTo(pmt(400000, 3, 300) * (f - 1), 4);
    // interest: unlinked on principal, linked on the indexed principal, at the real rate
    expect(s.interest).toBeCloseTo((600000 * 4) / 1200 + (400000 * f * 3) / 1200, 4);
    expect(firstMonthSplit([], 2)).toEqual({ principal: 0, interest: 0, index: 0 });
  });
});

describe("market reference rate", () => {
  it("averages unlinked market rates only (no CPI blended into a rate)", () => {
    const rates = { prime: 5.5, fixed_not_linked: 4.9, fixed_linked: 3.3, variable_5: 4.6, cpi_annual: 2.6 };
    expect(marketReferenceRate(rates)).toBeCloseTo((5.5 + 4.9 + 4.6) / 3, 2);
    // changing CPI or the linked rate does not move the reference
    expect(marketReferenceRate({ ...rates, cpi_annual: 6, fixed_linked: 1 })).toBe(marketReferenceRate(rates));
    expect(marketReferenceRate(null)).toBeNull();
  });
});

describe("CPI-linked tracks: indexation modelled separately from interest", () => {
  const P = 500_000, RATE = 3, N = 240, CPI = 3;
  it("unlinked schedule is unchanged by the CPI parameter being 0", () => {
    const a = schedule(P, 4, N), b = schedule(P, 4, N, 0, 0);
    expect(b.monthly).toBeCloseTo(a.monthly, 8);
    expect(b.totalIndexation).toBe(0);
    expect(b.lastMonthly).toBeCloseTo(b.monthly, 6); // fixed Spitzer payment
  });
  it("total paid = original principal + interest + indexation, and the loan ends at zero", () => {
    const s = schedule(P, RATE, N, 0, CPI);
    expect(s.months).toBe(N);
    expect(s.points[s.points.length - 1].balance).toBeLessThan(1);
    expect(s.totalIndexation).toBeGreaterThan(0);
    expect(s.totalPaid).toBeCloseTo(P + s.totalInterest + s.totalIndexation, 2);
  });
  it("first month: principal is indexed first, interest is charged on the indexed principal at the real rate", () => {
    const s = schedule(P, RATE, N, 0, CPI);
    const f = monthlyIndexFactor(CPI);
    expect(f).toBeCloseTo(Math.pow(1.03, 1 / 12), 12);
    expect(s.monthly).toBeCloseTo(pmt(P, RATE, N) * f, 6);
    expect(s.points[1].indexationPaid).toBeGreaterThan(0);
  });
  it("payment grows with CPI in nominal terms but is constant in real terms", () => {
    const s = schedule(P, RATE, N, 0, CPI);
    const f = monthlyIndexFactor(CPI);
    expect(s.lastMonthly).toBeGreaterThan(s.monthly * 1.5);
    expect(s.lastMonthly / Math.pow(f, N)).toBeCloseTo(pmt(P, RATE, N), 4);
  });
  it("is NOT the same as adding CPI to the interest rate", () => {
    const linked = schedule(P, RATE, N, 0, CPI);
    const naive = schedule(P, RATE + CPI, N);
    // naive model books all of it as interest and keeps the payment flat
    expect(linked.totalInterest).toBeLessThan(naive.totalInterest);
    expect(Math.abs(linked.monthly - naive.monthly)).toBeGreaterThan(100);
    expect(naive.totalIndexation).toBe(0);
  });
  it("early-year nominal balance can rise when indexation exceeds the principal repaid", () => {
    const s = schedule(1_000_000, 1, 360, 0, 4);
    expect(s.points[1].balance).toBeGreaterThan(1_000_000);
  });
  it("track summary and projection keep interest and indexation apart; unlinked tracks never index", () => {
    const tr = [track({ amount: 300000, rate: 5, months: 240 }), track({ amount: 200000, rate: 3, months: 240, kind: "fixed_linked", linked: true })];
    const p = projectTracks(tr, 2.5);
    const linkedOnly = schedule(200000, 3, 240, 0, 2.5);
    expect(p.totalIndexation).toBeCloseTo(linkedOnly.totalIndexation, 4);
    expect(p.totalCost).toBeCloseTo(500000 + p.totalInterest + p.totalIndexation, 2);
    expect(projectTracks([track({ amount: 300000 })], 5).totalIndexation).toBe(0);
  });
  it("scenarios: rate shock leaves fixed linked tracks alone; extra payment cuts indexation too; refi removes indexation", () => {
    const linkedFixed = [track({ amount: 400000, rate: 3, months: 240, kind: "fixed_linked", linked: true })];
    expect(simulate(linkedFixed, 3, { kind: "rate", delta: 1 }).monthlyDiff).toBeCloseTo(0, 6);
    const extra = simulate(linkedFixed, 3, { kind: "extra", amount: 1000 });
    expect(extra.indexationDiff).toBeLessThan(0);
    expect(extra.costDiff).toBeCloseTo(extra.interestDiff + extra.indexationDiff, 4);
    const base = simulate(linkedFixed, 3, { kind: "base" });
    const refi = simulate(linkedFixed, 3, { kind: "refi", rate: 4.5, costs: 0 });
    expect(refi.totalIndexation).toBe(0);
    expect(refi.indexationDiff).toBeCloseTo(-base.totalIndexation, 4);
  });
  it("offers: linked offers carry indexation inside total cost, shown separately", () => {
    const off = compareOffers([
      { id: "l", bank: "צמודה", tracks: [{ type: "קבועה צמודה", amount: 1_000_000, months: 300, rate: 3.2, indexation: "צמוד מדד" }] },
      { id: "u", bank: "לא צמודה", tracks: [{ type: "קבועה לא צמודה", amount: 1_000_000, months: 300, rate: 4.9 }] },
    ], 2.6);
    const l = off.find((o) => o.id === "l")!, u = off.find((o) => o.id === "u")!;
    expect(l.totalIndexation).toBeGreaterThan(0);
    expect(u.totalIndexation).toBe(0);
    expect(l.totalCost).toBeCloseTo(1_000_000 + l.totalInterest + l.totalIndexation, 2);
  });
  it("example mixes from the quick check are converted back to real rates before indexing", () => {
    const t = fromMixTracks([{ key: "fixed_linked", amount: 100000, years: 20, rate: 3.3 + 2.6 }], 2.6);
    expect(t[0].rate).toBeCloseTo(3.3, 8);
    expect(t[0].linked).toBe(true);
  });
  it("stays finite for zero / huge values with CPI", () => {
    expect(schedule(0, 3, 240, 0, 3).totalIndexation).toBe(0);
    const big = schedule(1e10, 3, 360, 0, 10);
    expect([big.monthly, big.totalInterest, big.totalIndexation].every(Number.isFinite)).toBe(true);
  });
});

describe("real-data audit rules", () => {
  const rates = { prime: 5.5, fixed_not_linked: 4.9, fixed_linked: 3.3, variable_5: 4.6, cpi_annual: 2.6 };
  it("example mix is picked by composition (middle variable share), not by the cost label", () => {
    const mixes = [
      { tracks: [{ key: "prime", amount: 500 }, { key: "variable_5", amount: 300 }, { key: "fixed_not_linked", amount: 200 }] }, // 80%
      { tracks: [{ key: "fixed_not_linked", amount: 340 }, { key: "prime", amount: 330 }, { key: "variable_5", amount: 330 }] }, // 66%
      { tracks: [{ key: "fixed_not_linked", amount: 500 }, { key: "fixed_linked", amount: 200 }, { key: "prime", amount: 300 }] }, // 30%
    ];
    expect(balancedByComposition(mixes).map((t: { key: string }) => t.key)).toEqual(["fixed_not_linked", "prime", "variable_5"]);
    expect(balancedByComposition([])).toEqual([]);
  });
  it("never substitutes an example mix when real offers exist; shows the offers' payment range instead", () => {
    const m = buildMortgageModel({
      caseType: "new", status: "BankOfferReceived", intakeComplete: true, paymentSucceeded: true, rates,
      intakeData: { property: { purchasePrice: 2400000, ownEquity: 800000, requestedMortgage: 1600000 }, income: { monthlyNetIncome: 30000 } },
      tender: { stage: "offers", selected_offer_id: null, banks: [
        { slot: 1, bank_name: "א", offers: [{ id: "o1", version: 1, first_payment: 8600, tracks: [{ type: "קבועה לא צמודה", amount: 1600000, months: 300, rate: 4.8 }] }] },
        { slot: 2, bank_name: "ב", offers: [{ id: "o2", version: 1, first_payment: 9400, tracks: [{ type: "פריים", amount: 1600000, months: 300, rate: 5.4 }] }] },
      ] },
    });
    expect(m.trackSource).toBeNull();
    expect(m.tracks).toEqual([]);
    expect(m.monthlyPayment).toBeNull();
    expect(m.offerPaymentRange).toEqual({ min: 8600, max: 9400 });
    expect(m.dtiRange!.min).toBeCloseTo(8600 / 30000);
  });
  it("unknown obligations are flagged instead of shown as a real 0", () => {
    const m = buildMortgageModel({ caseType: "new", status: "Draft", intakeComplete: false, paymentSucceeded: false, intakeData: { property: { purchasePrice: 1900000 } } });
    expect(m.obligationsKnown).toBe(false);
    expect(m.ltv).toBeNull();
    expect(m.propertyValue).toBe(1900000);
  });
  it("presented offers mean the rate negotiation step is done; choosing is the action", () => {
    const s = caseProgress({ status: "BankOfferReceived", intakeStarted: true, intakeComplete: true, paymentSucceeded: true, missingDocs: 0, docsNeedUpdate: 0, tenderStage: "offers", offersCount: 3, selectedOffer: false });
    expect(s.find((x) => x.key === "negotiation")!.state).toBe("done");
    expect(s.find((x) => x.state !== "done")!.key).toBe("choose");
  });
});
