import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";
import { quickResultMailMessage, readFunctionError } from "./functionErrors";

// Loads the real edge function with a fake database and a fake email provider. Nothing is sent.
type Handler = (request: Request) => Promise<Response>;
type Row = Record<string, unknown> & { id: string };

function fakeDb(opts: { consent?: boolean; failWrites?: boolean } = {}) {
  const requests: Row[] = [];
  let n = 0;
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    let op: "select" | "insert" | "update" = "select";
    let values: Record<string, unknown> = {};
    const match = (r: Record<string, unknown>) => filters.every(([k, v]) => r[k] === v);
    const run = () => {
      if (table === "quiz_sessions") return { data: { id: "session" } };
      if (table === "consents") return { data: opts.consent === false ? [] : [{ id: "consent" }] };
      if (opts.failWrites && op !== "select") throw new Error("db down");
      if (op === "insert") { const row = { id: `r${++n}`, ...values } as Row; requests.push(row); return { data: row, error: null }; }
      if (op === "update") { requests.filter(match).forEach((r) => Object.assign(r, values)); return { data: null, error: null }; }
      return { data: requests.find(match) ?? null, error: null };
    };
    const chain = {
      select: () => chain,
      insert: (v: Record<string, unknown>) => { op = "insert"; values = v; return chain; },
      update: (v: Record<string, unknown>) => { op = "update"; values = v; return chain; },
      eq: (k: string, v: unknown) => { filters.push([k, v]); return op === "update" ? Promise.resolve(run()) : chain; },
      limit: async () => run(),
      maybeSingle: async () => run(),
      single: async () => run(),
    };
    return chain;
  };
  return { db: { from }, requests };
}

function load(db: unknown, sendEmail: ReturnType<typeof vi.fn>): Handler {
  let handler: Handler | undefined;
  const source = readFileSync("supabase/functions/send-quick-result/index.ts", "utf8").replace(/^import .*;\r?\n/gm, "");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(compiled, {
    Request, Response, console: { ...console, error: () => {} }, z, corsHeaders: {}, Date,
    Deno: { serve: (fn: Handler) => { handler = fn; }, env: { get: () => "test-only" } },
    createClient: () => db, sendEmail, wrapClient: (_t: string, b: string) => b, esc: String, SITE_URL: "https://example.test",
  });
  if (!handler) throw new Error("handler missing");
  return handler;
}

const req = (email = "Client@Example.test") => new Request("https://example.test", {
  method: "POST",
  body: JSON.stringify({ token: "550e8400-e29b-41d4-a716-446655440000", email, ltv: 70, dti: 25, mixes: [] }),
});

describe("send-quick-result keeps the request (#44)", () => {
  it("success: the request is saved once and marked sent", async () => {
    const { db, requests } = fakeDb();
    const send = vi.fn().mockResolvedValue({ id: "mock" });
    const res = await load(db, send)(req());
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ email: "client@example.test", status: "sent", attempts: 1 });
  });

  it("provider failure: the request is kept as failed and the client is told it was saved, not sent", async () => {
    const { db, requests } = fakeDb();
    const res = await load(db, vi.fn().mockRejectedValue(new Error("provider down")))(req());
    expect(res.status).toBe(502);
    expect(await res.clone().json()).toEqual({ error: "send failed", saved: true });
    expect(requests[0]).toMatchObject({ status: "failed", last_error: "provider_failed", attempts: 1 });
    const msg = quickResultMailMessage(await readFunctionError({ context: res }));
    expect(msg).toContain("הבקשה נשמרה");
    expect(msg).not.toContain("נשלחה");
  });

  it("a retry updates the same request instead of creating another", async () => {
    const { db, requests } = fakeDb();
    await load(db, vi.fn().mockRejectedValue(new Error("down")))(req());
    const res = await load(db, vi.fn().mockResolvedValue({ id: "mock" }))(req("client@example.test"));
    expect(res.status).toBe(200);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ status: "sent", attempts: 2 });
  });

  it("attempts are capped and the provider is not called again", async () => {
    const { db, requests } = fakeDb();
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    for (let i = 0; i < 5; i++) await load(db, failing)(req());
    const send = vi.fn();
    const res = await load(db, send)(req());
    expect(res.status).toBe(429);
    expect(send).not.toHaveBeenCalled();
    expect(requests[0].attempts).toBe(5);
  });

  it("if saving fails, the email is still sent", async () => {
    const { db } = fakeDb({ failWrites: true });
    const send = vi.fn().mockResolvedValue({ id: "mock" });
    expect((await load(db, send)(req())).status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("without the quick check consent nothing is saved or sent", async () => {
    const { db, requests } = fakeDb({ consent: false });
    const send = vi.fn();
    expect((await load(db, send)(req())).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });
});
