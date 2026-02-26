export const CASE_STATUSES = {
  Draft: { label: "טיוטה", color: "bg-muted text-muted-foreground", order: 0 },
  WaitingForPayment: { label: "ממתין לתשלום", color: "bg-blue-100 text-blue-800", order: 1 },
  PaymentSucceeded: { label: "תשלום התקבל", color: "bg-blue-200 text-blue-900", order: 2 },
  WaitingForDocs: { label: "ממתין למסמכים", color: "bg-warning/15 text-warning", order: 3 },
  InAnalysis: { label: "בניתוח", color: "bg-gold/15 text-gold-dark", order: 4 },
  ReportGenerated: { label: "דוח הופק", color: "bg-success/10 text-success", order: 5 },
  CustomerReview: { label: "בחירת תמהיל", color: "bg-primary/10 text-primary", order: 6 },
  SentToBank: { label: "נשלח לבנקים", color: "bg-primary/15 text-primary", order: 7 },
  BankOfferReceived: { label: "התקבלה הצעה", color: "bg-success/15 text-success", order: 8 },
  Negotiation: { label: "במשא ומתן", color: "bg-gold/20 text-gold-dark", order: 9 },
  ClosedWon: { label: "נסגר בהצלחה", color: "bg-success/20 text-success", order: 10 },
  ClosedLost: { label: "נסגר ללא הצלחה", color: "bg-destructive/15 text-destructive", order: 11 },
} as const;

export type CaseStatus = keyof typeof CASE_STATUSES;

export const STATUS_OPTIONS = Object.entries(CASE_STATUSES).map(([key, val]) => ({
  value: key as CaseStatus,
  label: val.label,
}));

export const BANK_EMAIL_TEMPLATE = `שלום רב,

מצ"ב בקשה למיחזור משכנתא עבור הלקוח/ה: {{clientName}}

פרטי הבקשה:
- סכום משכנתא: ₪{{mortgageAmount}}
- הכנסה חודשית נטו: ₪{{income}}
- יעד: {{goal}}
- רמת סיכון מועדפת: {{riskLevel}}

מצורף דוח מקצועי הכולל 3 תמהילים מומלצים.

נשמח לקבל הצעה תחרותית.

בברכה,
צוות EasyMorte
info@easymortgage.co.il`;
