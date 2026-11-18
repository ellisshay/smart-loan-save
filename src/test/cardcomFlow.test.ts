import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Runs the real payment functions against a fake database and a fake Cardcom. No real charge, no email.
type Handler = (request: Request) => Promise<Response>;
type Row = Record<string, unknown>;
const CASE = "550e8400-e29b-41d4-a716-446655440000";

function fakeDb(seed: { case?: Row; attempts?: Row[] } = {}) {
  const tables: Record<string, Row[]> = {
    cases: [{ id: CASE, case_number: "EM-1", status: "Draft", payment_succeeded: false, ...seed.case }],
    internal_job_tokens: [{ name: "cardcom_notify", token: "test-token" }],
    payment_attempts: seed.attempts ?? [],
    case_events: [],
  };
  let n = 0;
  const calls: string[] = [];
  const from = (table: string) => {
    const filters: [string, unknown][] = [];
    let op: "select" | "insert" | "update" = "select";
    let values: Row = {};
    let wantRows = false;
    const rows = () => (tables[table] ||= []).filter((r) => filters.every(([k, v]) => r[k] === v));
    const exec = () => {
      if (op === "insert") { const row = { id: `${table}-${++n}`, ...values }; tables[table].push(row); calls.push(`insert:${table}`); return { data: row, error: null }; }
      if (op === "update") { const hit = rows(); hit.forEach((r) => Object.assign(r, values)); calls.push(`update:${table}`); return { data: wantRows ? hit.map((r) => ({ id: r.id })) : null, error: null }; }
      const hit = rows();
      return { data: hit, error: null };
    };
    const chain: Record<string, unknown> = {
      select: () => { if (op !== "select") wantRows = true; return chain; },
      insert: (v: Row) => { op = "insert"; values = v; return chain; },
      update: (v: Row) => { op = "update"; values = v; return chain; },
      eq: (k: string, v: unknown) => { filters.push([k, v]); return chain; },
      order: () => chain,
      limit: () => chain,
      single: async () => { const r = exec(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: Array.isArray(r.data) && !r.data[0] ? { message: "none" } : null }; },
      maybeSingle: async () => { const r = exec(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null }; },
      then: (resolve: (v: unknown) => void) => resolve(exec()),
    };
    return chain;
  };
  return { db: { from, functions: { invoke: vi.fn().mockResolvedValue({ error: null }) } }, tables, calls };
}

function load(path: string, mocks: Record<string, unknown>): Handler {
  let handler: Handler | undefined;
  const source = readFileSync(path, "utf8").replace(/^import .*;\r?\n/gm, "");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(compiled, {
    Request, Response, URL, URLSearchParams, Date, JSON, console: { ...console, error: () => {}, log: () => {} }, corsHeaders: {},
    serve: (fn: Handler) => { handler = fn; },
    Deno: { env: { get: (k: string) => ({ CARDCOM_TERMINAL_NUMBER: "1000", CARDCOM_API_NAME: "test-api", SUPABASE_URL: "https://db.test" } as Record<string, string>)[k] ?? "" } },
    ...mocks,
  });
  if (!handler) throw new Error("handler missing");
  return handler;
}

const billing = { firstName: "דנה", lastName: "לוי", invoiceName: "דנה לוי", email: "dana@example.test", phone: "0501234567", taxId: "" };
const createReq = (extra: Row = {}) => new Request("https://fn.test", { method: "POST", body: JSON.stringify({ caseId: CASE, origin: "http://localhost:8080", billing, ...extra }) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function createWith(db: ReturnType<typeof fakeDb>, fetchImpl: (url: string, init: RequestInit) => Promise<Response>) {
  const fetch = vi.fn(fetchImpl);
  return { fetch, handler: load("supabase/functions/cardcom-payment-create/index.ts", {
    adminClient: () => db.db, getCallerId: async () => "owner", canAccessCase: async () => true, fetch,
  }) };
}
const lpCreated = (url: string) => url.endsWith("/Create") ? json({ ResponseCode: 0, Url: "https://secure.cardcom.solutions/pay/new", LowProfileId: "lp-new" }) : json({ ResponseCode: 0 });

describe("cardcom-payment-create (#44)", () => {
  it("opens a page with the invoice details collected on our page, card fields only at Cardcom, and records the attempt", async () => {
    const db = fakeDb();
    const { handler, fetch } = createWith(db, async (u) => lpCreated(u));
    const res = await handler(createReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://secure.cardcom.solutions/pay/new", lowProfileId: "lp-new" });
    const payload = JSON.parse(String(fetch.mock.calls[0][1].body));
    expect(payload).toMatchObject({ Amount: 3450, ISOCoinId: 1, Operation: "ChargeOnly", ReturnValue: CASE, AdvancedDefinition: { MinNumOfPayments: 1, MaxNumOfPayments: 4 } });
    expect(payload.Document).toMatchObject({ TypeToCreate: "Auto", IsAllowEditDocument: false, Name: "דנה לוי", Email: "dana@example.test", Mobile: "0501234567" });
    expect(payload.UIDefinition).toMatchObject({ IsHideCardOwnerName: true, IsHideCardOwnerEmail: true, IsHideCardOwnerPhone: true });
    expect(db.tables.payment_attempts).toEqual([expect.objectContaining({ case_id: CASE, low_profile_id: "lp-new", status: "open" })]);
  });

  it("rejects incomplete invoice details before calling Cardcom", async () => {
    const db = fakeDb();
    const { handler, fetch } = createWith(db, async (u) => lpCreated(u));
    const res = await handler(createReq({ billing: { ...billing, email: "bad" } }));
    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("an earlier page that was already charged: no new page, the client is told to wait for confirmation", async () => {
    const db = fakeDb({ attempts: [{ id: "a1", case_id: CASE, low_profile_id: "lp-old", status: "open" }] });
    const { handler, fetch } = createWith(db, async (u) => u.endsWith("/GetLpResult") ? json({ ResponseCode: 0, TranzactionInfo: { ResponseCode: 0 } }) : lpCreated(u));
    const res = await handler(createReq());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("payment_pending_verification");
    expect(fetch.mock.calls.some(([u]) => String(u).endsWith("/Create"))).toBe(false);
  });

  it("an earlier page whose status cannot be read: no new page, to avoid a double charge", async () => {
    const db = fakeDb({ attempts: [{ id: "a1", case_id: CASE, low_profile_id: "lp-old", status: "open" }] });
    const { handler, fetch } = createWith(db, async (u) => { if (u.endsWith("/GetLpResult")) throw new Error("network"); return lpCreated(u); });
    const res = await handler(createReq());
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("payment_status_unknown");
    expect(fetch.mock.calls.some(([u]) => String(u).endsWith("/Create"))).toBe(false);
  });

  it("an earlier page that was not charged is closed and a new one opens", async () => {
    const db = fakeDb({ attempts: [{ id: "a1", case_id: CASE, low_profile_id: "lp-old", status: "open" }] });
    const { handler } = createWith(db, async (u) => u.endsWith("/GetLpResult") ? json({ ResponseCode: 0, TranzactionInfo: null }) : lpCreated(u));
    expect((await handler(createReq())).status).toBe(200);
    expect(db.tables.payment_attempts.map((a) => [a.low_profile_id, a.status])).toEqual([["lp-old", "closed"], ["lp-new", "open"]]);
  });

  it("a declined earlier page is also safe to replace", async () => {
    const db = fakeDb({ attempts: [{ id: "a1", case_id: CASE, low_profile_id: "lp-old", status: "open" }] });
    const { handler } = createWith(db, async (u) => u.endsWith("/GetLpResult") ? json({ ResponseCode: 0, TranzactionInfo: { ResponseCode: 33 } }) : lpCreated(u));
    expect((await handler(createReq())).status).toBe(200);
  });

  it("a paid case never gets a new page", async () => {
    const db = fakeDb({ case: { payment_succeeded: true } });
    const { handler, fetch } = createWith(db, async (u) => lpCreated(u));
    expect((await handler(createReq())).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
});

function notifyWith(db: ReturnType<typeof fakeDb>, result: Row) {
  const fetch = vi.fn(async () => json(result));
  return { fetch, handler: load("supabase/functions/cardcom-notify/index.ts", {
    adminClient: () => db.db, tokenMatches: async (_a: unknown, _n: string, t: string | null) => t === "test-token", fetch,
  }) };
}
const approved = (over: Row = {}) => ({ ResponseCode: 0, ReturnValue: CASE, TranzactionId: 77, TranzactionInfo: { ResponseCode: 0, TerminalNumber: 1000, CoinId: 1, Amount: 3450, Last4CardDigitsString: "4242", ...over } });
const hook = (body: Row = { LowProfileId: "lp-new" }) => new Request("https://fn.test/cardcom-notify?token=test-token", { method: "POST", body: JSON.stringify(body) });

describe("cardcom-notify (#44, with #9)", () => {
  it("marks the case paid only after Cardcom confirms the charge, and closes the attempt", async () => {
    const db = fakeDb({ attempts: [{ id: "a1", case_id: CASE, low_profile_id: "lp-new", status: "open" }] });
    const { handler } = notifyWith(db, approved());
    const res = await handler(hook());
    expect(await res.json()).toMatchObject({ ok: true });
    expect(db.tables.cases[0].payment_succeeded).toBe(true);
    expect(db.tables.payment_attempts[0].status).toBe("paid");
    expect(db.db.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it("a repeated webhook does not pay or email twice", async () => {
    const db = fakeDb();
    const { handler } = notifyWith(db, approved());
    await handler(hook());
    const second = await (await handler(hook())).json();
    expect(second).toMatchObject({ ok: true, already: true });
    expect(db.db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(db.tables.case_events.length).toBe(1);
  });

  it.each([
    ["declined", { ResponseCode: 33 }],
    ["wrong amount", { Amount: 100 }],
    ["another terminal", { TerminalNumber: 999 }],
    ["another currency", { CoinId: 2 }],
  ])("%s: the case stays unpaid", async (_name, over) => {
    const db = fakeDb();
    const { handler } = notifyWith(db, approved(over));
    expect((await (await handler(hook())).json()).ok).toBe(false);
    expect(db.tables.cases[0].payment_succeeded).toBe(false);
    expect(db.db.functions.invoke).not.toHaveBeenCalled();
  });

  it("without the URL token nothing is checked or changed", async () => {
    const db = fakeDb();
    const { handler, fetch } = notifyWith(db, approved());
    const res = await handler(new Request("https://fn.test/cardcom-notify?token=wrong", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
