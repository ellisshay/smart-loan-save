import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendEmail, wrap, esc, ADMIN_EMAIL } from "../_shared/gmail.ts";

const Body = z.object({ token: z.string().uuid() });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const GOAL: Record<string, string> = { first: "דירה ראשונה", upgrade: "שיפור דיור", refi: "מחזור" };
const nis = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n).toLocaleString("he-IL")} ₪` : "-";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: session } = await db.from("quiz_sessions").select("id, quiz_data").eq("session_token", parsed.data.token).maybeSingle();
  const { data: consent } = await db.from("consents").select("id").eq("session_token", parsed.data.token).eq("consent_type", "quick_check").limit(1);
  if (!session || !consent?.length) return json({ error: "unknown session" }, 403);

  const quiz = (session.quiz_data && typeof session.quiz_data === "object" ? session.quiz_data : {}) as Record<string, unknown>;
  if (quiz.team_notified_at) return json({ ok: true, skipped: true });
  const answers = (quiz.quick_check && typeof quiz.quick_check === "object" ? quiz.quick_check : {}) as Record<string, unknown>;
  const goal = GOAL[String(answers.goal || "")] || String(answers.goal || "-");
  const rows = [
    `שם: ${esc(answers.firstName)}`,
    `טלפון: ${esc(answers.phone)}`,
    `מטרה: ${esc(goal)}`,
    answers.goal === "refi"
      ? `יתרה: ${nis(answers.balance)} · החזר נוכחי: ${nis(answers.currentPayment)} · שנים שנותרו: ${esc(answers.yearsLeft)}`
      : `שווי: ${nis(answers.value)} · הון עצמי: ${nis(answers.equity)} · עיר: ${esc(answers.city || "-")}`,
    `הכנסה: ${nis(answers.income)} · התחייבויות: ${nis(answers.obligations)} · לווים: ${esc(answers.borrowers || "-")}`,
  ].join("<br>");

  try {
    await sendEmail(ADMIN_EMAIL, `בדיקה מהירה חדשה – ${String(answers.firstName || "").slice(0, 80)}`, wrap("פנייה חדשה מהבדיקה המהירה", rows));
  } catch (e) {
    console.error("notify-quick-inquiry mail failed", e);
    return json({ error: "send failed" }, 502);
  }
  await db.from("quiz_sessions").update({ quiz_data: { ...quiz, team_notified_at: new Date().toISOString() } }).eq("id", session.id);
  return json({ ok: true });
});
