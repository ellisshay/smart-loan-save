import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HIDDEN = ["/dashboard", "/intake", "/auth", "/admin", "/advisor", "/my-cases"];
const DISMISS_KEY = "em_resume_dismissed";

/**
 * Returning customers with an open case see where they stopped and a direct link to the next step
 * (the dashboard shows the exact next action). Read-only; shown only to signed-in users.
 */
export default function ResumeBanner() {
  const { pathname } = useLocation();
  const [state, setState] = useState<{ id: string; incomplete: boolean } | null>(null);
  const hidden = HIDDEN.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hidden || sessionStorage.getItem(DISMISS_KEY)) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || !alive) return;
      const { data } = await supabase.from("cases").select("id, status, intake_complete")
        .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!alive || !data || ["ClosedWon", "ClosedLost"].includes(String(data.status))) return;
      setState({ id: data.id, incomplete: !data.intake_complete });
    });
    return () => { alive = false; };
  }, [hidden]);

  if (hidden || !state) return null;
  return (
    <div className="bg-navy text-white" role="region" aria-label="המשך התיק">
      <div className="container flex items-center gap-3 py-2.5 text-sm">
        <p className="flex-1 min-w-0">
          {state.incomplete ? "יש לכם תיק שעדיין לא הושלם. כל מה שמילאתם נשמר." : "התיק שלכם בתהליך. באזור האישי מופיע השלב הבא."}
        </p>
        <Link to={`/dashboard?caseId=${state.id}`} className="shrink-0 font-semibold underline underline-offset-4">
          {state.incomplete ? "להמשך השלמת התיק" : "לאזור האישי"}
        </Link>
        <button type="button" aria-label="סגירה" className="shrink-0 p-1" onClick={() => { sessionStorage.setItem(DISMISS_KEY, "1"); setState(null); }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
