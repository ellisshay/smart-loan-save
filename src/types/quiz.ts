export interface QuizData {
  // Step 0 - Purpose
  purpose?: "new" | "refi" | "increase";

  // Step 1 - Personal
  age_range?: string;
  marital_status?: string;
  co_borrower?: boolean;
  children?: string;

  // Step 2 - Employment & Income
  employment_type?: string;
  // Employee
  work_sector?: string;
  seniority?: string;
  salary_net?: number;
  salary_net_2?: number;
  annual_bonus?: string;
  stock_options?: string;
  // Self-employed
  business_field?: string;
  self_years?: string;
  annual_income_y1?: number;
  annual_income_y2?: number;
  files_reports?: string;
  business_expenses?: string;
  // Company owner
  company_type?: string;
  company_years?: number;
  pays_salary?: boolean;
  registered_salary?: number;
  company_profit?: number;
  // Mixed
  income_split?: number;

  // Step 3 - Property
  property_price?: number;
  property_area?: string;
  property_status?: string;
  target_date?: string;
  existing_properties?: string;
  additional_property_value?: number;
  additional_mortgage_balance?: number;
  selling_property?: boolean;
  sale_proceeds?: number;

  // Step 4 - Equity
  equity_amount?: number;
  equity_sources?: { source: string; amount: number }[];
  government_eligibility?: string;

  // Step 5 - Obligations
  has_loans?: boolean;
  loans?: { type: string; monthly: number; remaining_months: number }[];
  rent?: number;
  alimony?: number;
  overdraft?: boolean;
  guarantor?: boolean;
  credit_history?: string;

  // Step 6 - Existing Mortgage (refi/increase only)
  current_bank?: string;
  current_balance?: number;
  current_years_left?: number;
  current_monthly?: number;
  current_tracks_known?: boolean;
  has_bank_offer?: boolean;
  bank_offer_rate?: number;
  bank_offer_monthly?: number;

  // Step 7 - Preferences
  priorities?: string[];
  urgency?: string;
  notes?: string;
}

export function calculateQuizScore(data: QuizData): number {
  let score = 50;

  // Employment stability
  const emp = data.employment_type;
  const sen = data.seniority;
  if (emp === "employee" && (sen === "3-5" || sen === "5+")) score += 15;
  if (emp === "employee" && sen === "under_6m") score -= 10;
  if (emp === "self_employed" && (data.self_years === "3+" || data.self_years === "2-3")) score += 10;
  if (emp === "self_employed" && (data.self_years === "under_1" || data.self_years === "1-2")) score -= 15;
  if (emp === "both") score += 8;
  if (emp === "company_owner") score += 5;

  // Income to repayment ratio (DTI)
  const income1 = data.salary_net || 0;
  const income2 = data.co_borrower ? (data.salary_net_2 || 0) : 0;
  const selfIncome = data.annual_income_y1 ? data.annual_income_y1 / 12 : 0;
  const totalIncome = income1 + income2 + selfIncome + (data.registered_salary || 0);
  
  if (totalIncome > 0 && data.property_price && data.equity_amount !== undefined) {
    const loanNeeded = data.property_price - (data.equity_amount || 0);
    const estMonthly = loanNeeded * 0.005;
    const totalLoans = (data.loans || []).reduce((sum, l) => sum + l.monthly, 0) + (data.alimony || 0);
    const dti = (estMonthly + totalLoans) / totalIncome;
    if (dti < 0.25) score += 15;
    else if (dti < 0.33) score += 8;
    else if (dti < 0.4) score += 0;
    else if (dti < 0.5) score -= 10;
    else score -= 20;
  }

  // LTV
  if (data.property_price && data.equity_amount !== undefined) {
    const ltv = (data.property_price - (data.equity_amount || 0)) / data.property_price;
    if (ltv < 0.5) score += 15;
    else if (ltv < 0.6) score += 10;
    else if (ltv < 0.7) score += 5;
    else if (ltv < 0.75) score += 0;
    else score -= 10;
  }

  // Credit history
  if (data.credit_history === "clean") score += 10;
  if (data.credit_history === "minor_past") score -= 5;
  if (data.credit_history === "active_issues") score -= 20;

  // Sector bonus
  const sector = data.work_sector;
  if (sector === "tech" || sector === "government" || sector === "medicine") score += 5;

  // Age
  if (data.age_range === "26-35") score += 5;
  if (data.age_range === "36-45") score += 3;
  if (data.age_range === "56+") score -= 5;

  return Math.max(0, Math.min(100, score));
}
