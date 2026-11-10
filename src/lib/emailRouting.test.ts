import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { CONTACT_EMAIL } from "./contactEmail";
import { TERMS, PRIVACY, ACCESS_OUTRO } from "@/data/legalTexts";
import { organizationSchema } from "@/seo/config";
import { staticPages } from "@/seo/pages";
import { CONTROLLER } from "@/lib/privacy";
import { BANK_EMAIL_TEMPLATE } from "@/types/admin";

const source = readFileSync("supabase/functions/_shared/gmail.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loadMailer = (fetchMock = vi.fn(), env: Record<string, string> = {}) => {
  const exports: {
    ADMIN_EMAIL?: string;
    CONTACT_EMAIL?: string;
    sendEmail?: (to: string, subject: string, html: string, replyTo?: string) => Promise<unknown>;
  } = {};
  runInNewContext(compiled, {
    exports, btoa, TextEncoder, fetch: fetchMock,
    Deno: { env: { get: (key: string) => (key in env ? env[key] : "test-only") } },
  });
  return exports;
};

const decodeRaw = (fetchMock: ReturnType<typeof vi.fn>) => {
  const request = fetchMock.mock.calls.at(-1)?.[1];
  const { raw } = JSON.parse(request.body);
  return atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
};

afterEach(() => vi.unstubAllGlobals());

describe("official email routing", () => {
  it("routes internal notifications to info@easymorte.co.il", () => {
    const { ADMIN_EMAIL, CONTACT_EMAIL: contact } = loadMailer();
    expect(ADMIN_EMAIL).toBe("info@easymorte.co.il");
    expect(contact).toBe("info@easymorte.co.il");
  });

  it("keeps the authenticated Gmail account as From and routes replies to info@", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendEmail } = loadMailer(fetchMock);
    if (!sendEmail) throw new Error("Mailer missing");
    await sendEmail("client@example.test", "Test", "<p>Test</p>");
    const lines = decodeRaw(fetchMock).split("\r\n");
    expect(lines).toContain("From: EasyMorte <easymorte.il@gmail.com>");
    expect(lines).toContain("Reply-To: info@easymorte.co.il");
    expect(lines.join("\n")).not.toContain("From: EasyMorte <info@easymorte.co.il>");
  });

  it("lets secrets override the inbox and the sending mailbox", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const { ADMIN_EMAIL, CONTACT_EMAIL: contact, sendEmail } = loadMailer(fetchMock, {
      CONTACT_EMAIL: "desk@easymorte.co.il",
      GMAIL_SENDING_MAILBOX: "info@easymorte.co.il",
    });
    expect(ADMIN_EMAIL).toBe("desk@easymorte.co.il");
    expect(contact).toBe("desk@easymorte.co.il");
    if (!sendEmail) throw new Error("Mailer missing");
    await sendEmail("client@example.test", "Test", "<p>Test</p>", "lead@example.test");
    const lines = decodeRaw(fetchMock).split("\r\n");
    expect(lines).toContain("From: EasyMorte <info@easymorte.co.il>");
    expect(lines).toContain("Reply-To: lead@example.test");
  });

  it("ignores a reply-to value that is not a single mailbox", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendEmail } = loadMailer(fetchMock);
    if (!sendEmail) throw new Error("Mailer missing");
    await sendEmail("client@example.test", "Test", "<p>Test</p>", "bad\r\nBcc: x@evil.test");
    expect(decodeRaw(fetchMock).split("\r\n")).toContain("Reply-To: info@easymorte.co.il");
  });
});

describe("displayed contact email", () => {
  it("uses info@easymorte.co.il on the public surfaces", () => {
    expect(CONTACT_EMAIL).toBe("info@easymorte.co.il");
    expect(TERMS).toContain(CONTACT_EMAIL);
    expect(PRIVACY).toContain(CONTACT_EMAIL);
    expect(ACCESS_OUTRO).toContain(CONTACT_EMAIL);
    expect(TERMS).not.toContain("{{CONTACT_EMAIL}}");
    expect(organizationSchema.email).toBe(CONTACT_EMAIL);
    expect((organizationSchema.contactPoint as { email: string }).email).toBe(CONTACT_EMAIL);
    expect(staticPages.find((p) => p.path === "/contact")?.description).toContain(CONTACT_EMAIL);
    expect(CONTROLLER.email).toBe(CONTACT_EMAIL);
    expect(BANK_EMAIL_TEMPLATE).toContain(CONTACT_EMAIL);
  });
});
