import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { sendEmail, wrap, wrapClient, ADMIN_EMAIL, SITE_URL, esc } from "../_shared/gmail.ts";
import { clientCardHtml, clientEmail, STATUS_LABELS, borrowers } from "../_shared/caseInfo.ts";

const Body = z.object({
  case_id: z.string().uuid(),
  event: z.enum(["case_opened", "status_update", "intake_complete", "tender_proceed", "tender_question", "tender_update"]),
  message: z.string().max(2000).optional(),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { case_id, event, message } = parsed.data;

    const { data: c } = await admin.from("cases").select("*").eq("id", case_id).single();
    if (!c) return json({ error: "Case not found" }, 404);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (c.user_id !== user.id && !isAdmin && c.assigned_advisor_id !== user.id) return json({ error: "Forbidden" }, 403);

    const { data: profile } = await admin.from("profiles").select("*").eq("user_id", c.user_id).maybeSingle();
    const sent = (c.emails_sent || {}) as Record<string, any>;
    const to = clientEmail(c.intake_data, profile);
    const name = borrowers(c.intake_data, profile)[0]?.firstName || "";
    const results: string[] = [];
    const mark = async (k: string) => { sent[k] = new Date().toISOString(); await admin.from("cases").update({ emails_sent: sent }).eq("id", case_id); };

    if (event === "case_opened") {
      if (!sent.admin_opened) {
        await sendEmail(ADMIN_EMAIL, `תיק חדש נפתח: ${c.case_number}`, wrap("נפתח תיק חדש באתר", clientCardHtml(c, profile), "לצפייה בתיק", `${SITE_URL}/admin/cases/${c.id}`));
        await mark("admin_opened"); results.push("admin_opened");
      }
      if (to && !sent.client_opened) {
        await sendEmail(to, "התיק שלך ב-EasyMorte נפתח", wrapClient(`שלום ${name}, התיק שלך נפתח`, `<p>מספר תיק: <b>${esc(c.case_number)}</b></p><p>כל הפרטים שתזין נשמרים אוטומטית. אפשר לחזור בכל עת ולהמשיך מאותה נקודה.</p><p>לאחר השלמת הפרטים והמסמכים ותשלום, התיק ייבדק תוך עד 72 שעות.</p>`, "להמשך השלמת התיק", `${SITE_URL}/dashboard`));
        await mark("client_opened"); results.push("client_opened");
      }
    }

    if (event === "status_update" && to) {
      const key = `status_${c.status}`;
      if (!sent[key]) {
        await sendEmail(to, `עדכון סטטוס לתיק ${c.case_number}`, wrapClient(`שלום ${name}, יש עדכון בתיק שלך`, `<p>הסטטוס החדש: <b>${esc(STATUS_LABELS[c.status] || c.status)}</b></p>`, "לאזור האישי", `${SITE_URL}/dashboard/status`));
        await mark(key); results.push(key);
      }
    }

    if (event === "tender_proceed" || event === "tender_question") {
      const { data: adv } = c.assigned_advisor_id ? await admin.auth.admin.getUserById(c.assigned_advisor_id) : { data: null } as any;
      const subj = event === "tender_proceed" ? `הלקוח רוצה להתקדם עם הצעה: ${c.case_number}` : `שאלה מהלקוח על הצעה: ${c.case_number}`;
      const body = `${clientCardHtml(c, profile)}${message ? `<p><b>הודעת הלקוח:</b> ${esc(message)}</p>` : ""}`;
      const recipients = [ADMIN_EMAIL, adv?.user?.email].filter(Boolean) as string[];
      for (const r of new Set(recipients)) await sendEmail(r, subj, wrap(subj, body, "למכרז בתיק", `${SITE_URL}/admin/cases/${c.id}`));
      results.push(event);
    }

    if (event === "tender_update" && to) {
      await sendEmail(to, `עדכון במכרז המשכנתא שלך, תיק ${c.case_number}`, wrapClient(`שלום ${name}, יש עדכון במכרז הבנקים`, `<p>${esc(message || "יש עדכון חדש בתיק שלך.")}</p>`, "למכרז המשכנתא שלי", `${SITE_URL}/dashboard/tender`));
      results.push("tender_update");
    }

    if (event === "intake_complete") {
      if (to && !sent.client_complete) {
        await sendEmail(to, "הפרטים הושלמו, הדוח שלך מוכן", wrapClient(`שלום ${name}, סיימת את מילוי הפרטים`, `<p>תודה! קיבלנו את כל הפרטים. הדוח המפורט עם משכנתא מוערכת ותמהיל משוער לפי תנאי השוק של היום זמין באזור האישי.</p><p>סטטוס נוכחי: <b>${esc(STATUS_LABELS[c.status] || c.status)}</b></p>`, "לצפייה בדוח", `${SITE_URL}/results`));
        await mark("client_complete"); results.push("client_complete");
      }
      if (!sent.admin_complete) {
        await sendEmail(ADMIN_EMAIL, `תיק הושלם: ${c.case_number}`, wrap("לקוח השלים את פרטי התיק", clientCardHtml(c, profile), "לצפייה בתיק", `${SITE_URL}/admin/cases/${c.id}`));
        await mark("admin_complete");
      }
      // Anonymized data pool entry
      const i = c.intake_data || {};
      const pv = Number(i.property?.propertyValue || i.property?.property_value || 0) || null;
      const loan = Number(i.mortgage_request?.loanAmount || i.mortgage_request?.amount || 0) || null;
      await admin.from("mortgage_profiles").upsert({
        case_id: c.id, case_type: c.case_type,
        borrower_count: Number(i.personal?.borrowerCount || 1),
        income_range: String(i.income?.monthlyIncome || i.income?.monthly_income || ""),
        property_area: String(i.property?.city || i.property?.area || ""),
        property_value: pv, loan_amount: loan,
        ltv: pv && loan ? Math.round((loan / pv) * 100) : null,
        dti: c.ai_analysis?.dti ?? null, selected_mix: c.selected_mix,
      }, { onConflict: "case_id" });
    }

    return json({ ok: true, sent: results });
  } catch (e) {
    console.error("case-email error:", e);
    return json({ error: String((e as Error).message) }, 500);
  }
});
