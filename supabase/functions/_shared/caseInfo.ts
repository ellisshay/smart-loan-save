import { esc } from "./gmail.ts";

export const STATUS_LABELS: Record<string, string> = {
  Draft: "טיוטה, בהשלמת פרטים",
  WaitingForPayment: "ממתין לתשלום",
  PaymentSucceeded: "התשלום התקבל",
  WaitingForDocs: "ממתין למסמכים",
  InAnalysis: "בבדיקת תיק (עד 72 שעות)",
  ReportGenerated: "הדוח מוכן",
  CustomerReview: "ממתין לאישורך",
  SentToBank: "נשלח לבנקים",
  BankOfferReceived: "התקבלה הצעת בנק",
  Negotiation: "במשא ומתן",
  ClosedWon: "הושלם בהצלחה",
  ClosedLost: "התיק נסגר",
};

const KEYS = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];

export function progressOf(intake: Record<string, any>) {
  const done = KEYS.filter((k) => intake?.[k] && Object.keys(intake[k]).length > 0).length;
  return Math.round((done / KEYS.length) * 100);
}

export function borrowers(intake: any, profile: any) {
  const p = intake?.personal || {};
  const list = [p.borrower1, p.borrowerCount === "2" ? p.borrower2 : null].filter(Boolean);
  if (!list.length && profile) list.push({ firstName: profile.first_name, lastName: profile.last_name, email: profile.email, phone: profile.phone });
  return list as Array<Record<string, any>>;
}

export function clientEmail(intake: any, profile: any): string | null {
  const e = intake?.personal?.borrower1?.email || profile?.email;
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

export function clientCardHtml(c: any, profile: any) {
  const intake = c.intake_data || {};
  const rows = borrowers(intake, profile).map((b, i) => `<tr><td style="padding:6px;border:1px solid #e5e7eb">לווה ${i + 1}</td><td style="padding:6px;border:1px solid #e5e7eb">${esc([b.firstName, b.lastName].filter(Boolean).join(" "))}</td><td style="padding:6px;border:1px solid #e5e7eb" dir="ltr">${esc(b.phone)}</td><td style="padding:6px;border:1px solid #e5e7eb" dir="ltr">${esc(b.email)}</td></tr>`).join("");
  const prop = intake.property || {};
  const inc = intake.income || {};
  return `<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
<p><b>מספר תיק:</b> ${esc(c.case_number)}<br/><b>סוג:</b> ${c.case_type === "refi" ? "מחזור משכנתא" : "משכנתא חדשה"}<br/>
<b>סטטוס:</b> ${esc(STATUS_LABELS[c.status] || c.status)}<br/><b>השלמת תיק:</b> ${progressOf(intake)}%<br/>
${prop.propertyValue || prop.property_value ? `<b>שווי נכס:</b> ${esc(prop.propertyValue || prop.property_value)} ₪<br/>` : ""}
${prop.city || prop.area ? `<b>אזור:</b> ${esc(prop.city || prop.area)}<br/>` : ""}
${inc.monthlyIncome || inc.monthly_income ? `<b>הכנסה חודשית:</b> ${esc(inc.monthlyIncome || inc.monthly_income)} ₪<br/>` : ""}</p>`;
}
