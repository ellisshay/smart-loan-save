// Contact form: validation and result mapping. Pure TypeScript (no Deno/npm imports) so it is unit-tested by vitest.

export type ContactInput = { request_id: string; name: string; phone: string; email: string; message: string };
export type ContactCheck = { ok: true; value: ContactInput } | { ok: false; field: keyof ContactInput | "website" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Server-side validation. Mirrors the database CHECK constraints. `website` is a honeypot and must stay empty. */
export function validateContact(raw: unknown): ContactCheck {
  const b = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (str(b.website)) return { ok: false, field: "website" };
  const v: ContactInput = {
    request_id: str(b.request_id),
    name: str(b.name),
    phone: str(b.phone).replace(/[\s()-]/g, ""),
    email: str(b.email).toLowerCase(),
    message: str(b.message),
  };
  if (!UUID.test(v.request_id)) return { ok: false, field: "request_id" };
  if (v.name.length < 2 || v.name.length > 120) return { ok: false, field: "name" };
  if (!/^\+?\d{9,15}$/.test(v.phone)) return { ok: false, field: "phone" };
  if (v.email.length > 160 || !EMAIL.test(v.email)) return { ok: false, field: "email" };
  if (v.message.length < 2 || v.message.length > 4000) return { ok: false, field: "message" };
  return { ok: true, value: v };
}

/** What the page is allowed to tell the visitor. Saved and emailed are separate facts. */
export type ContactResult =
  | { saved: true; emailed: true }
  | { saved: true; emailed: false }
  | { saved: false; error: "invalid" | "rate_limited" | "server" };

export const RATE_LIMITS = { perIpPerHour: 5, globalPerHour: 100 } as const;
