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
  const { data: s } = await db.from("quiz_sessions").select("id, completed").eq("session_token", d.token).maybeSingle();
  const { data: c } = await db.from("consents").select("id").eq("session_token", d.token).eq("consent_type", "quick_check").limit(1);
  if (!s?.completed || !c?.length) return json({ error: "unknown session" }, 403);
  const rows = d.mixes.map((m) => `<li><strong>${esc(m.name)}</strong> (סיכון ${esc(m.risk)}): החזר חודשי ${nis(m.monthly)}, החזר כולל ${nis(m.total)}</li>`).join("");
  const body = `${d.first_name ? `שלום ${esc(d.first_name)},<br>` : ""}
${d.ltv !== null ? `אחוז מימון: ${d.ltv.toFixed(0)}%<br>` : ""}${d.dti !== null ? `יחס החזר להכנסה: ${d.dti.toFixed(0)}%<br>` : ""}
<ul>${rows}</ul><small>הערכה לפי ריביות ממוצעות שמפורסמות על ידי בנק ישראל. התנאים הסופיים נקבעים על ידי הבנק.</small>`;
  try {
    await sendEmail(d.email, "תוצאת בדיקת המשכנתא שלך – EasyMorte", wrapClient("תוצאת בדיקת המשכנתא שלך", body, "מתחילים", `${SITE_URL}/mortgage-check`));
  } catch (e) { console.error(e); return json({ error: "send failed" }, 502); }
  return json({ ok: true });
});
