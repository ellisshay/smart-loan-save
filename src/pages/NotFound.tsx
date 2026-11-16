import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { NOT_FOUND_TITLE } from "@/seo/fallbackHead";

const links = [
  { href: "/", label: "דף הבית" },
  { href: "/mortgage-calculator", label: "מחשבון משכנתא" },
  { href: "/knowledge/is-refinance-worth-it", label: "בדיקת מחזור משכנתא" },
  { href: "/knowledge", label: "מרכז הידע" },
  { href: "/contact", label: "צור קשר" },
];

/** Unknown URLs. No canonical: the hosting fallback must not keep the homepage URL. */
const NotFound = () => (
  <div className="container py-16 md:py-24 max-w-2xl text-right" dir="rtl">
    <Helmet>
      <title>{NOT_FOUND_TITLE}</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
    <p className="text-sm font-bold text-primary mb-3">404</p>
    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">העמוד לא נמצא</h1>
    <p className="text-muted-foreground leading-relaxed mb-8">
      הכתובת הזו לא קיימת באתר של EASY MORTE. אפשר לחזור לדף הבית, או להמשיך לאחד העמודים השימושיים.
    </p>
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            to={link.href}
            className="inline-block px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default NotFound;
