import { describe, it, expect } from "vitest";
import { buildMixes, compositionExposure, effectiveRate, exposureLabel, ltvGrade, dtiGrade, missingRates, Rates } from "./quickCheck";
import { pmt as amortPmt } from "@/lib/mortgage/amortization";

const scenarios: Rates[] = [
  { prime: 6, fixed_not_linked: 5, fixed_linked: 3.5, variable_5: 4.8, cpi_annual: 3 },
  { prime: 3, fixed_not_linked: 6, fixed_linked: 5, variable_5: 5.5, cpi_annual: 0 },
  { prime: 5.5, fixed_not_linked: 4.2, fixed_linked: 2, variable_5: 6.5, cpi_annual: 1 },
];

describe("quick check mixes (#52)", () => {
  it("exposure labels come from composition, the same whatever the rates and prices", () => {
    const labels = scenarios.map((r) => buildMixes(1_000_000, 25, r).map((m) => `${m.name}:${m.risk}`));
    expect(labels[0]).toEqual(["תמהיל יציב:נמוך", "תמהיל מאוזן:בינוני", "תמהיל גמיש:גבוה"]);
    expect(labels[1]).toEqual(labels[0]);
    expect(labels[2]).toEqual(labels[0]);
  });
  it("a cheaper low-exposure mix keeps its low-exposure label (no relabelling by price)", () => {
    // Fixed rates far below variable ones: the stable mix is also the cheapest.
    const r: Rates = { prime: 9, fixed_not_linked: 3, fixed_linked: 1, variable_5: 9, cpi_annual: 1 };
    const mixes = buildMixes(1_000_000, 25, r);
    const stable = mixes.find((m) => m.name === "תמהיל יציב")!;
    expect(stable.risk).toBe("נמוך");
    expect(Math.min(...mixes.map((m) => m.total))).toBe(stable.total);
  });
  it("label does not depend on which other mixes are shown", () => {
    expect(exposureLabel(compositionExposure([{ key: "fixed_not_linked", amount: 1 }]))).toBe("נמוך");
    expect(exposureLabel(compositionExposure([{ key: "prime", amount: 1 }]))).toBe("גבוה");
  });
  it("a missing rate is unknown, never zero: mixes that need it are left out", () => {
    const r: Rates = { prime: 6, fixed_not_linked: null, fixed_linked: 3, variable_5: 5, cpi_annual: 2 };
    expect(effectiveRate("fixed_not_linked", r)).toBeNull();
    expect(buildMixes(1_000_000, 25, r)).toEqual([]); // every example mix has a fixed unlinked part
    expect(missingRates(["prime", "fixed_not_linked"], r)).toEqual(["קבועה לא צמודה"]);
    expect(buildMixes(1_000_000, 25, { prime: 0, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, cpi_annual: 2 })).toEqual([]);
  });
  it("a linked track needs a CPI assumption; without it the mix is not priced", () => {
    const r: Rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, cpi_annual: null };
    expect(effectiveRate("fixed_linked", r)).toBeNull();
    expect(buildMixes(1_000_000, 25, r).map((m) => m.name)).toEqual(["תמהיל מאוזן", "תמהיל גמיש"]);
    expect(missingRates(["fixed_linked"], r)).toEqual(["הנחת מדד"]);
  });
  it("linked principal is indexed: total cost grows with the CPI assumption, first payment is the real-rate payment", () => {
    const base = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5 };
    const lo = buildMixes(1_000_000, 25, { ...base, cpi_annual: 0 })[0];
    const hi = buildMixes(1_000_000, 25, { ...base, cpi_annual: 3 })[0];
    expect(hi.total).toBeGreaterThan(lo.total);
    const linkedAmount = hi.tracks.find((t) => t.key === "fixed_linked")!.amount;
    const unlinkedPart = hi.tracks.filter((t) => t.key !== "fixed_linked").reduce((a, t) => a + amortPmt(t.amount, t.rate, t.years * 12), 0);
    const linkedFirst = hi.monthly - unlinkedPart;
    // First linked payment: real-rate annuity on a principal indexed by one month of CPI.
    expect(linkedFirst).toBeGreaterThan(amortPmt(linkedAmount, 3, 300));
    expect(linkedFirst).toBeLessThan(amortPmt(linkedAmount, 3, 300) * 1.005);
  });
  it("stress test raises only variable tracks; more variable exposure means a bigger stress jump", () => {
    const [stable, balanced, flexible] = buildMixes(1_000_000, 25, scenarios[0]);
    const jump = (m: typeof stable) => m.stressMonthly - m.monthly;
    expect(jump(stable)).toBeGreaterThan(0);
    expect(jump(balanced)).toBeGreaterThan(jump(stable));
    expect(jump(flexible)).toBeGreaterThan(jump(balanced));
  });
  it("track amounts add up to the loan (within rounding)", () => {
    for (const m of buildMixes(1_000_000, 25, scenarios[0])) {
      expect(Math.abs(m.tracks.reduce((a, t) => a + t.amount, 0) - 1_000_000)).toBeLessThanOrEqual(3);
    }
  });
  it("grades LTV at 60/75 and DTI at 30/40", () => {
    expect([ltvGrade(60), ltvGrade(75), ltvGrade(76)]).toEqual(["מצוין", "אפשרי", "גבולי"]);
    expect([dtiGrade(30), dtiGrade(40), dtiGrade(41)]).toEqual(["מצוין", "אפשרי", "גבולי"]);
  });
});
