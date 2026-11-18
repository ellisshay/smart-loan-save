// parse-balance-report edge function with mocked AI gateway, PDF text layer and database (#52).
// Synthetic data only. No real provider call.
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as shared from "../../supabase/functions/_shared/balanceReport";
import { SYNTHETIC_PAGES, syntheticModelOutput } from "./fixtures/balanceReport.synthetic";

type Handler = (req: Request) => Promise<Response>;
const sse = (text: string) => new Response(
  [JSON.stringify({ type: "response.output_text.delta", delta: text.slice(0, 50) }), JSON.stringify({ type: "response.output_text.delta", delta: text.slice(50) })]
    .map((d) => `data: ${d}\n`).join("") + "data: [DONE]\n", { status: 200 });

function setup(opts: { fetch: (url: string, init: RequestInit) => Promise<Response>; pages?: string[] | null; env?: Record<string, string>; usedToday?: number }) {
  let handler: Handler | undefined;
  const source = readFileSync("supabase/functions/parse-balance-report/index.ts", "utf8").replace(/^import .*;\r?\n/gm, "");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const inserted: Record<string, unknown>[] = [];
  const logs: string[] = [];
  const capture = (...a: unknown[]) => logs.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  const env: Record<string, string> = { LOVABLE_API_KEY: "test-only", SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "test-only", ...opts.env };
  const fetchMock = vi.fn(opts.fetch);
  const table = {
    select: () => table, eq: () => table,
    gte: async () => ({ count: opts.usedToday ?? 0 }),
    insert: (row: Record<string, unknown>) => { inserted.push(row); return { select: () => ({ single: async () => ({ data: { id: "analysis-1" } }) }) }; },
  };
  runInNewContext(compiled, {
    Request, Response, TextDecoder, Uint8Array, atob, AbortController, JSON, Promise, Date, Object, Array, Math, Number, String,
    setTimeout: (fn: () => void) => { queueMicrotask(fn); return 0; }, clearTimeout: () => {},
    console: { log: capture, warn: capture, error: capture },
    corsHeaders: {},
    createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) }, from: () => table }),
    ...shared,
    fetch: fetchMock,
    require: (m: string) => {
      if (m.includes("unpdf") && opts.pages) return { getDocumentProxy: async () => ({}), extractText: async () => ({ totalPages: opts.pages!.length, text: opts.pages }) };
      throw new Error("no module");
    },
    Deno: { serve: (fn: Handler) => { handler = fn; }, env: { get: (k: string) => env[k] } },
  });
  return { handler: handler!, fetchMock, inserted, logs };
}
const req = (mime = "application/pdf") => new Request("https://fn.test", {
  method: "POST", headers: { Authorization: "Bearer t" },
  body: JSON.stringify({ file: btoa("%PDF-synthetic"), mime, name: "my-real-name.pdf" }),
});
const sentText = (init: RequestInit) => JSON.stringify(JSON.parse(String(init.body)).input);

describe("parse-balance-report (#52)", () => {
  it("text layer: sends text only (no file), reconciles in code, saves and returns an id", async () => {
    const { handler, fetchMock, inserted } = setup({ pages: SYNTHETIC_PAGES, fetch: async () => sse(JSON.stringify(syntheticModelOutput())) });
    const res = await handler(req());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ analysis_id: "analysis-1", status: "complete", mode: "text" });
    expect(body.tracks.map((t: { type: string }) => t.type)).toEqual(["fixed_nl", "prime", "fixed_l"]);
    const sent = sentText(fetchMock.mock.calls[0][1]);
    expect(sent).toContain("input_text");
    expect(sent).not.toContain("input_file");
    expect(sent).toContain("<document>");
    expect(sent).not.toContain("my-real-name");
    expect(inserted[0]).toMatchObject({ user_id: "user-1", status: "complete", mode: "text" });
    expect(JSON.stringify(inserted[0])).not.toContain("my-real-name");
  });
  it("reversed RTL digits in the text layer are repaired before the model sees them", async () => {
    const reversed = SYNTHETIC_PAGES.map((p) => p.replace(/\d[\d.,/]*\d|\d/g, (t) => [...t].reverse().join("")));
    const { handler, fetchMock } = setup({ pages: reversed, fetch: async () => sse(JSON.stringify(syntheticModelOutput())) });
    expect((await handler(req())).status).toBe(200);
    const sent = sentText(fetchMock.mock.calls[0][1]);
    expect(sent).toContain("600,000.00");
    expect(sent).not.toContain("00.000,006");
  });
  it("no usable text layer: falls back to the file (vision)", async () => {
    const { handler, fetchMock } = setup({ pages: null, fetch: async () => sse(JSON.stringify(syntheticModelOutput())) });
    const body = await (await handler(req())).json();
    expect(body.mode).toBe("file");
    expect(sentText(fetchMock.mock.calls[0][1])).toContain("input_file");
  });
  it("retries once on a gateway 5xx, then gives a clear error; logs carry no document content", async () => {
    const { handler, fetchMock, logs } = setup({ pages: SYNTHETIC_PAGES, fetch: async () => new Response("upstream says: 250,000.00 secret", { status: 500 }) });
    const res = await handler(req());
    expect(res.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logs.join("\n")).not.toMatch(/250,000|secret|מסלול/);
  });
  it("success logs only counts and status", async () => {
    const { handler, logs } = setup({ pages: SYNTHETIC_PAGES, fetch: async () => sse(JSON.stringify(syntheticModelOutput())) });
    await handler(req());
    expect(logs.join("\n")).not.toMatch(/250,000|4\.10|מסלול|בנק לדוגמה/);
  });
  it("daily cap per user stops before any model call", async () => {
    const { handler, fetchMock } = setup({ usedToday: 10, pages: SYNTHETIC_PAGES, fetch: async () => sse("{}") });
    expect((await handler(req())).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("conflicting fields: no second model unless configured; with it, only the doubtful fields are asked", async () => {
    const bad = syntheticModelOutput(); bad.totals.principal.value = "610,000.00";
    const one = setup({ pages: SYNTHETIC_PAGES, fetch: async () => sse(JSON.stringify(bad)) });
    const b1 = await (await one.handler(req())).json();
    expect(b1.status).toBe("conflict");
    expect(one.fetchMock).toHaveBeenCalledTimes(1);

    const two = setup({ env: { BALANCE_RECHECK_MODEL: "recheck-model" }, pages: SYNTHETIC_PAGES,
      fetch: async (_u, init) => sse(JSON.parse(String(init.body)).model === "recheck-model" ? JSON.stringify({ "totals.principal": "600,000.00" }) : JSON.stringify(bad)) });
    const b2 = await (await two.handler(req())).json();
    expect(two.fetchMock).toHaveBeenCalledTimes(2);
    const recheckPrompt = sentText(two.fetchMock.mock.calls[1][1]);
    expect(recheckPrompt).toContain("totals.principal");
    expect(recheckPrompt).not.toContain("tracks.0.principal");
    // The two readings disagree (610,000 vs 600,000): the total is cleared, not chosen.
    expect(b2.report.totals.principal.value).toBeNull();
  });
  it("model output that is not JSON is a 422, not a guess", async () => {
    const { handler } = setup({ pages: SYNTHETIC_PAGES, fetch: async () => sse("sorry, I cannot") });
    expect((await handler(req())).status).toBe(422);
  });
});
