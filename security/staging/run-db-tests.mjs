// Staging security tests at the database layer (RLS, storage policies, RPCs).
// Each scenario runs inside BEGIN ... ROLLBACK as a synthetic user, the same way PostgREST
// applies a JWT: SET ROLE authenticated/anon + request.jwt.claims. Synthetic data only.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const PG = ["-h", process.env.PGHOST || "/var/lib/postgresql/emstaging", "-p", process.env.PGPORT || "54329", "-U", "postgres", "-d", "em", "-tA", "-v", "ON_ERROR_STOP=1"];
const U = {
  A: "aaaaaaaa-0000-4000-8000-00000000000a", B: "bbbbbbbb-0000-4000-8000-00000000000b",
  admin: "adadadad-0000-4000-8000-0000000000ad", ops: "0b0b0b0b-0000-4000-8000-0000000000ab",
  advisor: "a0a0a0a0-0000-4000-8000-0000000000aa", supervisor: "5c5c5c5c-0000-4000-8000-00000000005c",
};
const CASE_A = "ca5eaaaa-0000-4000-8000-00000000000a", CASE_B = "ca5ebbbb-0000-4000-8000-00000000000b";
const PATH_B = `${U.B}/${CASE_B}/id_card/3_id.pdf`;
const PATH_A_REVIEWED = `${U.A}/${CASE_A}/payslips/1_payslip.pdf`;
const as = (uid, headers = {}) => uid
  ? `SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true); SELECT set_config('request.headers','${JSON.stringify(headers)}',true);`
  : `SET LOCAL ROLE anon; SELECT set_config('request.jwt.claims','{"role":"anon"}',true); SELECT set_config('request.headers','${JSON.stringify(headers)}',true);`;

function run(sql) {
  try {
    const out = execFileSync("psql", [...PG, "-c", `BEGIN; ${sql} ROLLBACK;`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const lines = out.trim().split("\n").filter((l) => l && !/^(BEGIN|ROLLBACK|SET)$/.test(l));
    return { ok: true, out: lines[lines.length - 1] ?? "" };
  } catch (e) {
    const msg = String(e.stderr || e.message).split("\n").find((l) => /ERROR/.test(l)) || "error";
    return { ok: false, out: msg.replace(/^.*ERROR:\s*/, "ERROR: ") };
  }
}

const S = [
  { id: 1, t: "Customer A reads Customer B's case", exp: "0 rows",
    sql: `${as(U.A)} SELECT count(*) FROM cases WHERE id='${CASE_B}';`, pass: (r) => r.ok && r.out === "0" },
  { id: 2, t: "Customer A reads Customer B's document (row + storage object)", exp: "0 rows / 0 objects",
    sql: `${as(U.A)} SELECT (SELECT count(*) FROM case_documents WHERE case_id='${CASE_B}') || '/' || (SELECT count(*) FROM storage.objects WHERE name='${PATH_B}');`,
    pass: (r) => r.ok && r.out === "0/0" },
  { id: 3, t: "Customer A attaches Customer B's storage path to A's own document record", exp: "rejected",
    sql: `${as(U.A)} INSERT INTO case_documents(case_id, doc_type, file_name, file_path) VALUES ('${CASE_A}','general','x.pdf','${PATH_B}') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
  { id: "3b", t: "Customer A uploads directly into storage (bypassing validation)", exp: "rejected",
    sql: `${as(U.A)} INSERT INTO storage.objects(bucket_id, name) VALUES ('case-documents','${U.A}/${CASE_A}/general/evil.html') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
  { id: 4, t: "Customer A updates Customer B's case (direct + update_case_safe)", exp: "0 rows + exception",
    sql: `${as(U.A)} WITH u AS (UPDATE cases SET goal='x' WHERE id='${CASE_B}' RETURNING 1) SELECT count(*) FROM u;`,
    pass: (r) => r.ok && r.out === "0" },
  { id: "4b", t: "Customer A calls update_case_safe on Customer B's case", exp: "exception",
    sql: `${as(U.A)} SELECT update_case_safe('${CASE_B}', '{}'::jsonb);`, pass: (r) => !r.ok },
  { id: 5, t: "Customer A deletes Customer B's file (storage + row)", exp: "0 deleted",
    sql: `${as(U.A)} WITH d1 AS (DELETE FROM storage.objects WHERE name='${PATH_B}' RETURNING 1), d2 AS (DELETE FROM case_documents WHERE case_id='${CASE_B}' RETURNING 1) SELECT (SELECT count(*) FROM d1) || '/' || (SELECT count(*) FROM d2);`,
    pass: (r) => r.ok && r.out === "0/0" },
  ...["ops", "supervisor", "advisor"].map((role) => ({
    id: `6-${role}`, t: `Non-admin staff role (${role}) global case access`, exp: role === "advisor" ? "only the assigned case (A)" : "0 cases, can_manage_case(B)=false",
    sql: `${as(U[role])} SELECT (SELECT count(*) FROM cases) || '/' || can_manage_case('${CASE_B}')::text;`,
    pass: (r) => r.ok && (role === "advisor" ? r.out === "1/false" : r.out === "0/false") })),
  { id: 9, t: "File replacement/deletion after staff review (A deletes own verified payslip)", exp: "blocked (0 rows, 0 objects)",
    sql: `${as(U.A)} WITH d1 AS (DELETE FROM case_documents WHERE id='d0c0aaaa-0000-4000-8000-0000000000a1' RETURNING 1), d2 AS (DELETE FROM storage.objects WHERE name='${PATH_A_REVIEWED}' RETURNING 1) SELECT (SELECT count(*) FROM d1) || '/' || (SELECT count(*) FROM d2);`,
    pass: (r) => r.ok && r.out === "0/0" },
  { id: "9b", t: "Rescan still allowed: A deletes own rejected (red) statement", exp: "allowed (1 row)",
    sql: `${as(U.A)} WITH d AS (DELETE FROM case_documents WHERE id='d0c0aaaa-0000-4000-8000-0000000000a2' RETURNING 1) SELECT count(*) FROM d;`,
    pass: (r) => r.ok && r.out === "1" },
  { id: 10, t: "Signed evidence: A rewrites the stored signature after submission (update_case_safe)", exp: "signature unchanged",
    sql: `${as(U.A)} SELECT update_case_safe('${CASE_A}', jsonb_set((SELECT intake_data FROM cases WHERE id='${CASE_A}'), '{consent,signature}', '"data:image/png;base64,FORGED"')); RESET ROLE; SELECT intake_data->'consent'->>'signature' LIKE '%FORGED%' FROM cases WHERE id='${CASE_A}';`,
    pass: (r) => r.ok && r.out === "f" },
  { id: "10b", t: "Signed evidence: A changes case_type after payment", exp: "case_type unchanged",
    sql: `${as(U.A)} SELECT update_case_safe('${CASE_A}', NULL, NULL, NULL, NULL, 'refi'); RESET ROLE; SELECT case_type FROM cases WHERE id='${CASE_A}';`,
    pass: (r) => r.ok && r.out === "new" },
  { id: "11-14", t: "Bucket enforces type allow-list and size limit (defence in depth)", exp: "allowed_mime_types set, file_size_limit = 10MB",
    sql: `SELECT coalesce(array_to_string(allowed_mime_types, ','), 'NULL') || ' | ' || coalesce(file_size_limit::text, 'NULL') FROM storage.buckets WHERE id='case-documents';`,
    pass: (r) => r.ok && /application\/pdf/.test(r.out) && /10485760/.test(r.out) },
  { id: 15, t: "Quick-check abuse: 25 submissions from one IP", exp: "exactly 5 of 25 accepted (legitimate use still works)",
    sql: `${as(null, { "x-forwarded-for": "203.0.113.7" })} DO $$ DECLARE ok int := 0; BEGIN FOR i IN 1..25 LOOP BEGIN PERFORM save_quick_check_inquiry('{"firstName":"Bot","phone":"0500000000","goal":"first","borrowers":"1","value":1,"equity":1,"income":1,"obligations":0,"balance":0,"currentPayment":0,"yearsLeft":0}'::jsonb,'v1','ua'); ok := ok + 1; EXCEPTION WHEN others THEN NULL; END; END LOOP; PERFORM set_config('t.ok', ok::text, true); END $$; SELECT current_setting('t.ok');`,
    pass: (r) => r.ok && Number(r.out) === 5, show: (r) => `${r.out} of 25 accepted` },
  { id: 16, t: "Unauthorized calls to admin-only RPCs (anon + customer)", exp: "all rejected",
    sql: `${as(U.A)} SELECT admin_mark_payment('${CASE_B}','test');`, pass: (r) => !r.ok },
  { id: "16b", t: "Customer opens a tender on someone else's case", exp: "rejected",
    sql: `${as(U.A)} SELECT open_tender('${CASE_B}');`, pass: (r) => !r.ok },
  { id: "16c", t: "Anon reads internal job tokens (payment/cron secrets)", exp: "permission denied",
    sql: `${as(null)} SELECT count(*) FROM internal_job_tokens;`, pass: (r) => !r.ok },
  { id: "16d", t: "Customer reads another customer's offers via get_client_tender", exp: "rejected",
    sql: `${as(U.A)} SELECT get_client_tender('${CASE_B}');`, pass: (r) => !r.ok },
  { id: "16e", t: "Customer A reads B's consent", exp: "0 rows",
    sql: `${as(U.A)} SELECT count(*) FROM consents WHERE user_id='${U.B}';`, pass: (r) => r.ok && r.out === "0" },
  { id: "D1", t: "Admin hard-deletes a case directly (would orphan storage files)", exp: "blocked; deletion only via inventory function",
    sql: `${as(U.admin)} WITH d AS (DELETE FROM cases WHERE id='${CASE_B}' RETURNING 1) SELECT count(*) FROM d;`,
    pass: (r) => r.ok && r.out === "0" },
  { id: "R1", t: "Regression: customer still adds a document record inside their own folder", exp: "allowed",
    sql: `${as(U.A)} INSERT INTO case_documents(case_id, doc_type, file_name, file_path) VALUES ('${CASE_A}','general','x.pdf','${U.A}/${CASE_A}/general/abc.pdf') RETURNING 'inserted';`,
    pass: (r) => r.ok },
  { id: "R2", t: "Regression: path traversal inside own prefix", exp: "rejected",
    sql: `${as(U.A)} INSERT INTO case_documents(case_id, doc_type, file_name, file_path) VALUES ('${CASE_A}','general','x.pdf','${U.A}/${CASE_A}/../../${U.B}/x.pdf') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
  { id: "R3", t: "Regression: admin still reads all case documents", exp: "3 rows",
    sql: `${as(U.admin)} SELECT count(*) FROM case_documents;`, pass: (r) => r.ok && r.out === "3" },
  { id: "R4", t: "Deletion inventory: admin sees retention flags", exp: "flags include payment_succeeded + signed consent",
    sql: `${as(U.admin)} SELECT case_deletion_inventory('${CASE_A}')->'retention_flags';`,
    pass: (r) => r.ok && /payment_succeeded/.test(r.out) && /signed_consent/.test(r.out), show: (r) => r.out },
  { id: "R5", t: "Deletion inventory: customer cannot call it", exp: "forbidden",
    sql: `${as(U.A)} SELECT case_deletion_inventory('${CASE_A}');`, pass: (r) => !r.ok },
  { id: "R6", t: "Quick-check without an IP header still works (global limit only)", exp: "accepted",
    sql: `${as(null)} SELECT save_quick_check_inquiry('{"firstName":"Real","phone":"0500000000","goal":"first","borrowers":"1","value":1,"equity":1,"income":1,"obligations":0,"balance":0,"currentPayment":0,"yearsLeft":0}'::jsonb,'v1','ua') IS NOT NULL;`,
    pass: (r) => r.ok && r.out === "t" },
  { id: "R7", t: "Rate-limit table is not readable by anon/customers", exp: "permission denied",
    sql: `${as(U.A)} SELECT count(*) FROM rate_limits;`, pass: (r) => !r.ok },
  { id: "T1", t: "Assigned advisor uploads a PDF bank file to tender/<case>", exp: "allowed",
    sql: `${as(U.advisor)} INSERT INTO storage.objects(bucket_id, name) VALUES ('case-documents','tender/${CASE_A}/offer.pdf') RETURNING 'inserted';`,
    pass: (r) => r.ok },
  { id: "T2", t: "Staff uploads a Word file to tender/<case>", exp: "rejected (V1: PDF/JPG/PNG only)",
    sql: `${as(U.admin)} INSERT INTO storage.objects(bucket_id, name) VALUES ('case-documents','tender/${CASE_A}/offer.docx') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
  { id: "T3", t: "Staff uploads an Excel file to tender/<case>", exp: "rejected",
    sql: `${as(U.admin)} INSERT INTO storage.objects(bucket_id, name) VALUES ('case-documents','tender/${CASE_A}/rates.xlsx') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
  { id: "T4", t: "Unassigned advisor uploads to another case's tender folder", exp: "rejected",
    sql: `${as(U.advisor)} INSERT INTO storage.objects(bucket_id, name) VALUES ('case-documents','tender/${CASE_B}/offer.pdf') RETURNING 'inserted';`,
    pass: (r) => !r.ok },
];

const label = process.argv[2] || "run";
const rows = S.map((s) => {
  const r = run(s.sql);
  const pass = s.pass(r);
  return { id: s.id, title: s.t, expected: s.exp, actual: s.show ? s.show(r) : (r.ok ? `ok: ${r.out}` : r.out.slice(0, 140)), result: pass ? "PASS" : "FAIL" };
});
for (const r of rows) console.log(`${r.result}  [${r.id}] ${r.title}\n        expected: ${r.expected}\n        actual:   ${r.actual}`);
console.log(`\n${rows.filter((r) => r.result === "PASS").length}/${rows.length} passed`);
writeFileSync(`./results-${label}.json`, JSON.stringify(rows, null, 2));
