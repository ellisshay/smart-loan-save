import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cleanPath, track } from "@/lib/analytics";

/** page_view on every route change, plus route-derived funnel steps. No query strings are sent. */
export default function RouteTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const path = cleanPath(pathname);
    track("page_view", { path });
    if (path === "/dashboard/payment") {
      track("payment_screen_reached");
      const paid = new URLSearchParams(search).get("paid");
      if (paid === "1" || paid === "0") track("payment_return", { status: paid === "1" ? "success_redirect" : "fail_redirect" });
    }
  }, [pathname, search]);
  return null;
}
