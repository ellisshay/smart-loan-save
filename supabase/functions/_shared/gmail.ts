const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
export const ADMIN_EMAIL = "easymorte.il@gmail.com";
export const SITE_URL = "https://www.easymorte.co.il";
const CONTACT_PHONE = "055-996-1997";
const CONTACT_PHONE_LINK = "tel:+972559961997";
const WHATSAPP_LINK = "https://wa.me/972559961997";

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function wrap(title: string, body: string, ctaText?: string, ctaUrl?: string) {
  return `<!doctype html><html dir="rtl" lang="he"><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#0f2a44">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="font-size:22px;font-weight:bold;color:#0d9488;margin-bottom:16px">EasyMorte</div>
<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>
<div style="font-size:15px;line-height:1.7">${body}</div>
${ctaText && ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:20px;background:#0d9488;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(ctaText)}</a>` : ""}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 12px"/>
<div style="font-size:12px;color:#64748b">EasyMorte | ${ADMIN_EMAIL}</div>
</div></body></html>`;
}

/** Branded customer-facing mail; internal staff notifications keep the compact wrap above. */
export function wrapClient(title: string, body: string, ctaText?: string, ctaUrl?: string) {
  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f7f6;color:#173246;font-family:Arial,sans-serif;direction:rtl">
<div style="display:none;font-size:1px;color:#f2f7f6;max-height:0;overflow:hidden">עדכון אישי מ-EASY MORTE · לוקחים משכנתא בקלות</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f7f6"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #dceae7;border-radius:8px;overflow:hidden;text-align:right">
<tr><td style="background:#0d756f;padding:26px 30px;color:#ffffff">
<a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-size:25px;font-weight:800" dir="ltr">EASY MORTE</a>
<div style="font-size:14px;margin-top:6px;color:#e3f6f2">לוקחים משכנתא בקלות</div></td></tr>
<tr><td style="padding:28px 30px 18px">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.4;color:#173246">${esc(title)}</h1>
<div style="font-size:16px;line-height:1.8;color:#294557">${body}</div>
${ctaText && ctaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="background:#0d756f;border-radius:6px"><a href="${esc(ctaUrl)}" style="display:inline-block;padding:13px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold">${esc(ctaText)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:0 30px 24px"><div style="border-top:1px solid #dceae7;padding-top:20px;font-size:14px;line-height:1.8;color:#526b74">
<strong style="color:#173246">נתונים לפני מכירות.</strong> ב-EASY MORTE אנחנו מרכזים את פרטי המשכנתא במקום אחד כדי לעזור לך לבחון את האפשרויות בצורה ברורה ומסודרת.
</div></td></tr>
<tr><td style="background:#eef5f3;padding:22px 30px;font-size:14px;line-height:1.9;color:#294557">
<strong>יש לך שאלה? אנחנו כאן.</strong><br>
טלפון: <a href="${CONTACT_PHONE_LINK}" style="color:#0d756f;text-decoration:underline" dir="ltr">${CONTACT_PHONE}</a> &nbsp;·&nbsp; <a href="${WHATSAPP_LINK}" style="color:#0d756f;text-decoration:underline">WhatsApp</a><br>
אימייל: <a href="mailto:${ADMIN_EMAIL}" style="color:#0d756f;text-decoration:underline" dir="ltr">${ADMIN_EMAIL}</a><br>
אתר: <a href="${SITE_URL}" style="color:#0d756f;text-decoration:underline" dir="ltr">www.easymorte.co.il</a>
</td></tr></table>
<div style="max-width:600px;padding:16px 8px;font-size:12px;line-height:1.6;color:#627b80;text-align:center">הודעה זו נשלחה אליך בעקבות פעילות בתיק שלך ב-EASY MORTE.</div>
</td></tr></table></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!LOVABLE_API_KEY || !GMAIL_KEY) throw new Error("Email credentials not configured");
  const raw = [
    `From: ${header("EasyMorte")} <${ADMIN_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${header(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(html),
  ].join("\r\n");
  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GMAIL_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: b64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") }),
  });
  if (!res.ok) throw new Error(`Gmail send failed [${res.status}]: ${await res.text()}`);
  return res.json();
}
