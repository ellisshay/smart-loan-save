/** GA4 helpers. The snippet in index.html creates window.gtag; calls no-op until it exists. */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export type LeadMethod = "whatsapp" | "phone";

export function trackPageView(pagePath: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Fired only after a lead or contact form succeeds, or on a WhatsApp / phone link click. */
export function trackGenerateLead(params: { form_name: string } | { method: LeadMethod }) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "generate_lead", {
    ...params,
    page_path: window.location.pathname,
  });
}
