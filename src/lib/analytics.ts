// Lightweight, provider-agnostic funnel events.
// Events go to window.dataLayer (inert until a tag manager is installed); nothing is sent anywhere else.
// PRIVACY: never pass personal or financial data. Only whitelisted event names and short,
// non-numeric, non-identifying metadata survive sanitize().

export const EVENTS = [
  "page_view",
  "calculator_start",
  "calculator_result",
  "quick_check_start",
  "quick_check_completed",
  "sign_up",
  "case_opened",
  "intake_step_completed",
  "intake_completed",
  "documents_uploaded",
  "payment_screen_reached",
  "payment_return",          // the provider redirected back; NOT a verified payment
  "offer_comparison_viewed",
] as const;
export type AnalyticsEvent = typeof EVENTS[number];

/** Only these metadata keys are ever kept. */
const ALLOWED_KEYS = ["path", "calculator", "case_type", "step", "doc_type", "status", "source"] as const;
type Meta = Partial<Record<typeof ALLOWED_KEYS[number], string>>;

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Strips query/hash and ids from a path so it can never carry a case id or personal data. */
export const cleanPath = (p: string) => p.split(/[?#]/)[0].replace(UUID, ":id").slice(0, 80);

/**
 * Keeps only allowed keys whose values are short ASCII slugs with no long digit runs
 * (blocks amounts, phone numbers, ID numbers, names in Hebrew, emails).
 */
export function sanitize(meta: Record<string, unknown> = {}): Meta {
  const out: Meta = {};
  for (const k of ALLOWED_KEYS) {
    const v = meta[k];
    if (typeof v !== "string") continue;
    const val = k === "path" ? cleanPath(v) : v;
    if (k !== "path" && !/^[a-z][a-z0-9_-]{0,39}$/.test(val)) continue;
    if (/\d{3,}/.test(val) || /@/.test(val)) continue;
    out[k] = val;
  }
  return out;
}

type DL = { dataLayer?: Record<string, unknown>[] };

export function track(event: AnalyticsEvent, meta: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !(EVENTS as readonly string[]).includes(event)) return;
  const w = window as unknown as DL;
  (w.dataLayer = w.dataLayer || []).push({ event: `em_${event}`, ...sanitize(meta) });
}

const onceKeys = new Set<string>();
/** Fires an event at most once per page load for the given key. */
export function trackOnce(key: string, event: AnalyticsEvent, meta: Record<string, unknown> = {}) {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  track(event, meta);
}
