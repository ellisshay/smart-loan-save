import { z } from "zod";

// Israeli ID validation (Luhn-like check digit)
function isValidIsraeliId(id: string): boolean {
  if (id.length !== 9 || !/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = Number(id[i]) * ((i % 2) + 1);
    if (num > 9) num -= 9;
    sum += num;
  }
  return sum % 10 === 0;
}

// Phone validation - Israeli 05X format
const phoneRegex = /^05\d{8}$/;

// ── Single borrower schema ──
export const borrowerSchema = z.object({
  firstName: z.string().trim().min(2, "שם פרטי חובה"),
  lastName: z.string().trim().min(2, "שם משפחה חובה"),
  idNumber: z.string().refine(isValidIsraeliId, "מספר ת.ז. לא תקין"),
  birthDate: z.string().min(1, "תאריך לידה חובה"),
  phone: z.string().regex(phoneRegex, "מספר טלפון לא תקין (פורמט: 05XXXXXXXX)"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  maritalStatus: z.enum(["single", "married", "common_law", "divorced", "widowed"], {
    required_error: "בחר מצב משפחתי",
  }),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  additionalCitizenship: z.enum(["yes", "no"]).optional(),
  citizenshipDetails: z.string().optional(),
  dependents: z.coerce.number().min(0).optional(),
  hasPrenup: z.enum(["yes", "no"]).optional(),
  isDivorced: z.enum(["yes", "no"]).optional(),
  hasAlimony: z.enum(["yes", "no"]).optional(),
  alimonyAmount: z.coerce.number().optional(),
});

export type BorrowerData = z.infer<typeof borrowerSchema>;

// ── Step 1: Personal (wraps borrowers) ──
export const personalSchema = z.object({
  borrowerCount: z.enum(["1", "2"], { required_error: "בחר מספר לווים" }),
  hasGuarantor: z.enum(["yes", "no"], { required_error: "ציין האם יש ערבים" }),
  borrower1: borrowerSchema,
  borrower2: borrowerSchema.partial().optional(),
});

export type PersonalData = z.infer<typeof personalSchema>;

// ── Step 2: Property (new mortgage) ──
export const propertySchema = z.object({
  transactionType: z.enum(["second_hand", "new_build", "land_build", "land", "investment"], {
    required_error: "בחר סוג עסקה",
  }),
  propertyCity: z.string().min(2, "ציין לפחות עיר"),
  propertyAddress: z.string().optional(),
  areaType: z.enum(["center", "periphery"]).optional(),
  purchasePrice: z.coerce.number().positive("מחיר רכישה חובה"),
  appraisalValue: z.coerce.number().optional(),
  signingDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  hasSignedContract: z.enum(["yes", "no"]).optional(),
  hasWarningNote: z.enum(["yes", "no"]).optional(),
  ownEquity: z.coerce.number().min(0, "הון עצמי לא תקין"),
  equitySources: z.array(z.string()).optional(),
  isEquityInAccount: z.enum(["yes", "no"]).optional(),
  requestedMortgage: z.coerce.number().positive("סכום משכנתא חובה"),
  hasExistingMortgage: z.enum(["yes", "no"]).optional(),
});

// ── Step 3: Income ──
export const incomeSchema = z.object({
  employmentStatus: z.enum(["salaried", "self_employed", "company_owner", "pensioner", "unemployed"], {
    required_error: "בחר סטטוס תעסוקה",
  }),
  // Salaried fields
  employer: z.string().optional(),
  workSeniority: z.coerce.number().min(0).optional(),
  contractType: z.enum(["permanent", "temporary"]).optional(),
  grossSalary: z.coerce.number().optional(),
  monthlyNetIncome: z.coerce.number().positive("הכנסה חודשית חובה"),
  averageNet3Months: z.coerce.number().optional(),
  averageBonuses: z.coerce.number().optional(),
  hasLeasingCar: z.enum(["yes", "no"]).optional(),
  // Self-employed fields
  businessField: z.string().optional(),
  businessSeniority: z.coerce.number().optional(),
  annualIncome: z.coerce.number().optional(),
  monthlyAvgSelfEmployed: z.coerce.number().optional(),
  hasOpenTaxDebts: z.enum(["yes", "no"]).optional(),
  // Additional income
  hasAdditionalIncome: z.enum(["yes", "no"]),
  rentalIncome: z.coerce.number().optional(),
  benefitsIncome: z.coerce.number().optional(),
  alimonyIncome: z.coerce.number().optional(),
  investmentIncome: z.coerce.number().optional(),
  otherIncome: z.coerce.number().optional(),
  otherIncomeSource: z.string().optional(),
  occupation: z.string().min(2, "תחום עיסוק חובה"),
  // Borrower 2 fields (mirrors above)
  b2EmploymentStatus: z.string().optional(),
  b2Employer: z.string().optional(),
  b2WorkSeniority: z.coerce.number().optional(),
  b2ContractType: z.string().optional(),
  b2GrossSalary: z.coerce.number().optional(),
  b2MonthlyNetIncome: z.coerce.number().optional(),
  b2AverageNet3Months: z.coerce.number().optional(),
  b2Occupation: z.string().optional(),
  b2BusinessField: z.string().optional(),
  b2HasAdditionalIncome: z.enum(["yes", "no"]).optional(),
  b2AdditionalIncomeSource: z.string().optional(),
  b2AdditionalIncomeAmount: z.coerce.number().optional(),
});

// ── Step 4: Liabilities ──
export const liabilitiesSchema = z.object({
  existingLoans: z.array(z.object({
    lender: z.string(),
    balance: z.coerce.number(),
    monthlyPayment: z.coerce.number(),
    endDate: z.string().optional(),
  })).optional(),
  existingLoanPayments: z.coerce.number().min(0, "סכום לא תקין"),
  usedCreditFrames: z.coerce.number().optional(),
  hasSignificantCreditCards: z.enum(["yes", "no"]),
  creditCardMonthly: z.coerce.number().optional(),
  alimonyPaid: z.coerce.number().optional(),
  hasGuarantees: z.enum(["yes", "no"]).optional(),
  hasDelinquentDebt: z.enum(["yes", "no"]),
  hasLegalProceedings: z.enum(["yes", "no"]),
  maxDesiredPayment: z.coerce.number().positive("החזר מקסימלי חובה"),
  mainGoal: z.enum(["lower_payment", "total_savings", "stability", "shorter_term", "combined"], {
    required_error: "בחר יעד מרכזי",
  }),
  riskLevel: z.enum(["low", "medium", "high"], {
    required_error: "בחר רמת סיכון",
  }),
  incomeChangeExpected: z.enum(["up", "down", "none"]).optional(),
  incomeChangeDetails: z.string().optional(),
});

// ── Step 5: Preferences ──
export const preferencesSchema = z.object({
  stabilityPriority: z.coerce.number().min(1).max(5),
  primeExposure: z.enum(["low", "medium", "high"]),
  indexExposure: z.enum(["low", "medium", "high"]),
  holdingHorizon: z.enum(["under_5", "5_to_10", "over_10", "unknown"]),
  expectEarlySale: z.enum(["yes", "no"]),
  lowExitPenaltyImportant: z.enum(["yes", "no"]),
});

// ── Step 6: Mortgage request details (new mortgage) ──
export const mortgageRequestSchema = z.object({
  requestedAmount: z.coerce.number().positive("סכום משכנתא חובה"),
  desiredPayment: z.coerce.number().optional(),
  maxPayment: z.coerce.number().optional(),
  desiredYears: z.coerce.number().min(4).max(30).optional(),
  goal: z.enum(["lower_payment", "total_savings", "stability", "combined"]).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});

// ── Refinance-specific schemas ──
export const refiGoalSchema = z.object({
  refiReasons: z.array(z.string()).min(1, "בחר לפחות סיבה אחת"),
  wantsIncrease: z.enum(["yes", "no"]),
  increaseAmount: z.coerce.number().optional(),
  increasePurpose: z.string().optional(),
});

export const currentMortgageSchema = z.object({
  currentBank: z.string().min(1, "בחר בנק"),
  totalBalance: z.coerce.number().positive("יתרה חובה"),
  currentMonthlyPayment: z.coerce.number().positive("החזר חודשי חובה"),
  remainingYears: z.coerce.number().positive("שנים שנותרו חובה"),
  hasUpcomingRateChange: z.enum(["yes", "no"]),
  rateChangeDate: z.string().optional(),
  hasExitPenalties: z.enum(["yes", "no"]),
  exitPenaltyEstimate: z.coerce.number().optional(),
  // Dynamic tracks table
  tracks: z.array(z.object({
    trackType: z.string(),
    principalBalance: z.coerce.number(),
    interestRate: z.coerce.number(),
    isIndexed: z.enum(["yes", "no"]),
    remainingYears: z.coerce.number(),
    exitDate: z.string().optional(),
    exitPenalty: z.coerce.number().optional(),
  })).optional(),
});

export const refiPropertySchema = z.object({
  estimatedValue: z.coerce.number().positive("שווי נכס חובה"),
  hasRecentAppraisal: z.enum(["yes", "no"]),
  propertyCity: z.string().min(2, "ציין לפחות עיר"),
  propertyAddress: z.string().optional(),
  isInvestment: z.enum(["yes", "no"]),
  rentalIncome: z.coerce.number().optional(),
});

export const refiPreferencesSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  stabilityPriority: z.coerce.number().min(1).max(5),
  holdingHorizon: z.enum(["under_5", "5_to_10", "over_10", "unknown"]),
  willingToPayPenalty: z.enum(["yes", "no"]),
  earlyRepaymentFlexibility: z.enum(["yes", "no"]),
});

// ── Banking declarations (Step 8) ──
export const declarationsSchema = z.object({
  hasExecutionFile: z.enum(["yes", "no"]),
  hasLegalProceedings: z.enum(["yes", "no"]),
  hasBankruptcy: z.enum(["yes", "no"]),
  hasRestrictedAccount: z.enum(["yes", "no"]),
  hasBouncedChecks: z.enum(["yes", "no"]),
  confirmTruthful: z.literal(true, { errorMap: () => ({ message: "חובה לאשר" }) }),
});

// Case types
export type CaseType = "new" | "refi";

// Visual selection includes "refi_plus" which maps to refi + wantsIncrease flag
export type CaseTypeSelection = "new" | "refi" | "refi_plus";

export interface IntakeStep {
  title: string;
  subtitle: string;
  key: string;
}

export const NEW_CASE_STEPS: IntakeStep[] = [
  { title: "פרטי לווים", subtitle: "זיהוי ופרטים אישיים", key: "personal" },
  { title: "נכס ועסקה", subtitle: "פרטי הנכס והעסקה", key: "property" },
  { title: "הון עצמי", subtitle: "מקורות הון", key: "equity" },
  { title: "הכנסות", subtitle: "הכנסות ותעסוקה", key: "income" },
  { title: "התחייבויות", subtitle: "הלוואות והחזרים", key: "liabilities" },
  { title: "משכנתא מבוקשת", subtitle: "סכום, תקופה ויעד", key: "mortgage_request" },
  { title: "העדפות תמהיל", subtitle: "רמת סיכון וחשיפות", key: "preferences" },
  { title: "הצהרות", subtitle: "הצהרות בנקאיות", key: "declarations" },
  { title: "מסמכים", subtitle: "העלאת מסמכים נדרשים", key: "documents" },
  { title: "אישורים", subtitle: "הסכמה ותנאים", key: "consent" },
  { title: "סיכום", subtitle: "בדיקה ושליחה", key: "summary" },
];

export const REFI_CASE_STEPS: IntakeStep[] = [
  { title: "פרטי לווים", subtitle: "זיהוי ופרטים אישיים", key: "personal" },
  { title: "מטרת מיחזור", subtitle: "למה למחזר?", key: "refi_goal" },
  { title: "משכנתא קיימת", subtitle: "מסלולים ופרטים", key: "current_mortgage" },
  { title: "נכס נוכחי", subtitle: "פרטי הנכס", key: "refi_property" },
  { title: "הכנסות", subtitle: "הכנסות ותעסוקה", key: "income" },
  { title: "התחייבויות", subtitle: "הלוואות והחזרים", key: "liabilities" },
  { title: "העדפות תמהיל", subtitle: "רמת סיכון וחשיפות", key: "refi_preferences" },
  { title: "הצהרות", subtitle: "הצהרות בנקאיות", key: "declarations" },
  { title: "מסמכים", subtitle: "העלאת מסמכים נדרשים", key: "documents" },
  { title: "אישורים", subtitle: "הסכמה ותנאים", key: "consent" },
  { title: "סיכום", subtitle: "בדיקה ושליחה", key: "summary" },
];

export const SERVICE_GOALS = [
  { value: "total_savings", label: "חיסכון בעלות כוללת" },
  { value: "lower_payment", label: "הורדת החזר חודשי" },
  { value: "shorter_term", label: "קיצור תקופה" },
  { value: "stability", label: "יציבות והפחתת סיכון" },
  { value: "combined", label: "שילוב" },
];

export const ISRAELI_BANKS = [
  "בנק הפועלים",
  "בנק לאומי",
  "בנק דיסקונט",
  "בנק מזרחי טפחות",
  "הבינלאומי הראשון",
  "בנק ירושלים",
  "בנק אגוד",
  "אחר",
];

export const REFI_REASONS = [
  { value: "lower_payment", label: "להוריד החזר" },
  { value: "shorter_term", label: "לקצר שנים" },
  { value: "reduce_risk", label: "להקטין סיכון" },
  { value: "consolidate", label: "לאחד הלוואות" },
  { value: "release_equity", label: "לשחרר הון" },
  { value: "recommend", label: "לא יודע, תמליצו לי" },
];

export const EQUITY_SOURCES = [
  { value: "savings", label: "חסכונות" },
  { value: "property_sale", label: "מכירת נכס" },
  { value: "gift", label: "מתנה" },
  { value: "family_loan", label: "הלוואה משפחתית" },
  { value: "hishtalmut", label: "קרן השתלמות" },
  { value: "other", label: "אחר" },
];

export const REQUIRED_DOCS_NEW = [
  { type: "id_card", label: "תעודות זהות כולל ספח", required: true },
  { type: "payslips", label: "3 תלושי שכר אחרונים", required: true },
  { type: "bank_statements", label: "דפי עו״ש 3 חודשים אחרונים", required: true },
  { type: "purchase_contract", label: "חוזה רכישה", required: true },
  { type: "loan_balances", label: "אישור יתרות הלוואות", required: false },
  { type: "appraisal", label: "שמאות", required: false },
  { type: "land_registry", label: "נסח טאבו", required: false },
  { type: "rights_approval", label: "אישור זכויות", required: false },
  { type: "annual_reports", label: "דוחות שנתיים (עצמאי)", required: false },
  { type: "bookkeeping", label: "אישור ניהול ספרים", required: false },
];

export const REQUIRED_DOCS_REFI = [
  { type: "mortgage_report", label: "דוח יתרות משכנתא מלא (PDF)", required: true },
  { type: "id_card", label: "תעודות זהות כולל ספח", required: true },
  { type: "payslips", label: "3 תלושי שכר אחרונים", required: true },
  { type: "bank_statements", label: "דפי עו״ש 3 חודשים", required: true },
  { type: "settlement_report", label: "דו״ח סילוק לכל מסלול", required: false },
  { type: "other_loans", label: "אישורי הלוואות נוספות", required: false },
  { type: "appraisal", label: "שמאות", required: false },
  { type: "land_registry", label: "נסח טאבו", required: false },
  { type: "existing_offer", label: "הצעה קיימת מבנק אחר", required: false },
  { type: "annual_reports", label: "דוחות שנתיים (עצמאי)", required: false },
  { type: "bookkeeping", label: "אישור ניהול ספרים", required: false },
];
