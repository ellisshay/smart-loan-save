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

export type IncomeSummary = {
  /** The total used for calculations: detailed income when any was entered, otherwise the estimate. */
  total: number;
  source: "detailed" | "estimate" | "none";
  /** Borrowers whose net income is still missing from the detail. */
  missing: ("borrower1" | "borrower2")[];
};

/**
 * The household's income with one source of truth. The quick check's household estimate is only a
 * placeholder until the borrowers' own income is entered; it is never added to the detailed figures.
 */
export function householdIncomeSummary(
  income: IncomeFields | undefined | null,
  hasBorrower2: boolean,
  estimate?: unknown,
): IncomeSummary {
  const missing: IncomeSummary["missing"] = [];
  if (!amount(income?.monthlyNetIncome)) missing.push("borrower1");
  if (hasBorrower2 && !amount(income?.b2MonthlyNetIncome)) missing.push("borrower2");
  const detailed = householdNetIncome(income, hasBorrower2);
  if (detailed > 0) return { total: detailed, source: "detailed", missing };
  const est = amount(estimate);
  return est > 0 ? { total: est, source: "estimate", missing } : { total: 0, source: "none", missing };
}

/**
 * Whether borrower 2 counts. An explicit "1" means the second borrower was removed. Older cases without a
 * borrower count still count borrower 2 when that borrower has income, so nothing that was entered disappears.
 */
export function hasSecondBorrower(borrowerCount: unknown, income?: IncomeFields | null): boolean {
  if (borrowerCount === "1") return false;
  if (borrowerCount === "2") return true;
  return amount(income?.b2MonthlyNetIncome) > 0;
}
