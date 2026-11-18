// Turns a failed cardcom-payment-create call into a message the client can act on.
// The function answers with an HTTP status and a short error code; secrets and provider details never reach here.

export type PaymentFailure = { status?: number; code?: string; saved?: boolean };

export function paymentErrorMessage({ status, code }: PaymentFailure): string {
  if (status === 401 || code === "unauthorized") {
    return "פג תוקף ההתחברות. התחברו מחדש ונסו שוב.";
  }
  if (status === 403 || code === "forbidden") {
    return "לחשבון שמחובר עכשיו אין גישה לתיק הזה. התחברו עם החשבון שפתח את התיק.";
  }
  if (code === "payment_pending_verification") {
    return "נראה שתשלום קודם עבור התיק כבר עבר ומחכה לאישור. אנחנו בודקים את הסטטוס, ואין צורך לשלם שוב.";
  }
  if (code === "payment_status_unknown") {
    return "לא הצלחנו לבדוק את ניסיון התשלום הקודם, ולכן לא פתחנו טופס חדש כדי למנוע חיוב כפול. נסו שוב בעוד כמה דקות או התקשרו ל־055-996-1997.";
  }
  if (status === 409 || code === "already_paid") {
    return "התשלום עבור התיק כבר התקבל, ואין צורך לשלם שוב.";
  }
  if (code === "invalid_billing") {
    return "יש לבדוק את פרטי החשבונית: שם, טלפון ומייל תקינים.";
  }
  if (status === 404 || code === "case_not_found") {
    return "לא מצאנו את התיק. רעננו את הדף ונסו שוב.";
  }
  if (status === 503 || code === "cardcom_not_configured" || code === "bad_origin") {
    return "התשלום המקוון לא זמין כרגע מצדנו. התקשרו אלינו ל־055-996-1997 ונסדר את התשלום.";
  }
  return "לא הצלחנו לפתוח את טופס התשלום. נסו שוב בעוד רגע.";
}

/** Reads the status and error code from a supabase.functions.invoke error, without throwing. */
export async function readFunctionError(error: unknown): Promise<PaymentFailure> {
  const ctx = (error as { context?: unknown } | null)?.context;
  if (!ctx || typeof (ctx as Response).status !== "number") return {};
  const res = ctx as Response;
  let code: string | undefined;
  let saved: boolean | undefined;
  try {
    const body = await res.clone().json();
    if (body && typeof body.error === "string") code = body.error;
    if (body && body.saved === true) saved = true;
  } catch {
    /* body is not JSON */
  }
  return saved ? { status: res.status, code, saved } : { status: res.status, code };
}

/** Message for a failed send-quick-result call. The result itself stays on screen either way. */
export function quickResultMailMessage({ status, code, saved }: PaymentFailure): string {
  if (status === 400 || code === "invalid") return "לא הצלחנו לקבל את כתובת המייל. בדקו שהיא נכונה ונסו שוב.";
  if (status === 403 || code === "unknown session") {
    return "לא מצאנו את הבדיקה שלכם. רעננו את הדף, מלאו את הבדיקה שוב ונסו לשלוח.";
  }
  if (status === 429 || code === "too many attempts") {
    return "ניסינו לשלוח כמה פעמים בלי הצלחה. הבקשה שמורה אצלנו, ואפשר גם לשמור את התוצאה שמוצגת כאן.";
  }
  if (status === 502 || code === "send failed") {
    return saved
      ? "המייל לא נשלח בגלל תקלה אצלנו, אבל הבקשה נשמרה. התוצאה עדיין מוצגת כאן, ואפשר לנסות שוב בעוד כמה דקות."
      : "המייל לא נשלח בגלל תקלה אצלנו. התוצאה עדיין מוצגת כאן, ואפשר לנסות שוב בעוד כמה דקות.";
  }
  return "השליחה נכשלה, נסו שוב";
}
