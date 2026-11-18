import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendEmail, wrapClient, esc, SITE_URL } from "../_shared/gmail.ts";

const Body = z.object({
  token: z.string().uuid(),
  email: z.string().trim().email().max(160),
  first_name: z.string().trim().max(40).optional().default(""),
  ltv: z.number().min(0).max(1000).nullable(),
  dti: z.number().min(0).max(1000).nullable(),
  mixes: z.array(z.object({ name: z.string().max(40), risk: z.string().max(10), monthly: z.number().min(0).max(1e7), total: z.number().min(0).max(1e10) })).max(3),
});
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return json({ error: "invalid" }, 400);
  const d = p.data;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: s } = await db.from("quiz_sessions").select("id").eq("session_token", d.token).maybeSingle();
  const { data: c } = await db.from("consents").select("id").eq("session_token", d.token).eq("consent_type", "quick_check").limit(1);
  // A consented quick-check inquiry deliberately remains incomplete: it is not a full case.
  if (!s?.id || !c?.length) return json({ error: "unknown session" }, 403);
  const rows = d.mixes.map((m) => `<li><strong>${esc(m.name)}</strong> (סיכון ${esc(m.risk)}): החזר חודשי ${nis(m.monthly)}, החזר כולל ${nis(m.total)}</li>`).join("");
  const body = `${d.first_name ? `שלום ${esc(d.first_name)},<br>` : ""}
${d.ltv !== null ? `אחוז מימון: ${d.ltv.toFixed(0)}%<br>` : ""}${d.dti !== null ? `יחס החזר להכנסה: ${d.dti.toFixed(0)}%<br>` : ""}
<ul>${rows}</ul><small>הערכה לפי ריביות ממוצעות שמפורסמות על ידי בנק ישראל. התנאים הסופיים נקבעים על ידי הבנק.</small>`;
  // Save the request before sending, so a provider failure never loses it. Retrying the same check and
  // address updates one row. Saving is best effort: if it fails, the email is still attempted.
  const requestId = await saveRequest(db, d);
  if (requestId === "too_many") return json({ error: "too many attempts" }, 429);
  try {
    await sendEmail(d.email, "תוצאת בדיקת המשכנתא שלך – EASY MORTE", wrapClient("תוצאת בדיקת המשכנתא שלך", body, "מתחילים", `${SITE_URL}/mortgage-check`));
  } catch (e) {
    console.error("send-quick-result: provider failed", e instanceof Error ? e.name : "error");
    await markRequest(db, requestId, { status: "failed", last_error: "provider_failed" });
    return json({ error: "send failed", saved: Boolean(requestId) }, 502);
  }
  await markRequest(db, requestId, { status: "sent", last_error: null, sent_at: new Date().toISOString() });
  return json({ ok: true });
});

const MAX_ATTEMPTS = 5;

// deno-lint-ignore no-explicit-any
async function saveRequest(db: any, d: z.infer<typeof Body>): Promise<string | null | "too_many"> {
  try {
    const email = d.email.toLowerCase();
    const { data: existing } = await db.from("quick_result_requests")
      .select("id, attempts, status").eq("session_token", d.token).eq("email", email).maybeSingle();
    const payload = { first_name: d.first_name, ltv: d.ltv, dti: d.dti, mixes: d.mixes };
    if (existing?.id) {
      if (existing.status !== "sent" && existing.attempts >= MAX_ATTEMPTS) return "too_many";
      const { error } = await db.from("quick_result_requests")
        .update({ payload, status: "pending", attempts: existing.attempts + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      return error ? null : existing.id;
    }
    const { data: row, error } = await db.from("quick_result_requests")
      .insert({ session_token: d.token, email, payload, status: "pending", attempts: 1 })
      .select("id").single();
    return error || !row?.id ? null : row.id;
  } catch {
    console.error("send-quick-result: request not saved");
    return null;
  }
}

// deno-lint-ignore no-explicit-any
async function markRequest(db: any, id: string | null | "too_many", patch: Record<string, unknown>) {
  if (!id || id === "too_many") return;
  try {
    await db.from("quick_result_requests").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  } catch {
    console.error("send-quick-result: status not saved");
  }
}
