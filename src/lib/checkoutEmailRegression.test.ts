import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

type Handler = (request: Request) => Promise<Response>;
function loadHandler(path: string, mocks: Record<string, unknown>) {
  let handler: Handler | undefined;
  const source = readFileSync(path, "utf8").replace(/^import .*;\r?\n/gm, "");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(compiled, {
    Request, Response, console, z, corsHeaders: {},
    serve: (fn: Handler) => { handler = fn; },
    Deno: { serve: (fn: Handler) => { handler = fn; }, env: { get: () => "test-only" } },
    ...mocks,
  });
  if (!handler) throw new Error("Handler missing");
  return handler;
}

function query(data: unknown) {
  const chain = {
    select: () => chain, eq: () => chain,
    maybeSingle: async () => ({ data }),
    single: async () => ({ data, error: null }),
    limit: async () => ({ data }),
  };
  return chain;
}

describe("quick-check email authorization", () => {
  const request = () => new Request("https://example.test", {
    method: "POST", body: JSON.stringify({
      token: "550e8400-e29b-41d4-a716-446655440000", email: "client@example.test",
      ltv: 70, dti: 25, mixes: [],
    }),
  });
  function setup(session: unknown, consents: unknown[]) {
    const sendEmail = vi.fn().mockResolvedValue({ id: "mock-message" });
    const handler = loadHandler("supabase/functions/send-quick-result/index.ts", {
      createClient: () => ({ from: (table: string) => query(table === "quiz_sessions" ? session : consents) }),
      sendEmail, wrapClient: (_title: string, body: string) => body, esc: String, SITE_URL: "https://example.test",
    });
    return { handler, sendEmail };
  }
  it("allows an estimated inquiry with quick-check consent without completing a full case", async () => {
    const { handler, sendEmail } = setup({ id: "inquiry", completed: false }, [{ id: "consent" }]);
    expect((await handler(request())).status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("does not send without quick-check consent", async () => {
    const { handler, sendEmail } = setup({ id: "inquiry", completed: false }, []);
    expect((await handler(request())).status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("does not send for an unknown inquiry", async () => {
    const { handler, sendEmail } = setup(null, [{ id: "consent" }]);
    expect((await handler(request())).status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("Cardcom checkout document", () => {
  it("includes required editable document data at 3,450 ILS and keeps 1 to 4 installments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ResponseCode: 0, Url: "https://example.test/checkout", LowProfileId: "mock" })));
    const handler = loadHandler("supabase/functions/cardcom-payment-create/index.ts", {
      adminClient: () => ({ from: (table: string) => query(table === "cases" ? { case_number: "TEST" } : { token: "test-only" }) }),
      getCallerId: async () => "owner", canAccessCase: async () => true, fetch: fetchMock,
      Deno: { env: { get: (name: string) => name === "CARDCOM_TERMINAL_NUMBER" ? "1000" : "test-only" } },
    });
    const response = await handler(new Request("https://example.test", { method: "POST", body: JSON.stringify({ caseId: "test-case", origin: "http://localhost:8080" }) }));
    expect(response.status).toBe(200);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.Amount).toBe(3450);
    expect(payload.Document.TypeToCreate).toBe("Auto");
    expect(payload.Document.IsAllowEditDocument).toBe(true);
    expect(payload.Document.Products).toEqual([{ Description: "פתיחת תיק EASY MORTE TEST", Quantity: 1, UnitCost: 3450, TotalLineCost: 3450 }]);
    expect(payload.AdvancedDefinition).toEqual({ MinNumOfPayments: 1, MaxNumOfPayments: 4 });
    expect(payload.Operation).toBe("ChargeOnly");
  });
});