import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendEmail, wrap, SITE_URL } from "../_shared/gmail.ts";
import { clientEmail, progressOf, borrowers } from "../_shared/caseInfo.ts";

// Runs on a schedule: one reminder per case, 48h after last activity, if still incomplete.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: cases, error } = await admin.from("cases")
    .select("id, user_id, case_number, intake_data, emails_sent")
    .eq("intake_complete", false).lt("updated_at", cutoff).limit(50);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  let count = 0;
  for (const c of cases || []) {
    const sent = (c.emails_sent || {}) as Record<string, any>;
    if (sent.reminder_48h) continue;
    const { data: profile } = await admin.from("profiles").select("*").eq("user_id", c.user_id).maybeSingle();
    const to = clientEmail(c.intake_data, profile);
    if (!to) continue;
    try {
      const name = borrowers(c.intake_data, profile)[0]?.firstName || "";
      await sendEmail(to, "תזכורת: התיק שלך מחכה להשלמה", wrap(`שלום ${name}, עוד לא סיימת`, `<p>התיק שלך הושלם ב-<b>${progressOf(c.intake_data)}%</b>. כל מה שמילאת שמור, ואפשר להמשיך בדיוק מאותה נקודה.</p>`, "להמשך השלמת התיק", `${SITE_URL}/dashboard`));
      sent.reminder_48h = new Date().toISOString();
      await admin.from("cases").update({ emails_sent: sent }).eq("id", c.id);
      count++;
    } catch (e) { console.error("reminder failed", c.id, e); }
  }
  return new Response(JSON.stringify({ ok: true, sent: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
