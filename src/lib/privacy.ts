import { supabase } from "@/integrations/supabase/client";

export const CONTROLLER = {
  name: "שי אליס, אליס שירותי ייעוץ",
  businessId: "ע.מ 049025836",
  email: "easymorte.il@gmail.com",
};

export const CONSENT_VERSIONS = {
  privacy_notice: "2026-09-v1",
  bank_data_transfer: "2026-09-v1",
  automated_processing: "2026-09-v1",
} as const;

export type ConsentType = keyof typeof CONSENT_VERSIONS;

export const SIGNED_URL_TTL = 300; // 5 minutes

export async function logAudit(action: string, opts: { objectType?: string; objectId?: string; caseId?: string; metadata?: Record<string, unknown>; success?: boolean } = {}) {
  try {
    await supabase.rpc("log_audit" as never, {
      _action: action,
      _object_type: opts.objectType ?? null,
      _object_id: opts.objectId ?? null,
      _case_id: opts.caseId ?? null,
      _metadata: opts.metadata ?? {},
      _success: opts.success ?? true,
    } as never);
  } catch {
    /* audit must never break UX */
  }
}

export async function openDocumentSecure(filePath: string, caseId?: string) {
  const { data, error } = await supabase.storage.from("case-documents").createSignedUrl(filePath, SIGNED_URL_TTL);
  await logAudit("view_document", { objectType: "document", objectId: filePath, caseId, success: !error });
  if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  return !error;
}

export async function hasConsent(userId: string, type: ConsentType) {
  const { data } = await supabase
    .from("consents" as never)
    .select("id")
    .eq("user_id", userId)
    .eq("consent_type", type)
    .eq("consent_version", CONSENT_VERSIONS[type])
    .is("revoked_at", null)
    .limit(1);
  return !!(data && (data as unknown[]).length);
}

export async function recordConsent(userId: string, type: ConsentType, caseId?: string) {
  const { error } = await supabase.from("consents" as never).insert({
    user_id: userId,
    consent_type: type,
    consent_version: CONSENT_VERSIONS[type],
    user_agent: navigator.userAgent.slice(0, 250),
    case_id: caseId ?? null,
  } as never);
  if (!error) await logAudit("consent_created", { objectType: "consent", objectId: type, caseId });
  return !error;
}

export function maskId(v?: string | null) {
  if (!v) return "";
  const s = String(v).replace(/\D/g, "");
  if (s.length < 5) return "****";
  return `${s.slice(0, 3)}****${s.slice(-2)}`;
}
export function maskAccount(v?: string | null) {
  if (!v) return "";
  const s = String(v).replace(/\D/g, "");
  return `****${s.slice(-4)}`;
}
export function maskPhone(v?: string | null) {
  if (!v) return "";
  const s = String(v).replace(/\D/g, "");
  return s.length < 6 ? "****" : `${s.slice(0, 3)}-***-${s.slice(-3)}`;
}

export type FieldClass = "REQUIRED" | "OPTIONAL" | "CONDITIONAL";
export const FIELD_REGISTRY: { field: string; cls: FieldClass; purpose: string }[] = [
  { field: "id_number", cls: "REQUIRED", purpose: "זיהוי הלווה והגשה לבנק" },
  { field: "first_name / last_name", cls: "REQUIRED", purpose: "זיהוי ויצירת קשר" },
  { field: "phone / email", cls: "REQUIRED", purpose: "עדכוני תיק ויצירת קשר" },
  { field: "salary_net", cls: "REQUIRED", purpose: "בדיקת כושר החזר" },
  { field: "employment_type", cls: "REQUIRED", purpose: "סיווג הכנסה ודרישות מסמכים" },
  { field: "property_value", cls: "REQUIRED", purpose: "חישוב שיעור מימון" },
  { field: "equity", cls: "REQUIRED", purpose: "חישוב שיעור מימון" },
  { field: "existing_loans", cls: "REQUIRED", purpose: "חישוב יחס החזר" },
  { field: "second_borrower.*", cls: "CONDITIONAL", purpose: "נדרש רק כשיש לווה נוסף" },
  { field: "existing_mortgage_tracks", cls: "CONDITIONAL", purpose: "נדרש רק במחזור" },
  { field: "preferred_mix", cls: "OPTIONAL", purpose: "התאמת תמהיל להעדפה" },
  { field: "bank_statement", cls: "REQUIRED", purpose: "אימות הכנסות והתחייבויות" },
  { field: "payslips", cls: "REQUIRED", purpose: "אימות הכנסה" },
  { field: "id_document", cls: "REQUIRED", purpose: "אימות זהות" },
];

export const DATA_MAP = [
  { category: "צילום תעודת זהות", from: "הלקוח", purpose: "אימות זהות", storage: "אחסון מסמכים פרטי", access: "מנהל תיק, תפעול", recipients: "בנקים, בהסכמה נפרדת", retention: "7 שנים מסגירת התיק", basis: "הסכמה וביצוע שירות", deletion: "מחיקה אוטומטית בתום התקופה, אלא אם יש הקפאה משפטית" },
  { category: "תלושי שכר", from: "הלקוח", purpose: "אימות הכנסה", storage: "אחסון מסמכים פרטי", access: "מנהל תיק, יועץ משכנתא שהוקצה", recipients: "בנקים, בהסכמה נפרדת", retention: "7 שנים מסגירת התיק", basis: "הסכמה וביצוע שירות", deletion: "לפי מדיניות השמירה" },
  { category: "דפי עו\"ש", from: "הלקוח", purpose: "אימות הכנסות והתחייבויות", storage: "אחסון מסמכים פרטי", access: "מנהל תיק, יועץ משכנתא שהוקצה", recipients: "בנקים, בהסכמה נפרדת", retention: "7 שנים מסגירת התיק", basis: "הסכמה וביצוע שירות", deletion: "לפי מדיניות השמירה" },
  { category: "נתוני שאלון פיננסי", from: "הלקוח", purpose: "ניתוח כושר החזר ובניית תמהיל", storage: "מסד נתונים, מוגן בהרשאות לפי משתמש", access: "הלקוח, מנהל תיק", recipients: "בנקים, בהסכמה נפרדת", retention: "7 שנים מסגירת התיק", basis: "הסכמה וביצוע שירות", deletion: "לפי מדיניות השמירה" },
  { category: "טיוטה שלא הושלמה", from: "הלקוח", purpose: "שמירת התקדמות", storage: "מסד נתונים", access: "הלקוח, מנהל", recipients: "אין", retention: "12 חודשים ללא פעילות", basis: "הסכמה", deletion: "מחיקה אחרי 12 חודשים ללא פעילות" },
  { category: "פרופיל משכנתא אנונימי", from: "נגזר מתיקים", purpose: "סטטיסטיקה ושיפור הערכות", storage: "מסד נתונים, ללא מזהים", access: "מנהל", recipients: "אין", retention: "ללא הגבלה (אנונימי)", basis: "אינטרס לגיטימי", deletion: "לא רלוונטי" },
  { category: "תשלום", from: "Tranzila", purpose: "אישור תשלום", storage: "סטטוס בלבד. פרטי אשראי לא נשמרים", access: "מנהל", recipients: "Tranzila", retention: "7 שנים (חובה חשבונאית)", basis: "חובה חוקית", deletion: "לפי חובה חשבונאית" },
  { category: "יומן פעולות", from: "המערכת", purpose: "בקרה ואבטחה", storage: "מסד נתונים, לא ניתן לעריכה", access: "מנהל, מבקר פרטיות", recipients: "אין", retention: "7 שנים", basis: "אבטחת מידע", deletion: "לפי מדיניות השמירה" },
];
