// Server copy of src/lib/householdIncome.ts (edge functions cannot import from src).
// Keep both in step: src/lib/householdIncome.shared.test.ts compares them.
type IncomeFields = Record<string, unknown> | undefined | null;

const amount = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function householdNetIncome(income: IncomeFields, hasBorrower2: boolean): number {
  if (!income) return 0;
  let total = amount(income.monthlyNetIncome);
  if (income.hasAdditionalIncome === "yes") {
    total += amount(income.rentalIncome) + amount(income.benefitsIncome) + amount(income.alimonyIncome) +
      amount(income.investmentIncome) + amount(income.otherIncome);
  }
  if (hasBorrower2) {
    total += amount(income.b2MonthlyNetIncome);
    if (income.b2HasAdditionalIncome === "yes") total += amount(income.b2AdditionalIncomeAmount);
  }
  return total;
}

export function hasSecondBorrower(borrowerCount: unknown, income?: IncomeFields): boolean {
  if (borrowerCount === "1") return false;
  if (borrowerCount === "2") return true;
  return amount(income?.b2MonthlyNetIncome) > 0;
}
