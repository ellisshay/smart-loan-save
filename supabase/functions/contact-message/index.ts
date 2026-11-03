import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { sendEmail, wrap, esc, ADMIN_EMAIL } from "../_shared/gmail.ts";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(9).max(20),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(2).max(4000),
});
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "נא למלא שם, טלפון, אימייל והודעה" }, 400);
  const d = parsed.data;
  const rows = `שם: ${esc(d.name)}<br>טלפון: ${esc(d.phone)}<br>אימייל: ${esc(d.email)}<br><br>${esc(d.message).replace(/\n/g, "<br>")}`;
  try {
    await sendEmail(ADMIN_EMAIL, `פנייה מהאתר – ${d.name}`, wrap("פנייה חדשה מטופס צור קשר", rows), d.email);
  } catch (e) {
    console.error("contact-message mail failed", e);
    return json({ error: "שליחת ההודעה נכשלה" }, 502);
  }
  return json({ ok: true });
});
