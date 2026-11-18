// Cardcom (API v11) payment safety: source-level guarantees for the two Edge Functions.
// Field names follow the CardCom v11 OpenAPI spec (LowProfile/Create, LowProfile/GetLpResult).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const notify = readFileSync("supabase/functions/cardcom-notify/index.ts", "utf8");
const create = readFileSync("supabase/functions/cardcom-payment-create/index.ts", "utf8");

describe("cardcom-payment-create", () => {
  it("fixes the amount server-side at 3,450 ILS and binds the case", () => {
    expect(create).toMatch(/const AMOUNT = 3450;/);
    expect(create).toMatch(/Amount: AMOUNT/);
    expect(create).toMatch(/ISOCoinId: 1/);
    expect(create).toMatch(/ReturnValue: caseId/);
    expect(create).not.toMatch(/body as any\)\.amount|body\.amount/i);
  });
  it("requires a signed-in caller with access to the case", () => {
    expect(create.indexOf("getCallerId(")).toBeLessThan(create.indexOf("fetch(CREATE_URL"));
    expect(create.indexOf("canAccessCase(")).toBeLessThan(create.indexOf("fetch(CREATE_URL"));
  });
  it("refuses to open a payment page for a case that is already paid", () => {
    expect(create).toMatch(/if \(caseRow\.payment_succeeded\)[\s\S]*already_paid[\s\S]*409/);
  });
  it("does not log or return provider responses, credentials or raw errors", () => {
    expect(create).not.toMatch(/console\.(log|error)\([^)]*\bdata\)/);
    expect(create).not.toMatch(/String\(err\)/);
    expect(create).not.toMatch(/console\.[a-z]+\([^)]*api(Password|Name)/i);
  });
});

describe("cardcom-notify (webhook)", () => {
  it("requires the URL token before doing anything", () => {
    expect(notify.indexOf('tokenMatches(admin, "cardcom_notify"')).toBeLessThan(notify.indexOf("fetch(VERIFY_URL"));
  });
  it("never trusts the webhook body: re-verifies with GetLpResult using only LowProfileId", () => {
    expect(notify).toMatch(/VERIFY_URL = "https:\/\/secure\.cardcom\.solutions\/api\/v11\/LowProfile\/GetLpResult"/);
    expect(notify).toMatch(/LowProfileId: lowProfileId/);
  });
  it("marks paid only when the charge itself is approved, on our terminal, in ILS, for 3,450", () => {
    expect(notify).toMatch(/Number\(tranzactionInfo\.ResponseCode\) !== 0/);
    expect(notify).toMatch(/!== terminal/);
    expect(notify).toMatch(/CoinId \?\? 1\) !== 1/);
    expect(notify).toMatch(/Math\.abs\(amount - AMOUNT\) > 0\.01/);
    // All checks happen before the case is updated.
    const update = notify.indexOf("payment_succeeded: true");
    for (const k of ["tranzactionInfo.ResponseCode", "!== terminal", "amount_mismatch"]) expect(notify.indexOf(k)).toBeLessThan(update);
  });
  it("is idempotent: only the call that flips payment_succeeded sends the event and email", () => {
    expect(notify).toMatch(/\.eq\("payment_succeeded", false\)\s*\.select\("id"\)/);
    expect(notify).toMatch(/if \(!updated\?\.length\)/);
    expect(notify.indexOf("if (!updated?.length)")).toBeLessThan(notify.indexOf('case_events").insert'));
  });
  it("does not log the raw webhook body or raw errors", () => {
    expect(notify).not.toMatch(/raw\.slice/);
    expect(notify).not.toMatch(/String\(err\)/);
  });
});

describe("payment confirmation email", () => {
  const caseEmail = readFileSync("supabase/functions/case-email/index.ts", "utf8");
  it("case-email accepts the server's service-role call from cardcom-notify", () => {
    expect(caseEmail).toMatch(/const trustedServer = !!serviceKey && token === serviceKey;/);
    // Everyone else still needs a signed-in user with access to the case.
    expect(caseEmail).toMatch(/if \(!trustedServer && !user\) return json\(\{ error: "Unauthorized" \}, 401\);/);
    expect(caseEmail).toMatch(/if \(!trustedServer\) \{[\s\S]*Forbidden/);
  });
  it("is sent at most once per case (emails_sent flags)", () => {
    expect(caseEmail).toMatch(/!sent\.client_payment/);
    expect(caseEmail).toMatch(/!sent\.admin_payment/);
  });
  it("cardcom-notify logs a failed email instead of ignoring it", () => {
    expect(notify).toMatch(/const \{ error: mailErr \} = await admin\.functions\.invoke\("case-email"/);
    expect(notify).toMatch(/if \(mailErr\) console\.error/);
  });
});
