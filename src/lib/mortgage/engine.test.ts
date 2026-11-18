import { describe, it, expect } from "vitest";
import { BASE_ASSUMPTIONS, changeTerm, evaluate, evaluateNewMixes, existingAlternatives, fromSimpleTracks, newMortgageNeeds, prepay, refinance, refinanceEach, runPlan, snapshot, stressOf, trackRows, type EngineTrack } from "./engine";
import { pmt } from "./amortization";

const T = (o: Partial<EngineTrack>): EngineTrack => ({ id: "a", label: "א", balance: 500_000, rate: 5, months: 240, linked: false, behavior: "fixed", prepaymentFee: 0, ...o });
const A0 = BASE_ASSUMPTIONS(0), A3 = BASE_ASSUMPTIONS(3);
const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, variable_5_linked: 3 };

describe("engine: cash flow with known answers", () => {
  it("fixed unlinked: constant annuity, totals match the closed form", () => {
    const p = runPlan([T({})], A0);
    const m = pmt(500_000, 5, 240); // 3,299.78
    expect(p.months).toBe(240);
    expect(p.firstPayment).toBeCloseTo(m, 2);
    expect(p.maxPayment).toBeCloseTo(m, 2);
    expect(p.totalPaid).toBeCloseTo(m * 240, 0);
    expect(p.totalInterest).toBeCloseTo(m * 240 - 500_000, 0);
    expect(p.rows[239].balance).toBeLessThan(0.01);
  });
  it("linked: principal is indexed monthly, the payment rises with CPI, indexation is counted", () => {
    const p = runPlan([T({ linked: true, rate: 3 })], A3);
    const f = Math.pow(1.03, 1 / 12);
    expect(p.firstPayment).toBeCloseTo(pmt(500_000 * f, 3, 240), 2);
    expect(p.rows[239].payment).toBeGreaterThan(p.firstPayment * 1.7); // ~1.03^20 = 1.806
    expect(p.totalIndexation).toBeGreaterThan(150_000);
    expect(p.notes.join(" ")).toContain("3%");
  });
  it("prime: a rate shift applies from month 1; reset track: only from its change date", () => {
    const shock = { cpiAnnual: 0, primeShift: 2, resetShift: 2 };
    expect(runPlan([T({ behavior: "prime" })], shock).firstPayment).toBeCloseTo(pmt(500_000, 7, 240), 2);
    const rows = trackRows(T({ behavior: "reset", nextResetMonth: 37 }), shock);
    expect(rows[35].payment).toBeCloseTo(pmt(500_000, 5, 240), 2);
    expect(rows[36].payment).toBeGreaterThan(rows[35].payment + 300);
    // Unknown change date: assumed at month 1, and said so.
    const p = runPlan([T({ behavior: "reset", nextResetMonth: null })], shock);
    expect(p.firstPayment).toBeCloseTo(pmt(500_000, 7, 240), 2);
    expect(p.notes.join(" ")).toContain("מועד שינוי הריבית לא ידוע");
  });
  it("stress peak covers the first five years: a linked track's long CPI drift is not counted as rate risk", () => {
    const linked = [T({ linked: true, rate: 3 })];
    const s = runPlan(linked, stressOf(A3)), b = runPlan(linked, A3);
    expect(s.peakPayment).toBeLessThan(s.maxPayment * 0.8);
    expect(s.peakPayment).toBeGreaterThan(b.peakPayment); // CPI +1 still raises the five-year peak
  });
  it("fractional months are paid as ceil(months) instalments, not rounded down", () => {
    expect(runPlan([T({ months: 119.5 })], A0).months).toBe(120);
  });
});

describe("engine: alternatives against the baseline", () => {
  it("extending the term lowers the payment but raises the total cost: never a saving", () => {
    const base = [T({ prepaymentFee: 0 })];
    const ext = changeTerm(base, 60); ext.oneOffCosts = 0; ext.missing = [];
    const [, e] = evaluate(base, [ext], A0);
    expect(e.extendsTerm).toBe(true);
    expect(e.vsBaseline.firstPayment).toBeLessThan(-300);
    expect(e.vsBaseline.totalCost!).toBeGreaterThan(50_000);
    expect(e.outcome).toBe("lower_payment_higher_total");
  });
  it("extension with unknown bank costs: still flagged as raising the total cost (costs can only add)", () => {
    const base = [T({})];
    const [, e] = evaluate(base, [changeTerm(base, 60)], A0);
    expect(e.vsBaseline.totalCost).toBeNull();
    expect(e.vsBaseline.totalCostAtLeast!).toBeGreaterThan(50_000);
    expect(e.outcome).toBe("lower_payment_higher_total");
  });
  it("unknown fees keep the result incomplete; known fees are added to the cost", () => {
    const base = [T({ rate: 6.5, prepaymentFee: null })];
    const unknown = refinance(base, "all", { rate: 5, behavior: "fixed", linked: false }, 5_000);
    expect(evaluate(base, [unknown], A0)[1].outcome).toBe("incomplete");
    const known = refinance([T({ rate: 6.5, prepaymentFee: 12_000 })], "all", { rate: 5, behavior: "fixed", linked: false }, 5_000);
    const [, r] = evaluate([T({ rate: 6.5, prepaymentFee: 12_000 })], [known], A0);
    expect(r.oneOffCosts).toBe(17_000);
    expect(r.outcome).toBe("lower_total_cost");
    // 6.5% -> 5% on 500k/240m: payment drops by ~428/month, so 17k is repaid in ~40 months.
    expect(r.vsBaseline.breakEvenMonths).toBe(Math.ceil(17_000 / (pmt(500_000, 6.5, 240) - pmt(500_000, 5, 240))));
  });
  it("good existing terms: refinancing at reference rates costs more, so it is not presented as a gain", () => {
    const good = [T({ id: "g", rate: 3.2, prepaymentFee: 0 })];
    const alts = existingAlternatives(good, rates, { switchingCosts: 4_000, goal: "lower_total", cpiAnnual: 0 });
    expect(alts.some((a) => a.kind === "refi_partial")).toBe(false); // nothing is above reference
    const ev = evaluate(good, alts, A0);
    const full = ev.find((x) => x.kind === "refi_full")!;
    expect(full.outcome).toBe("higher_cost");
    expect(ev.filter((x) => x.outcome === "lower_total_cost")).toEqual([]);
  });
  it("partial refinance moves only the expensive tracks, each at its own type's reference", () => {
    const base = [T({ id: "fx", rate: 6.4 }), T({ id: "pr", behavior: "prime", rate: 5.8 }), T({ id: "lk", linked: true, rate: 2.1 })];
    const alt = refinanceEach(base, ["fx"], rates, 3_000);
    expect(alt.tracks.map((t) => [t.id, t.rate])).toEqual([["fx-new", 5], ["pr", 5.8], ["lk", 2.1]]);
    expect(alt.oneOffCosts).toBe(3_000);
  });
  it("prepayment hits the most expensive track first and, keeping the payment, ends sooner", () => {
    const base = [T({ id: "cheap", rate: 3, balance: 300_000 }), T({ id: "dear", rate: 6, balance: 200_000 })];
    const alt = prepay(base, 100_000, "term", 0);
    expect(alt.tracks.find((t) => t.id === "dear")!.balance).toBe(100_000);
    expect(alt.tracks.find((t) => t.id === "cheap")!.balance).toBe(300_000);
    const [b, p] = evaluate(base, [alt], A0);
    expect(alt.tracks.find((t) => t.id === "dear")!.months).toBeLessThan(240); // same payment, shorter track
    // Whole months only: the payment stays within 1% of today's.
    expect(Math.abs(p.base.firstPayment - b.base.firstPayment)).toBeLessThan(b.base.firstPayment * 0.01);
    expect(p.outcome).toBe("lower_total_cost");
    expect(alt.lumpSum).toBe(100_000);
  });
  it("prepayment with an unknown fee is incomplete", () => {
    expect(prepay([T({ prepaymentFee: null })], 50_000, "payment", 0).missing).toEqual(["עמלת פירעון מוקדם"]);
  });
  it("stress raises variable-heavy plans more than fixed ones", () => {
    const fixed = runPlan([T({})], stressOf(A3)).peakPayment - runPlan([T({})], A3).peakPayment;
    const prime = runPlan([T({ behavior: "prime" })], stressOf(A3)).peakPayment - runPlan([T({ behavior: "prime" })], A3).peakPayment;
    expect(fixed).toBeCloseTo(0, 6);
    expect(prime).toBeGreaterThan(500);
  });
});

describe("engine: snapshot and adapters", () => {
  it("cost, stability and fit axes", () => {
    const s = snapshot([T({ id: "fx", rate: 6, balance: 300_000 }), T({ id: "pr", behavior: "prime", rate: 6, balance: 200_000 })], rates, A3, 20_000, 1_000);
    expect(s.cost.weightedGap).toBeCloseTo(0.6, 6); // (1*300k + 0*200k)/500k
    expect(s.cost.aboveShare).toBeCloseTo(0.6, 6);
    expect(s.stability.variableShare).toBeCloseTo(0.4, 6);
    expect(s.stability.stressJump).toBeGreaterThan(0);
    expect(s.fit.band?.key).toBeDefined();
  });
  it("simple tracks with unknown values are skipped, not zeroed", () => {
    const r = fromSimpleTracks([{ type: "prime", balance: 100_000, rate: 5.5, years: 15.5 }, { type: "fixed_nl", balance: null, rate: 4, years: 10 }, { type: "unknown", balance: 1, rate: 1, years: 1 }]);
    expect(r.tracks).toHaveLength(1);
    expect(r.tracks[0].months).toBe(186);
    expect(r.skipped).toEqual([1, 2]);
  });
});

describe("engine: new mortgage", () => {
  it("purchase costs come out of equity; LTV checked against the cap for the deal type", () => {
    const n = newMortgageNeeds({ price: 2_000_000, equity: 600_000, purchaseCosts: 100_000, purpose: "single", netIncome: 25_000, obligations: 0, targetPayment: 8_000, years: 25 });
    expect(n.loan).toBe(1_500_000);
    expect(n.ltv).toBe(0.75);
    expect(n.overLtv).toBe(false);
    const up = newMortgageNeeds({ price: 2_000_000, equity: 600_000, purchaseCosts: 100_000, purpose: "upgrade", netIncome: null, obligations: 0, targetPayment: null, years: 25 });
    expect(up.overLtv).toBe(true);
    expect(up.missing).toContain("הכנסה נטו של משק הבית");
    const unknownCosts = newMortgageNeeds({ price: 2_000_000, equity: 600_000, purchaseCosts: null, purpose: "single", netIncome: 1, obligations: 0, targetPayment: null, years: 25 });
    expect(unknownCosts.costsIncluded).toBe(false);
    expect(unknownCosts.missing[0]).toMatch(/עלויות הרכישה/);
  });
  it("mix fit is judged under stress, against income and the target payment", () => {
    const input = { price: 2_000_000, equity: 600_000, purchaseCosts: 100_000, purpose: "single" as const, netIncome: 25_000, obligations: 0, targetPayment: 9_000, years: 25 };
    const [fixed, variable] = evaluateNewMixes([
      { name: "קבוע", tracks: [T({ balance: 1_500_000, months: 300, rate: 5 })] },
      { name: "משתנה", tracks: [T({ balance: 1_500_000, months: 300, rate: 4.5, behavior: "prime" })] },
    ], input, A3);
    expect(variable.base.firstPayment).toBeLessThan(fixed.base.firstPayment); // cheaper today...
    expect(variable.stress.peakPayment).toBeGreaterThan(fixed.stress.peakPayment); // ...riskier under stress
    expect(fixed.withinTarget).toBe(true);
    expect(variable.withinTarget).toBe(false);
  });
});
