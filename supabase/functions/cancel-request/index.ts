import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendEmail, wrap, wrapClient, esc, CONTACT_EMAIL } from "../_shared/gmail.ts";

const Body = z.object({
  full_name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(5).max(160),
  case_number: z.string().trim().max(40).optional().default(""),
  reason: z.string().trim().max(2000).optional().default(""),
});
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "נא למלא שם מלא וטלפון או מייל" }, 400);
  const d = parsed.data;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await db.from("cancellation_requests")
    .insert({ full_name: d.full_name, contact: d.contact, case_number: d.case_number || null, reason: d.reason || null })
    .select("id, created_at").single();
  if (error) return json({ error: "שמירת הבקשה נכשלה" }, 500);

  const rows = `שם: ${esc(d.full_name)}<br>פרטי קשר: ${esc(d.contact)}<br>מספר תיק: ${esc(d.case_number || "-")}<br>סיבה: ${esc(d.reason || "-")}`;
  const mail: { admin: boolean; client: boolean | null } = { admin: false, client: null };
  try { await sendEmail(CONTACT_EMAIL, `בקשת ביטול עסקה – ${d.full_name}`, wrap("בקשת ביטול עסקה חדשה", rows)); mail.admin = true; }
  catch (e) { console.error("admin mail failed", e); }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact)) {
    try {
      await sendEmail(d.contact, "קיבלנו את בקשת הביטול שלך – EasyMorte",
        wrapClient("קיבלנו את בקשת הביטול", `שלום ${esc(d.full_name)},<br>בקשת הביטול התקבלה ב-${new Date(data.created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}. נחזור אליך בהקדם.<br><br>${rows}`));
      mail.client = true;
    } catch (e) { console.error("client mail failed", e); mail.client = false; }
  }
  return json({ ok: true, id: data.id, created_at: data.created_at, mail });
});
