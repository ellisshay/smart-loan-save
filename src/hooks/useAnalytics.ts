import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackGenerateLead, trackPageView, type LeadMethod } from "@/lib/analytics";

function leadMethodFromHref(href: string): LeadMethod | null {
  const value = href.trim();
  if (/^tel:/i.test(value)) return "phone";
  if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(value)) return "whatsapp";
  return null;
}

/**
 * Sends a GA4 page_view when the React Router location changes.
 * The first view is skipped because gtag('config') already counted the load.
 * Also records generate_lead when a WhatsApp or tel: link is clicked.
 */
export function useAnalytics() {
  const location = useLocation();
  const skipInitialPageView = useRef(true);

  useEffect(() => {
    if (skipInitialPageView.current) {
      skipInitialPageView.current = false;
      return;
    }
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (typeof window.gtag !== "function") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const method = leadMethodFromHref(anchor.getAttribute("href") || anchor.href);
      if (!method) return;
      trackGenerateLead({ method });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
