import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { Crumb } from "@/seo/config";

/** Visual breadcrumb trail; the matching BreadcrumbList JSON-LD is emitted by <Seo>. */
export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;
  return (
    <nav aria-label="נתיב ניווט" className="container pt-3 pb-1" dir="rtl">
      <ol className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft size={12} aria-hidden="true" />}
            {i < crumbs.length - 1 ? (
              <Link to={c.path} className="hover:text-foreground transition-colors">{c.name}</Link>
            ) : (
              <span aria-current="page" className="text-foreground/80">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
