import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { landingContent } from "@/seo/landingContent";
import { FaqList, RelatedLinks } from "@/components/seo/SeoBlocks";
import { BadgeCheck, Landmark, Clock } from "lucide-react";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";

/** When this page's content was last reviewed by EasyMorte (E-E-A-T: responsible entity + date). */
const CONTENT_REVIEWED = "נובמבר 2026";

const REFI_PATHS = ["/mortgage-refinance"];

/** Who the page is for (one sentence per page). */
const WHO: Record<string, string> = {
  "/first-mortgage": "רוכשי דירה ראשונה שרוצים להבין כמה אפשר לקחת ולהגיע לבנקים עם תיק מסודר.",
  "/mortgage": "מי שקונה דירה, ראשונה, משפרי דיור או להשקעה, ורוצה תהליך מסודר עד ההשוואה בין ההצעות.",
  "/mortgage-refinance": "מי שכבר יש לו משכנתא ורוצה לבדוק אם אפשר להוזיל אותה או לשנות את מבנה המסלולים.",
  "/mortgage-advisor": "מי שמחפש ליווי במשכנתא במחיר קבוע, ולא באחוזים מגובה ההלוואה.",
  "/mortgage-tender": "מי שרוצה שהתיק יוגש לכמה בנקים במקביל ושההצעות יושוו לפי אותם נתונים.",
};

/** What we check: matches what the intake collects and the analysis uses. */
const CHECKS_NEW = ["כושר החזר ויחס ההחזר להכנסה", "אחוז מימון והון עצמי", "התחייבויות קיימות", "מבנה מסלולים ותמהילים אפשריים"];
const CHECKS_REFI = ["המסלולים, הריביות והיתרות שלכם", "עמלות פירעון מוקדם", "תמהיל חלופי והעלות הכוללת המשוערת", "כושר החזר ויחס ההחזר להכנסה"];

/** Verified facts only: fixed price, up to 3 relevant banks, our 72h window after a complete file + payment. */
const FACTS = [
  { icon: BadgeCheck, text: "מחיר קבוע 3,450 ₪" },
  { icon: Landmark, text: "פנייה לעד 3 בנקים רלוונטיים" },
  { icon: Clock, text: "טיפול מקצועי בתוך עד 72 שעות מתיק מלא ותשלום" },
];

/** Secondary CTA that fits each page. The primary CTA is always "פתיחת תיק". */
const SECONDARY: Record<string, { label: string; href: string }> = {
  "/mortgage-refinance": { label: "העלו דוח יתרות לבדיקה", href: "/balance-check" },
  "/first-mortgage": { label: "כמה משכנתא אפשר לקחת?", href: "/calculators/affordability" },
  "/mortgage": { label: "כמה משכנתא אפשר לקחת?", href: "/calculators/affordability" },
};
const DEFAULT_SECONDARY = { label: "בדיקת המשכנתא שלי בחינם", href: "/mortgage-check" };

const AFTER = [
  { h3: "פותחים תיק", text: "כ-10 דקות לפתיחת התיק והשלמת הפרטים הראשוניים, ואז מעלים מסמכים במקום אחד." },
  { h3: "אנחנו מטפלים בתיק", text: "בדיקה מקצועית ובניית תמהילים, בתוך עד 72 שעות מרגע שהתיק מלא והתשלום התקבל." },
  { h3: "פנייה לבנקים והשוואה", text: "פונים לעד 3 בנקים רלוונטיים ומציגים באזור האישי השוואה בשפה פשוטה. אישור, ריבית וזמני תשובה נקבעים על ידי הבנק." },
];

/** Public service landing page (first mortgage, refinance, tender, ...). Uses existing tokens only. */
export default function ServiceLandingPage() {
  const { pathname } = useLocation();
  const c = landingContent[pathname];
  if (!c) return null;
  const secondary = SECONDARY[pathname] ?? DEFAULT_SECONDARY;
  const refi = REFI_PATHS.includes(pathname);
  const docs = (refi ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required).map((d) => d.label);
  const checks = refi ? CHECKS_REFI : CHECKS_NEW;
  return (
    <div dir="rtl" className="pb-16">
      <section className="bg-hero border-b border-border">
        <div className="container max-w-4xl py-12 md:py-16 text-right">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">{c.h1}</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-5">{c.intro}</p>
          <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-5 mb-6" aria-label="עובדות על השירות">
            {FACTS.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm font-medium text-foreground"><f.icon size={16} className="text-primary shrink-0" aria-hidden />{f.text}</li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="cta" size="lg" className="min-h-12"><Link to="/intake">פתיחת תיק</Link></Button>
            <Button asChild variant="outline" size="lg" className="min-h-12"><Link to={secondary.href}>{secondary.label}</Link></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">אנחנו לא מקבלים עמלות מהבנקים · התהליך מול EasyMorte מתנהל אונליין</p>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-10 text-right">
        <section className="grid gap-4 md:grid-cols-3" aria-label="בקצרה">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display font-bold text-lg text-foreground mb-2">למי זה מתאים</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{WHO[pathname] ?? "לכל מי שרוצה לנהל את תהליך המשכנתא בצורה מסודרת ושקופה."}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display font-bold text-lg text-foreground mb-2">מה אנחנו בודקים</h2>
            <ul className="text-sm text-muted-foreground space-y-1">{checks.map((c) => <li key={c}>• {c}</li>)}</ul>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display font-bold text-lg text-foreground mb-2">מסמכים שייתכן שיידרשו</h2>
            <ul className="text-sm text-muted-foreground space-y-1">{docs.map((d) => <li key={d}>• {d}</li>)}</ul>
            <p className="text-xs text-muted-foreground mt-2">אפשר להעלות מהטלפון, ולסמן מסמך לשליחה במועד מאוחר יותר.</p>
          </div>
        </section>
        {c.sections.map((s) => (
          <section key={s.h2}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">{s.h2}</h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i} className="text-foreground/90 leading-[1.9] mb-4">{p}</p>
            ))}
            {s.list && (
              <ul className="space-y-2 mb-4">
                {s.list.map((li) => (
                  <li key={li} className="flex items-start gap-2 text-foreground/90">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.steps && (
              <div className="grid gap-4 md:grid-cols-2">
                {s.steps.map((st) => (
                  <div key={st.h3} className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-display font-bold text-lg text-foreground mb-2">{st.h3}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{st.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <section>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">מה קורה אחרי שפותחים תיק</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {AFTER.map((st, i) => (
              <li key={st.h3} className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground mb-1">שלב {i + 1}</p>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{st.h3}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{st.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-secondary/50 rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">מחיר קבוע: 3,450 ₪</h2>
          <p className="text-muted-foreground">משלמים פעם אחת על השירות המלא של EasyMorte. הבדיקה הראשונית והמחשבונים בחינם. אנחנו לא מקבלים עמלות מהבנקים.</p>
          <p className="text-xs text-muted-foreground mt-2">התשלום אינו הבטחה לאישור או לריבית מסוימת. <Link to="/pricing" className="text-primary underline">מה כלול במחיר</Link></p>
        </section>

        <FaqList faqs={c.faqs} />
        <RelatedLinks links={c.links} />

        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 text-center" data-testid="service-final-cta">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">10 דקות באתר. ואנחנו נכנסים לעבודה.</h2>
          <p className="text-muted-foreground mb-5">פותחים תיק, מעלים פרטים ומסמכים במקום אחד, ואנחנו מרכזים את העבודה המקצועית מול הבנקים. מחיר קבוע 3,450 ₪.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="cta" size="lg" className="min-h-12"><Link to="/intake">פתיחת תיק</Link></Button>
            <Button asChild variant="outline" size="lg" className="min-h-12"><Link to={secondary.href}>{secondary.label}</Link></Button>
          </div>
        </section>
        <p className="text-xs text-muted-foreground text-center">המידע בעמוד נכתב על ידי EasyMorte ונבדק לאחרונה ב{CONTENT_REVIEWED}. זהו מידע כללי ואינו ייעוץ מותאם אישית. אישור, ריבית ותנאים נקבעים על ידי הבנק.</p>
      </div>
    </div>
  );
}
