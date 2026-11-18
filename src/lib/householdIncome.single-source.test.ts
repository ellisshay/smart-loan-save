import { afterEach, describe, expect, it } from "vitest";
import { householdIncomeSummary, householdNetIncome } from "./householdIncome";
import { householdNetIncome as serverHouseholdNetIncome } from "../../supabase/functions/_shared/householdIncome";
import { quizToIntake } from "@/hooks/useIntakeForm";
import { buildMortgageModel } from "@/lib/mortgage/model";

describe("one source of truth for income (#44)", () => {
  it("estimate 20,000 then detailed salary 20,000 gives 20,000, not 40,000", () => {
    const s = householdIncomeSummary({ monthlyNetIncome: 20000, averageNet3Months: 20000, grossSalary: 26000 } as never, false, 20000);
    expect(s).toEqual({ total: 20000, source: "detailed", missing: [] });
  });

  it("two borrowers 15,000 + 10,000 with a household estimate of 25,000 gives 25,000, not 50,000", () => {
    const s = householdIncomeSummary({ monthlyNetIncome: 15000, b2MonthlyNetIncome: 10000 }, true, 25000);
    expect(s.total).toBe(25000);
    expect(s.source).toBe("detailed");
  });

  it("updating a salary replaces the old value", () => {
    const first = householdIncomeSummary({ monthlyNetIncome: 15000, b2MonthlyNetIncome: 10000 }, true, 25000).total;
    const updated = householdIncomeSummary({ monthlyNetIncome: 16000, b2MonthlyNetIncome: 10000 }, true, 25000).total;
    expect([first, updated]).toEqual([25000, 26000]);
  });

  it("the estimate is used only until income is entered, and is marked as an estimate", () => {
    expect(householdIncomeSummary({}, true, 25000)).toEqual({ total: 25000, source: "estimate", missing: ["borrower1", "borrower2"] });
  });

  it("partial detail is flagged, not completed from the estimate", () => {
    expect(householdIncomeSummary({ monthlyNetIncome: 15000 }, true, 25000)).toEqual({ total: 15000, source: "detailed", missing: ["borrower2"] });
  });

  it("the server copy computes exactly what the browser computes", () => {
    const cases: [Record<string, unknown>, boolean][] = [
      [{ monthlyNetIncome: 15000, b2MonthlyNetIncome: 10000 }, true],
      [{ monthlyNetIncome: 15000, b2MonthlyNetIncome: 10000 }, false],
      [{ monthlyNetIncome: "20000", hasAdditionalIncome: "yes", rentalIncome: 3000, b2HasAdditionalIncome: "yes", b2AdditionalIncomeAmount: 900 }, true],
      [{ monthlyNetIncome: -5, otherIncome: 100, hasAdditionalIncome: "no" }, false],
    ];
    for (const [inc, two] of cases) expect(serverHouseholdNetIncome(inc, two)).toBe(householdNetIncome(inc, two));
  });
});

describe("quick check prefill", () => {
  afterEach(() => localStorage.clear());
  const qc = (borrowers: string) =>
    localStorage.setItem("easymort_quick_check", JSON.stringify({ answers: { goal: "new", borrowers, income: 25000 } }));

  it("two borrowers: the household estimate is not written into borrower 1's income", () => {
    qc("2");
    const out = quizToIntake();
    expect(out.income?.monthlyNetIncome).toBeUndefined();
    expect(out.quick_check.answers.income).toBe(25000);
  });

  it("one borrower: the estimate prefills that borrower's income, which the user then replaces", () => {
    qc("1");
    expect(quizToIntake().income?.monthlyNetIncome).toBe(25000);
  });
});

describe("the mortgage model uses the same total", () => {
  it("does not count a second borrower when there is only one", () => {
    const m = buildMortgageModel({
      caseType: "new",
      intakeData: { personal: { borrowerCount: "1" }, income: { monthlyNetIncome: 20000, b2MonthlyNetIncome: 20000 } },
    } as never);
    expect(m.income).toBe(20000);
  });
  it("counts both borrowers when there are two", () => {
    const m = buildMortgageModel({
      caseType: "new",
      intakeData: { personal: { borrowerCount: "2" }, income: { monthlyNetIncome: 15000, b2MonthlyNetIncome: 10000 } },
    } as never);
    expect(m.income).toBe(25000);
  });
});

import { hasSecondBorrower } from "./householdIncome";
describe("hasSecondBorrower", () => {
  it("an explicit single borrower drops borrower 2, an explicit two keeps them", () => {
    expect(hasSecondBorrower("1", { b2MonthlyNetIncome: 7000 })).toBe(false);
    expect(hasSecondBorrower("2", {})).toBe(true);
  });
  it("an older case without a count keeps borrower 2 when they have income", () => {
    expect(hasSecondBorrower(undefined, { b2MonthlyNetIncome: 7000 })).toBe(true);
    expect(hasSecondBorrower(undefined, {})).toBe(false);
  });
});
