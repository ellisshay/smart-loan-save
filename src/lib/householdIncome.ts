// One definition of the household's monthly net income, used both where it is shown in the
// questionnaire and where it feeds the repayment ratio. Values are taken as entered; nothing is guessed.

export type IncomeFields = {
  monthlyNetIncome?: unknown;
  hasAdditionalIncome?: unknown;
  rentalIncome?: unknown;
  benefitsIncome?: unknown;
  alimonyIncome?: unknown;
  investmentIncome?: unknown;
  otherIncome?: unknown;
  b2MonthlyNetIncome?: unknown;
  b2HasAdditionalIncome?: unknown;
  b2AdditionalIncomeAmount?: unknown;
};

const amount = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function householdNetIncome(income: IncomeFields | undefined | null, hasBorrower2: boolean): number {
  if (!income) return 0;
  let total = amount(income.monthlyNetIncome);
  if (income.hasAdditionalIncome === "yes") {
    total +=
      amount(income.rentalIncome) +
      amount(income.benefitsIncome) +
      amount(income.alimonyIncome) +
      amount(income.investmentIncome) +
      amount(income.otherIncome);
  }
  // A second borrower who was removed no longer contributes, including their additional income.
  if (hasBorrower2) {
    total += amount(income.b2MonthlyNetIncome);
    if (income.b2HasAdditionalIncome === "yes") total += amount(income.b2AdditionalIncomeAmount);
  }
  return total;
}
