import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const HIDDEN = ["/intake", "/auth", "/dashboard", "/admin", "/advisor"];

export default function FloatingApplyButton() {
  const { pathname } = useLocation();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  return (
    <Link
      to="/intake"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-base shadow-gold hover:scale-105 transition-transform"
    >
      הגש בקשה עכשיו
      <ChevronLeft size={18} />
    </Link>
  );
}
