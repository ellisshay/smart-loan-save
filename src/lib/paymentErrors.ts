// Turns a failed cardcom-payment-create call into a message the client can act on.
// The function answers with an HTTP status and a short error code; secrets and provider details never reach here.

export type PaymentFailure = { status?: number; code?: string };

export function paymentErrorMessage({ status, code }: PaymentFailure): string {
  if (status === 401 || code === "unauthorized") {
    return "פג תוקף ההתחברות. התחברו מחדש ונסו שוב.";
  }
  if (status === 403 || code === "forbidden") {
    return "לחשבון שמחובר עכשיו אין גישה לתיק הזה. התחברו עם החשבון שפתח את התיק.";
  }
  if (status === 409 || code === "already_paid") {
    return "התשלום עבור התיק כבר התקבל, ואין צורך לשלם שוב.";
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
  try {
    const body = await res.clone().json();
    if (body && typeof body.error === "string") code = body.error;
  } catch {
    /* body is not JSON */
  }
  return { status: res.status, code };
}
