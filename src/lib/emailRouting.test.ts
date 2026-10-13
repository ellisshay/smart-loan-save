import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync("supabase/functions/_shared/gmail.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loadMailer = (fetchMock = vi.fn()) => {
  const exports: {
    ADMIN_EMAIL?: string;
    CONTACT_EMAIL?: string;
    sendEmail?: (to: string, subject: string, html: string) => Promise<unknown>;
  } = {};
  runInNewContext(compiled, {
    exports, btoa, TextEncoder, fetch: fetchMock,
    Deno: { env: { get: () => "test-only" } },
  });
  return exports;
};

afterEach(() => vi.unstubAllGlobals());

describe("official email routing", () => {
  it("routes internal notifications to info@easymorte.co.il", () => {
    const { ADMIN_EMAIL, CONTACT_EMAIL } = loadMailer();
    expect(ADMIN_EMAIL).toBe("info@easymorte.co.il");
    expect(CONTACT_EMAIL).toBe("info@easymorte.co.il");
  });

  it("routes customer replies to info@easymorte.co.il", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendEmail } = loadMailer(fetchMock);
    if (!sendEmail) throw new Error("Mailer missing");
    await sendEmail("client@example.test", "Test", "<p>Test</p>");
    const request = fetchMock.mock.calls[0]?.[1];
    const { raw } = JSON.parse(request.body);
    const message = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    expect(message.split("\r\n")).toContain("Reply-To: info@easymorte.co.il");
  });
});