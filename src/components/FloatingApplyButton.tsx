import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const HIDDEN = ["/intake", "/auth", "/dashboard", "/admin", "/advisor"];

// Routes where the free mortgage check is the more relevant primary action
const CHECK_FIRST = ["/calculators", "/savings", "/refinance", "/mix", "/affordability", "/waste"];

export default function FloatingApplyButton() {
  const { pathname } = useLocation();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;

  const showCheck = CHECK_FIRST.some((p) => pathname.startsWith(p));

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,26rem)] flex justify-center">
      {showCheck ? (
        <Link
          to="/mortgage-check"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-navy text-primary-foreground font-display font-bold text-sm md:text-base shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
        >
          בדיקת המשכנתא שלי
          <span className="rounded-full bg-success text-success-foreground text-xs px-2 py-0.5">חינם</span>
        </Link>
      ) : (
        <Link
          to="/intake"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm md:text-base shadow-gold hover:scale-105 transition-transform whitespace-nowrap"
        >
          הגש בקשה עכשיו
          <ChevronLeft size={18} />
        </Link>
      )}
    </div>
  );
}
