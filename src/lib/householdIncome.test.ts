import { describe, expect, it } from "vitest";
import { householdNetIncome } from "./householdIncome";

const base = { monthlyNetIncome: 20000, b2MonthlyNetIncome: 35000 };

describe("householdNetIncome", () => {
  it("adds both borrowers' net income", () => {
    expect(householdNetIncome(base, true)).toBe(55000);
  });
  it("a removed second borrower contributes nothing, including additional income", () => {
    expect(householdNetIncome({ ...base, b2HasAdditionalIncome: "yes", b2AdditionalIncomeAmount: 4000 }, false)).toBe(20000);
  });
  it("counts borrower 2's additional income only when marked yes", () => {
    expect(householdNetIncome({ ...base, b2HasAdditionalIncome: "yes", b2AdditionalIncomeAmount: 4000 }, true)).toBe(59000);
    expect(householdNetIncome({ ...base, b2HasAdditionalIncome: "no", b2AdditionalIncomeAmount: 4000 }, true)).toBe(55000);
  });
  it("counts additional sources only when the borrower answered yes", () => {
    const extra = { rentalIncome: 3000, benefitsIncome: 1000, alimonyIncome: 0, investmentIncome: 500, otherIncome: 600 };
    expect(householdNetIncome({ ...base, ...extra, hasAdditionalIncome: "yes" }, true)).toBe(60100);
    expect(householdNetIncome({ ...base, ...extra, hasAdditionalIncome: "no" }, true)).toBe(55000);
  });
  it("ignores empty, invalid and negative values instead of producing NaN", () => {
    expect(householdNetIncome({ monthlyNetIncome: "", b2MonthlyNetIncome: Number.NaN, hasAdditionalIncome: "yes", rentalIncome: -50 }, true)).toBe(0);
    expect(householdNetIncome(undefined, true)).toBe(0);
  });
  it("accepts numbers stored as strings", () => {
    expect(householdNetIncome({ monthlyNetIncome: "15000", b2MonthlyNetIncome: "35000" }, true)).toBe(50000);
  });
});
