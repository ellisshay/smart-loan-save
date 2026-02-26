export const CASE_STATUSES = {
  payment_received: { label: "התקבל תשלום", color: "bg-blue-100 text-blue-800", order: 1 },
  waiting_docs: { label: "ממתין למסמכים", color: "bg-warning/15 text-warning", order: 2 },
  analyzing: { label: "בניתוח", color: "bg-gold/15 text-gold-dark", order: 3 },
  mixes_ready: { label: "תמהילים מוכנים", color: "bg-success/15 text-success", order: 4 },
  sent_to_banks: { label: "נשלח לבנקים", color: "bg-primary/10 text-primary", order: 5 },
  offer_received: { label: "התקבלה הצעה", color: "bg-success/20 text-success", order: 6 },
  completed: { label: "הושלם", color: "bg-muted text-muted-foreground", order: 7 },
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
