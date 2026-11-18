import { describe, it, expect } from "vitest";
import { analyzeBalanceTrack, parseInput, referenceDates, summarizeBalance, type BalanceTrack } from "./balanceCheck";

const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, variable_5_linked: 3, updated_at: "2026-10-01T00:00:00Z" };
const t = (o: Partial<BalanceTrack>): BalanceTrack => ({ type: "fixed_nl", balance: 400_000, rate: 6, years: 18.5, ...o });

describe("balance check first look (#52)", () => {
  it("missing data is incomplete with the missing fields named, never a zero saving", () => {
    const r = analyzeBalanceTrack(t({ rate: null, years: null }), rates);
    expect(r).toEqual({ status: "incomplete", missing: ["ריבית", "תקופה שנותרה"], gap: null, monthlyDiff: null });
    const s = summarizeBalance([r]);
    expect(s.knownMonthlyDiff).toBeNull();
    expect(s.notComputed).toBe(1);
  });
  it("empty input parses to null, not 0; decimals are kept", () => {
    expect(parseInput("")).toBeNull();
    expect(parseInput("0")).toBeNull();
    expect(parseInput("18.75")).toBe(18.75);
    expect(parseInput("1,250,000")).toBe(1_250_000);
  });
  it("linked tracks need a linkage review: the gap is shown, no shekel figure from the rate alone", () => {
    for (const type of ["fixed_l", "var_l"] as const) {
      const r = analyzeBalanceTrack(t({ type, rate: 4.5 }), rates);
      expect(r.status).toBe("linked_review");
      expect(r.gap).toBe(1.5);
      expect(r.monthlyDiff).toBeNull();
    }
    expect(analyzeBalanceTrack(t({ type: "var_l" }), { ...rates, variable_5_linked: null }).status).toBe("linked_review");
  });
  it("no reference rate: no comparison and no number", () => {
    const r = analyzeBalanceTrack(t({ type: "prime" }), { ...rates, prime: null });
    expect(r).toMatchObject({ status: "no_reference", gap: null, monthlyDiff: null });
  });
  it("good existing terms are flagged to keep, with no refinance figure", () => {
    const r = analyzeBalanceTrack(t({ rate: 3.2 }), rates);
    expect(r.status).toBe("keep_terms");
    expect(r.monthlyDiff).toBeNull();
    expect(summarizeBalance([r]).keep).toBe(1);
  });
  it("a small gap is 'near reference', never a green 'efficient' verdict", () => {
    expect(analyzeBalanceTrack(t({ rate: 5.1 }), rates).status).toBe("near_reference");
  });
  it("a real gap gives a scenario difference on the same balance and term", () => {
    const r = analyzeBalanceTrack(t({ balance: 500_000, rate: 6, years: 20 }), rates);
    expect(r.status).toBe("worth_checking_strong");
    // PMT(500k, 6%, 240) - PMT(500k, 5%, 240) = 3582.16 - 3299.78
    expect(r.monthlyDiff!).toBeCloseTo(282.38, 1);
  });
  it("summary adds only computed tracks and counts the rest separately", () => {
    const res = [
      analyzeBalanceTrack(t({ balance: 500_000, rate: 6, years: 20 }), rates),
      analyzeBalanceTrack(t({ type: "fixed_l", rate: 4 }), rates),
      analyzeBalanceTrack(t({ balance: null }), rates),
      analyzeBalanceTrack(t({ rate: 3 }), rates),
    ];
    const s = summarizeBalance(res);
    expect(s.knownMonthlyDiff!).toBeCloseTo(282.38, 1);
    expect(s).toMatchObject({ notComputed: 2, keep: 1, worthChecking: 1 });
  });
  it("prime has its own freshness date when the daily job stamped it", () => {
    expect(referenceDates({ ...rates, prime_updated_at: "2026-11-18T03:00:00Z" })).toEqual({ prime: "2026-11-18T03:00:00Z", others: "2026-10-01T00:00:00Z" });
    expect(referenceDates(rates).prime).toBe("2026-10-01T00:00:00Z");
  });
});

describe("balance check: unidentified track type (#52 stage 2)", () => {
  it("is incomplete until the user picks a type, never guessed", () => {
    const r = analyzeBalanceTrack({ type: "unknown", balance: 300000, rate: 4, years: 10 }, rates);
    expect(r).toMatchObject({ status: "incomplete", missing: ["סוג מסלול"] });
  });
});
