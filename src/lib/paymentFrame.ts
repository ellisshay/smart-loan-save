// Messages between the Cardcom return page (our own page, loaded inside the payment iframe) and the
// payment step around it. A message only tells the page to start checking: payment is confirmed solely
// by the server, from Cardcom's own result.

export const RETURN_MESSAGE_TYPE = "easymorte:cardcom-return";

export type ReturnMessage = { type: typeof RETURN_MESSAGE_TYPE; paid: "1" | "0"; caseId: string };

export function buildReturnMessage(paid: string | null, caseId: string | null): ReturnMessage | null {
  if ((paid !== "1" && paid !== "0") || !caseId) return null;
  return { type: RETURN_MESSAGE_TYPE, paid, caseId };
}

/** Accepts a message only from our own origin, from our payment iframe, about this case, in the expected shape. */
export function readReturnMessage(
  event: Pick<MessageEvent, "origin" | "source" | "data">,
  expected: { origin: string; frame: Window | null | undefined; caseId: string | null },
): "1" | "0" | null {
  if (event.origin !== expected.origin) return null;
  if (!expected.frame || event.source !== expected.frame) return null;
  const d = event.data as Partial<ReturnMessage> | null;
  if (!d || typeof d !== "object" || d.type !== RETURN_MESSAGE_TYPE) return null;
  if (!expected.caseId || d.caseId !== expected.caseId) return null;
  return d.paid === "1" || d.paid === "0" ? d.paid : null;
}
