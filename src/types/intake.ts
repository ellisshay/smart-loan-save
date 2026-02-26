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

// Step schemas for new mortgage
export const personalSchema = z.object({
  firstName: z.string().trim().min(2, "שם פרטי חובה"),
  lastName: z.string().trim().min(2, "שם משפחה חובה"),
  idNumber: z.string().refine(isValidIsraeliId, "מספר ת.ז. לא תקין"),
  phone: z.string().regex(phoneRegex, "מספר טלפון לא תקין (פורמט: 05XXXXXXXX)"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  maritalStatus: z.enum(["single", "married", "common_law", "divorced", "widowed"], {
    required_error: "בחר מצב משפחתי",
  }),
  borrowerCount: z.enum(["1", "2"], { required_error: "בחר מספר לווים" }),
  hasGuarantor: z.enum(["yes", "no"], { required_error: "ציין האם יש ערבים" }),
  // Optional
  address: z.string().optional(),
  city: z.string().optional(),
  birthDate: z.string().optional(),
  additionalCitizenship: z.enum(["yes", "no"]).optional(),
  citizenshipDetails: z.string().optional(),
  // Borrower 2
  borrower2FirstName: z.string().optional(),
  borrower2LastName: z.string().optional(),
  borrower2IdNumber: z.string().optional(),
  borrower2Phone: z.string().optional(),
  borrower2Email: z.string().optional(),
});

export const propertySchema = z.object({
  transactionType: z.enum(["second_hand", "new_build", "land_build"], {
    required_error: "בחר סוג עסקה",
  }),
  propertyCity: z.string().min(2, "ציין לפחות עיר"),
  propertyAddress: z.string().optional(),
  purchasePrice: z.coerce.number().positive("מחיר רכישה חובה"),
  signingDate: z.string().optional(),
  hasSignedContract: z.enum(["yes", "no"]).optional(),
  ownEquity: z.coerce.number().min(0, "הון עצמי לא תקין"),
  requestedMortgage: z.coerce.number().positive("סכום משכנתא חובה"),
  hasExistingMortgage: z.enum(["yes", "no"]).optional(),
  deliveryDate: z.string().optional(),
});

export const incomeSchema = z.object({
  employmentStatus: z.enum(["salaried", "self_employed", "both", "maternity", "unemployed"], {
    required_error: "בחר סטטוס תעסוקה",
  }),
  monthlyNetIncome: z.coerce.number().positive("הכנסה חודשית חובה"),
  workSeniority: z.coerce.number().min(0, "ותק לא תקין"),
  occupation: z.string().min(2, "תחום עיסוק חובה"),
  hasAdditionalIncome: z.enum(["yes", "no"]),
  additionalIncomeSource: z.string().optional(),
  additionalIncomeAmount: z.coerce.number().optional(),
  // Borrower 2
  b2EmploymentStatus: z.string().optional(),
  b2MonthlyNetIncome: z.coerce.number().optional(),
  b2WorkSeniority: z.coerce.number().optional(),
  b2Occupation: z.string().optional(),
  b2HasAdditionalIncome: z.enum(["yes", "no"]).optional(),
  b2AdditionalIncomeSource: z.string().optional(),
  b2AdditionalIncomeAmount: z.coerce.number().optional(),
});

export const liabilitiesSchema = z.object({
  existingLoanPayments: z.coerce.number().min(0, "סכום לא תקין"),
  hasSignificantCreditCards: z.enum(["yes", "no"]),
  creditCardMonthly: z.coerce.number().optional(),
  hasDelinquentDebt: z.enum(["yes", "no"]),
  hasLegalProceedings: z.enum(["yes", "no"]),
  maxDesiredPayment: z.coerce.number().positive("החזר מקסימלי חובה"),
  mainGoal: z.enum(["lower_payment", "total_savings", "stability", "shorter_term"], {
    required_error: "בחר יעד מרכזי",
  }),
  riskLevel: z.enum(["low", "medium", "high"], {
    required_error: "בחר רמת סיכון",
  }),
  incomeChangeExpected: z.enum(["up", "down", "none"]).optional(),
  incomeChangeDetails: z.string().optional(),
});

export const preferencesSchema = z.object({
  stabilityPriority: z.coerce.number().min(1).max(5),
  primeExposure: z.enum(["low", "medium", "high"]),
  indexExposure: z.enum(["low", "medium", "high"]),
  holdingHorizon: z.enum(["under_5", "5_to_10", "over_10", "unknown"]),
  expectEarlySale: z.enum(["yes", "no"]),
  lowExitPenaltyImportant: z.enum(["yes", "no"]),
});

// Refinance-specific schemas
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

// Case types
export type CaseType = "new" | "refi";

export interface IntakeStep {
  title: string;
  subtitle: string;
  key: string;
}

export const NEW_CASE_STEPS: IntakeStep[] = [
  { title: "פרטי לקוח", subtitle: "זיהוי ופרטים אישיים", key: "personal" },
  { title: "נכס ועסקה", subtitle: "פרטי הנכס והעסקה", key: "property" },
  { title: "הכנסות", subtitle: "הכנסות ותעסוקה", key: "income" },
  { title: "התחייבויות", subtitle: "הלוואות ומסגרת סיכון", key: "liabilities" },
  { title: "העדפות תמהיל", subtitle: "רמת סיכון וחשיפות", key: "preferences" },
  { title: "מסמכים", subtitle: "העלאת מסמכים נדרשים", key: "documents" },
  { title: "הצהרות", subtitle: "אישורים ותנאים", key: "consent" },
  { title: "סיכום", subtitle: "בדיקה ושליחה", key: "summary" },
];

export const REFI_CASE_STEPS: IntakeStep[] = [
  { title: "פרטי לקוח", subtitle: "זיהוי ופרטים אישיים", key: "personal" },
  { title: "מטרת מיחזור", subtitle: "למה למחזר?", key: "refi_goal" },
  { title: "משכנתא קיימת", subtitle: "פרטי המשכנתא הנוכחית", key: "current_mortgage" },
  { title: "נכס נוכחי", subtitle: "פרטי הנכס", key: "refi_property" },
  { title: "הכנסות", subtitle: "הכנסות ותעסוקה", key: "income" },
  { title: "התחייבויות", subtitle: "הלוואות ומסגרת סיכון", key: "liabilities" },
  { title: "העדפות תמהיל", subtitle: "רמת סיכון וחשיפות", key: "refi_preferences" },
  { title: "מסמכים", subtitle: "העלאת מסמכים נדרשים", key: "documents" },
  { title: "הצהרות", subtitle: "אישורים ותנאים", key: "consent" },
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

export const REQUIRED_DOCS_NEW = [
  { type: "id_card", label: "תעודות זהות כולל ספח", required: true },
  { type: "payslips", label: "3 תלושי שכר אחרונים", required: true },
  { type: "bank_statements", label: "דפי עו״ש 3 חודשים אחרונים", required: true },
  { type: "loan_balances", label: "אישור יתרות הלוואות", required: false },
  { type: "purchase_contract", label: "חוזה רכישה או טיוטה", required: false },
  { type: "land_registry", label: "נסח טאבו", required: false },
];

export const REQUIRED_DOCS_REFI = [
  { type: "mortgage_report", label: "דוח יתרות משכנתא מלא (PDF)", required: true },
  { type: "payslips", label: "3 תלושי שכר אחרונים", required: true },
  { type: "bank_statements", label: "דפי עו״ש 3 חודשים", required: true },
  { type: "id_card", label: "תעודות זהות כולל ספח", required: true },
  { type: "settlement_report", label: "דו״ח סילוק לכל מסלול", required: false },
  { type: "other_loans", label: "אישורי הלוואות נוספות", required: false },
  { type: "appraisal", label: "שמאות", required: false },
  { type: "existing_offer", label: "הצעה קיימת מבנק אחר", required: false },
];
