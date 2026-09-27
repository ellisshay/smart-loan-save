const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
export const ADMIN_EMAIL = "easymorte.il@gmail.com";
export const SITE_URL = "https://www.easymorte.co.il";

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
