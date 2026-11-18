import { describe, expect, it } from "vitest";
import { paymentErrorMessage, readFunctionError } from "./functionErrors";

const res = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("paymentErrorMessage", () => {
  it("tells the client to sign in again when the session is missing", () => {
    expect(paymentErrorMessage({ status: 401, code: "unauthorized" })).toContain("התחברו מחדש");
  });
  it("explains a case the signed-in account cannot access", () => {
    expect(paymentErrorMessage({ status: 403 })).toContain("אין גישה לתיק");
  });
  it("does not ask to pay again for a paid case", () => {
    expect(paymentErrorMessage({ status: 409, code: "already_paid" })).toContain("כבר התקבל");
  });
  it("a provider configuration problem points to the phone, not to retrying", () => {
    for (const f of [{ status: 503 }, { code: "cardcom_not_configured" }, { status: 400, code: "bad_origin" }]) {
      const m = paymentErrorMessage(f);
      expect(m).toContain("055-996-1997");
      expect(m).not.toContain("נסו שוב בעוד רגע");
    }
  });
  it("a temporary or unknown failure keeps the retry message", () => {
    for (const f of [{ status: 502, code: "cardcom_create_failed" }, { status: 500 }, {}]) {
      expect(paymentErrorMessage(f)).toBe("לא הצלחנו לפתוח את טופס התשלום. נסו שוב בעוד רגע.");
    }
  });
  it("never includes provider details from the response", () => {
    expect(paymentErrorMessage({ status: 502, code: "cardcom_create_failed" })).not.toMatch(/cardcom|Description|terminal/i);
  });
});

describe("readFunctionError", () => {
  it("reads status and code from the function response", async () => {
    expect(await readFunctionError({ context: res(503, { error: "cardcom_not_configured" }) })).toEqual({ status: 503, code: "cardcom_not_configured" });
  });
  it("handles a non JSON body", async () => {
    expect(await readFunctionError({ context: res(502, "Bad Gateway") })).toEqual({ status: 502, code: undefined });
  });
  it("handles a network error without a response", async () => {
    expect(await readFunctionError(new Error("Failed to fetch"))).toEqual({});
    expect(await readFunctionError(null)).toEqual({});
  });
});

import { quickResultMailMessage } from "./functionErrors";
describe("quickResultMailMessage", () => {
  it("separates a bad address, a lost session and a provider failure", () => {
    expect(quickResultMailMessage({ status: 400, code: "invalid" })).toContain("כתובת המייל");
    expect(quickResultMailMessage({ status: 403, code: "unknown session" })).toContain("לא מצאנו את הבדיקה");
    const provider = quickResultMailMessage({ status: 502, code: "send failed" });
    expect(provider).toContain("תקלה אצלנו");
    expect(provider).not.toContain("נשלח למייל");
  });
  it("keeps the generic message when nothing is known", () => {
    expect(quickResultMailMessage({})).toBe("השליחה נכשלה, נסו שוב");
  });
});

describe("quick result request saved on failure (#44)", () => {
  it("says the request was saved when the server kept it, without claiming it was sent", () => {
    const m = quickResultMailMessage({ status: 502, code: "send failed", saved: true });
    expect(m).toContain("הבקשה נשמרה");
    expect(m).not.toContain("נשלחה");
  });
  it("does not claim it was saved when the server did not say so", () => {
    expect(quickResultMailMessage({ status: 502, code: "send failed" })).not.toContain("נשמרה");
  });
  it("explains the attempt limit", () => {
    expect(quickResultMailMessage({ status: 429, code: "too many attempts" })).toContain("כמה פעמים");
  });
  it("reads the saved flag from the response", async () => {
    const res = new Response(JSON.stringify({ error: "send failed", saved: true }), { status: 502 });
    expect(await readFunctionError({ context: res })).toEqual({ status: 502, code: "send failed", saved: true });
  });
});
