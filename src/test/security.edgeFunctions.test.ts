// SECURITY-B regression guard over every Edge Function source file (static analysis).
// Fails when a function that uses the service role does not authenticate and authorize the caller,
// when the old broad "staff roles" check returns, or when raw case data is put into an outbound payload.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = join(__dirname, "../../supabase/functions");
const fns = readdirSync(DIR).filter((d) => !d.startsWith("_") && existsSync(join(DIR, d, "index.ts")))
  .map((d) => ({ name: d, src: readFileSync(join(DIR, d, "index.ts"), "utf8") }));

// Functions that are intentionally callable without a user session, and how they are protected.
const PUBLIC_OR_INTERNAL: Record<string, string> = {
  "public-chat": "no customer data; message length limits",
  "cancel-request": "writes a cancellation request only; validated input",
  "send-quick-result": "requires a completed quick-check session token + consent",
  "fetch-market-rates": "public market data only (P1: move behind isTrustedJobCaller)",
  "tranzila-notify": "provider secret token (payment integration: audit only, not changed)",
  "send-nudges": "isTrustedJobCaller",
  "send-reminders": "isTrustedJobCaller",
  "capture-lead": "disabled (410)",
  "generate-submission-doc": "disabled (410)",
};
const AUTHN = /getCallerId\(|auth\.getUser\(/;
const AUTHZ = /canAccessCase\(|isAdminUser\(|isTrustedJobCaller\(|\.user_id\s*!==\s*(user\.id|uid|userId|callerId)|c\.user_id\s*!==|user_id\s*!==\s*user\.id|offer\.advisor_id\s*!==\s*callerId/;

// Authenticated functions that only ever touch the caller's own data, with the exact proof required.
const SELF_SCOPED: Record<string, (src: string) => void> = {
  // identity from the session token; every query is filtered by that id
  chat: (src) => {
    expect(src).toMatch(/const user_id = await getCallerId\(/);
    expect(src.match(/\.from\("(profiles|cases|chat_messages)"\)[\s\S]{0,120}?\.eq\("user_id", user_id\)/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(src).not.toMatch(/body\?\.user_id|body\.user_id/);
  },
  // analyzes only the file in the request; reads no customer tables
  "parse-balance-report": (src) => {
    expect(src).toMatch(/auth\.getUser\(/);
    expect(src).not.toMatch(/\.from\("/);
  },
};

describe("Edge Functions: service-role use", () => {
  it("found the functions", () => expect(fns.length).toBeGreaterThanOrEqual(17));
  for (const f of fns) {
    if (SELF_SCOPED[f.name]) { it(`${f.name}: self-scoped (caller's own data only)`, () => SELF_SCOPED[f.name](f.src)); continue; }
    if (!/SUPABASE_SERVICE_ROLE_KEY/.test(f.src) || PUBLIC_OR_INTERNAL[f.name]) continue;
    it(`${f.name}: authenticates and authorizes before using the service role`, () => {
      expect(f.src).toMatch(AUTHN);
      expect(f.src).toMatch(AUTHZ);
    });
  }
  it("disabled functions return 410 and do no work", () => {
    for (const n of ["capture-lead", "generate-submission-doc"]) {
      const src = fns.find((f) => f.name === n)!.src;
      expect(src).toMatch(/status: 410/);
      expect(src).not.toMatch(/SERVICE_ROLE|ai\.gateway|createUser/);
    }
  });
});

describe("Edge Functions: role checks match the database", () => {
  for (const f of fns) {
    it(`${f.name}: no broad staff-role bypass or stale profiles.role check`, () => {
      expect(f.src).not.toMatch(/staffRoles|profiles"\)\.select\("role"\)/);
    });
  }
});

describe("Edge Functions: outbound payloads", () => {
  const AI = fns.filter((f) => /ai\.gateway\.lovable\.dev/.test(f.src));
  it("AI functions found", () => expect(AI.map((f) => f.name).sort()).toEqual(
    ["analyze-document", "chat", "generate-financial-score", "parse-balance-report", "public-chat"]));
  for (const f of AI) {
    it(`${f.name}: never forwards raw intake_data, profiles or document extractions`, () => {
      expect(f.src).not.toMatch(/intake_data:\s*intake|intake_data:\s*caseData|personal:\s*intake\.personal/);
      expect(f.src).not.toMatch(/document_extractions|data:\s*d\.ai_extracted_data/);
      expect(f.src).not.toMatch(/sample:\s*pool/);
    });
  }
  it("analyze-document never sends identity documents to AI and checks the storage path", () => {
    const src = fns.find((f) => f.name === "analyze-document")!.src;
    expect(src).toMatch(/NO_AI_DOC_TYPES/);
    expect(src).toMatch(/startsWith\(prefix\)/);
    expect(src).toMatch(/manual_review\)/);
  });
  it("Make.com receives an internal alert only", () => {
    const src = fns.find((f) => f.name === "notify-on-intake-complete")!.src;
    expect(src).toMatch(/makeIntakePayload\(/);
    expect(src).not.toMatch(/intake_data|profiles/);
  });
  it("no function logs AI response bodies or returns internal error messages", () => {
    for (const f of fns) {
      expect(f.src, f.name).not.toMatch(/console\.error\([^)]*await [a-zA-Z]+\.text\(\)/);
      expect(f.src, f.name).not.toMatch(/errText\)/);
      expect(f.src, f.name).not.toMatch(/error:\s*(error|e)\.message/);
    }
  });
});

describe("Edge Functions: uploads", () => {
  it("upload-document validates bytes, generates the object name and sets a short cache", () => {
    const src = fns.find((f) => f.name === "upload-document")!.src;
    expect(src).toMatch(/validateUpload\(bytes\)/);
    expect(src).toMatch(/crypto\.randomUUID\(\)/);
    expect(src).toMatch(/cacheControl: UPLOAD_CACHE_SECONDS/);
    expect(src).toMatch(/upsert: false/);
    expect(src).not.toMatch(/\$\{file\.name\}/);
  });
});

describe("webhook-handler: outbound data and logging", () => {
  const src = () => fns.find((f) => f.name === "webhook-handler")!.src;
  it("never logs the webhook URL", () => {
    expect(src()).not.toMatch(/console\.(log|error|warn)\([^)]*webhookUrl/);
    expect(src()).not.toMatch(/\$\{webhookUrl\}/);
  });
  it("sends only the allow-listed payload", () => {
    expect(src()).toMatch(/body: JSON\.stringify\(outbound\)/);
    expect(src()).toMatch(/webhookBasePayload\(/);
    // The removed financial builder lines must not return (the outbound object itself is unit-tested
    // in security.aiPayload.test.ts; offer display fields only feed the customer's own message).
    for (const k of ["mortgage_amount:", "current_balance:", "income_total:", "liabilities_monthly:", "risk_level:", "ltv:", "dti:", "goal:", "\\.\\.\\.safePayload", "payload: safePayload"]) {
      expect(src()).not.toMatch(new RegExp(k));
    }
  });
  it("stores only the operational payload in case_events", () => {
    expect(src()).toMatch(/case_events"\)\.insert\(\{ case_id, event_name, payload: base \}\)/);
  });
});

describe("send-nudges: disabled for launch", () => {
  const src = () => fns.find((f) => f.name === "send-nudges")!.src;
  it("returns before reading or sending anything unless NUDGES_ENABLED=true", () => {
    const s = src();
    const gate = s.indexOf('Deno.env.get("NUDGES_ENABLED") !== "true"');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(s.indexOf("createClient("));
    expect(gate).toBeLessThan(s.indexOf("fetch("));
  });
  it("does not log phone numbers or message text", () => {
    expect(src()).not.toMatch(/console\.log\([^)]*(profile\.phone|\$\{message\})/);
  });
  it("migration 0007 removes the scheduled nudge job (guarded)", () => {
    const sql = readFileSync(join(__dirname, "../../drizzle/migrations/0007_security_p0.sql"), "utf8");
    expect(sql).toMatch(/cron\.unschedule\(jobid\) FROM cron\.job WHERE jobname = 'send-nudges-every-30min'/);
    expect(sql).toMatch(/to_regclass\('cron\.job'\) IS NOT NULL/);
    expect(sql).not.toMatch(/send-reminders-every-3h/);
  });
});
