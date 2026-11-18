// Security scenarios that need a real (hosted) Supabase STAGING project: Storage signed URLs,
// Auth sessions and deployed Edge Functions. Synthetic data only.
//
// Required environment (set as environment secrets, never pasted in chat or committed):
//   STAGING_SUPABASE_URL, STAGING_ANON_KEY, STAGING_SERVICE_ROLE_KEY
// The staging project must have the repo migrations applied and the Edge Functions deployed,
// with the seed users created by this script (passwords are random per run).
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "galdnzngimxthzzjqkjc";
const URL = process.env.STAGING_SUPABASE_URL, ANON = process.env.STAGING_ANON_KEY, SERVICE = process.env.STAGING_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) { console.error("Missing STAGING_* environment variables"); process.exit(2); }
if (URL.includes(PRODUCTION_REF)) { console.error("Refusing to run: this is the PRODUCTION project"); process.exit(3); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const pw = () => `T!${crypto.randomUUID()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const record = (id, title, expected, actual, pass) => { results.push({ id, title, expected, actual, result: pass ? "PASS" : "FAIL" }); };

async function user(email) {
  const password = pw();
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) await admin.auth.admin.updateUserById(existing.id, { password });
  else await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client: c, id: data.user.id, token: data.session.access_token };
}

const enc = (s) => new TextEncoder().encode(s);
const PDF = enc("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n");
async function upload(u, caseId, docType, bytes, name) {
  const form = new FormData();
  form.append("case_id", caseId); form.append("doc_type", docType);
  form.append("file", new Blob([bytes]), name);
  const r = await fetch(`${URL}/functions/v1/upload-document`, { method: "POST", headers: { Authorization: `Bearer ${u.token}`, apikey: ANON }, body: form });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

const A = await user("customer.a@staging.invalid");
const B = await user("customer.b@staging.invalid");
const mkCase = async (u) => (await admin.from("cases").insert({ user_id: u.id, case_type: "new", intake_data: { personal: { borrower1: { firstName: "Test", idNumber: "000000018" } } } }).select("id").single()).data.id;
const caseA = await mkCase(A), caseB = await mkCase(B);

// 11-14 end-to-end through the deployed function
const ok = await upload(A, caseA, "payslips", PDF, "payslip.pdf");
record("U0", "Valid PDF upload", "200 + generated object name", `${ok.status} ${ok.body?.document?.file_path ?? ""}`, ok.status === 200 && /\/payslips\/[0-9a-f-]{36}\.pdf$/.test(ok.body?.document?.file_path ?? ""));
for (const [id, t, bytes, name] of [
  ["11", "HTML disguised as PDF", enc("<html><script>alert(1)</script></html>"), "x.pdf"],
  ["12", "SVG disguised as PDF", enc('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), "x.pdf"],
  ["13", "Oversized upload (11 MB)", new Uint8Array(11 * 1024 * 1024), "big.pdf"],
  ["14", "Malformed PDF", enc("%PDF-1.7\n1 0 obj"), "bad.pdf"],
]) { const r = await upload(A, caseA, "payslips", bytes, name); record(id, t, "rejected (413/415)", `${r.status} ${r.body?.reason ?? r.body?.error ?? ""}`, r.status === 413 || r.status === 415); }
const cross = await upload(A, caseB, "payslips", PDF, "x.pdf");
record("U1", "Upload into another customer's case", "404", String(cross.status), cross.status === 404);

// 7 + 8: signed URL expiry and logout
const path = ok.body?.document?.file_path;
const { data: s1 } = await A.client.storage.from("case-documents").createSignedUrl(path, 2);
await sleep(4000);
const expired = await fetch(s1.signedUrl);
record("7", "Signed URL after expiry", "4xx", String(expired.status), expired.status >= 400);
const { data: s2 } = await A.client.storage.from("case-documents").createSignedUrl(path, 300);
await A.client.auth.signOut();
const afterLogout = await fetch(s2.signedUrl);
record("8", "Signed URL after logout (documented behavior)", "still 200 until it expires (not revoked by logout)", String(afterLogout.status), afterLogout.status === 200);

// 2 + 16 + 17 via deployed functions
const A2 = await user("customer.a@staging.invalid");
const bDoc = (await admin.from("case_documents").insert({ case_id: caseB, doc_type: "payslips", file_name: "b.pdf", file_path: `${B.id}/${caseB}/payslips/x.pdf` }).select("id").single()).data.id;
const call = async (fn, body, token) => (await fetch(`${URL}/functions/v1/${fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })).status;
const noSession = await Promise.all(["analyze-document", "generate-financial-score", "upload-document", "admin-delete-case", "case-email"].map((f) => call(f, {}, ANON)));
record("16", "Edge Functions with only the public anon key", "401/403 for every authenticated function", noSession.join(","), noSession.every((s) => s === 401 || s === 403));
record("17a", "analyze-document with another customer's document_id", "404", String(await call("analyze-document", { document_id: bDoc }, A2.token)), (await call("analyze-document", { document_id: bDoc }, A2.token)) === 404);
record("17b", "generate-financial-score with another customer's case_id", "403", String(await call("generate-financial-score", { case_id: caseB }, A2.token)), (await call("generate-financial-score", { case_id: caseB }, A2.token)) === 403);
record("17c", "admin-delete-case as a customer", "403", String(await call("admin-delete-case", { case_id: caseB }, A2.token)), (await call("admin-delete-case", { case_id: caseB }, A2.token)) === 403);
record("17d", "Disabled generate-submission-doc", "410", String(await call("generate-submission-doc", { case_id: caseB, bank_name: "x" }, A2.token)), (await call("generate-submission-doc", { case_id: caseB, bank_name: "x" }, A2.token)) === 410);

for (const id of ["18", "19", "20"]) record(id, "Borrower-2 invitation scenario", "n/a", "NOT RUN: invitations are part of Bank Ready Phase B (not implemented yet)", false);
for (const r of results) console.log(`${r.result}  [${r.id}] ${r.title}\n        expected: ${r.expected}\n        actual:   ${r.actual}`);
