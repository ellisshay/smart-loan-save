import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import HomeFloatingActions from "@/components/home/HomeFloatingActions";

// /balance-check has its own in-page next step; a floating button there covered the result and led to another flow (#52).
const HIDDEN = ["/mortgage-check", "/balance-check", "/intake", "/auth", "/dashboard", "/admin", "/advisor"];

// Routes where the free mortgage check is the more relevant primary action
const CHECK_FIRST = ["/calculators", "/savings", "/mix", "/affordability", "/waste"];

// Routes about an existing mortgage, where the next free step is the balance check
export const REFINANCE = ["/mortgage-refinance", "/refinance", "/knowledge/refinance", "/knowledge/is-refinance-worth-it"];

export default function FloatingApplyButton({ blocked = false }: { blocked?: boolean }) {
  const { pathname } = useLocation();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  if (pathname === "/") return <HomeFloatingActions blocked={blocked} />;

  const showCheck = CHECK_FIRST.some((p) => pathname.startsWith(p));
  // Refinance pages: the matching free step is the check of the existing mortgage, not a new-mortgage check.
  const refinance = REFINANCE.some((p) => pathname.startsWith(p));

  if (refinance) {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,26rem)] flex justify-center">
        <Link
          to="/balance-check"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-navy text-primary-foreground font-display font-bold text-sm md:text-base shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
        >
          בדיקת המשכנתא הקיימת
          <span className="rounded-full bg-success text-success-foreground text-xs px-2 py-0.5">חינם</span>
        </Link>
      </div>
    );
  }

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
          to="/mortgage-check"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm md:text-base shadow-gold hover:scale-105 transition-transform whitespace-nowrap"
        >
          הגש בקשה עכשיו
          <ChevronLeft size={18} />
        </Link>
      )}
    </div>
  );
}
