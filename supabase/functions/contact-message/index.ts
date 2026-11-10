// Contact form → saved message + email to info@easymorte.co.il.
// Order matters: validate, rate-limit, SAVE, then email. A failed email never loses the message,
// and the response says separately whether it was saved and whether the email was sent.
// The same request_id (one per form) never creates a second row or a second email.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendEmail, wrap, esc, ADMIN_EMAIL } from "../_shared/gmail.ts";
import { RATE_LIMITS, validateContact } from "../_shared/contactMessage.ts";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function ipBucket(req: Request, salt: string): Promise<string | null> {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
  if (!ip) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + salt));
  return "contact:ip:" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ saved: false, error: "invalid" }, 405);

  const check = validateContact(await req.json().catch(() => ({})));
  if (!check.ok) {
    // A filled honeypot looks like success to the bot but nothing is stored or sent.
    if (check.field === "website") return json({ saved: true, emailed: true });
    return json({ saved: false, error: "invalid", field: check.field }, 400);
  }
  const d = check.value;

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Abuse protection before any write: per IP (salted hash, never the raw IP) and global.
    const { data: saltRow } = await db.from("internal_job_tokens").select("token").eq("name", "rate_salt").maybeSingle();
    const bucket = await ipBucket(req, saltRow?.token ?? "");
    const limited = async (b: string, n: number) => {
      const { data, error } = await db.rpc("hit_rate_limit", { _bucket: b, _limit: n, _window: "1 hour" });
      return !error && data === false;
    };
    if ((bucket && (await limited(bucket, RATE_LIMITS.perIpPerHour))) || (await limited("contact:global", RATE_LIMITS.globalPerHour))) {
      return json({ saved: false, error: "rate_limited" }, 429);
    }

    // Save first. A resubmission with the same request_id reuses the existing row.
    const { error: insErr } = await db.from("contact_messages").upsert(
      { request_id: d.request_id, name: d.name, phone: d.phone, email: d.email, message: d.message },
      { onConflict: "request_id", ignoreDuplicates: true },
    );
    if (insErr) throw insErr;
    const { data: row, error: selErr } = await db.from("contact_messages")
      .select("id, email_status, email_attempts").eq("request_id", d.request_id).single();
    if (selErr || !row) throw selErr ?? new Error("not_saved");
    if (row.email_status === "sent") return json({ saved: true, emailed: true });

    // Then the email, tracked separately.
    let emailed = false;
    try {
      const body = `שם: ${esc(d.name)}<br>טלפון: <span dir="ltr">${esc(d.phone)}</span><br>אימייל: <span dir="ltr">${esc(d.email)}</span><br><br>${esc(d.message).replace(/\n/g, "<br>")}`;
      await sendEmail(ADMIN_EMAIL, `פנייה מהאתר: ${d.name}`, wrap("פנייה חדשה מטופס צור קשר", body));
      emailed = true;
    } catch (e) {
      console.error("contact-message: email failed", e instanceof Error ? e.name : "error");
    }
    await db.from("contact_messages").update({
      email_status: emailed ? "sent" : "failed",
      email_attempts: (row.email_attempts ?? 0) + 1,
      ...(emailed ? { email_sent_at: new Date().toISOString() } : {}),
    }).eq("id", row.id);
    return json({ saved: true, emailed });
  } catch (e) {
    console.error("contact-message: save failed", e instanceof Error ? e.name : "error");
    return json({ saved: false, error: "server" }, 500);
  }
});
