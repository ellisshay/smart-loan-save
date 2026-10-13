import { describe, it, expect } from "vitest";
import { buildMixes, ltvGrade, dtiGrade, Rates } from "./quickCheck";

const RISK_ORDER = ["נמוך", "בינוני", "גבוה"];
const scenarios: Rates[] = [
  { prime: 6, fixed_not_linked: 5, fixed_linked: 3.5, variable_5: 4.8, cpi_annual: 3 },
  { prime: 3, fixed_not_linked: 6, fixed_linked: 5, variable_5: 5.5, cpi_annual: 0 },
  { prime: 5.5, fixed_not_linked: 4.2, fixed_linked: 2, variable_5: 6.5, cpi_annual: 1 },
];

describe("quick check mixes", () => {
  it("a lower-risk mix is never cheaper on both monthly and total payment", () => {
    for (const r of scenarios) for (const [loan, years] of [[1_000_000, 25], [450_000, 12], [2_300_000, 30]]) {
      const mixes = buildMixes(loan, years, r);
      expect(mixes.map((m) => m.risk)).toEqual(RISK_ORDER);
      for (let i = 0; i < mixes.length; i++) for (let j = i + 1; j < mixes.length; j++) {
        const safer = mixes[i], riskier = mixes[j];
        expect(safer.monthly < riskier.monthly && safer.total < riskier.total).toBe(false);
      }
    }
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
