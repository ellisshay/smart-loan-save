import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { landingContent } from "@/seo/landingContent";
import { FaqList, RelatedLinks } from "@/components/seo/SeoBlocks";

/** Public service landing page (first mortgage, refinance, tender, ...). Uses existing tokens only. */
export default function ServiceLandingPage() {
  const { pathname } = useLocation();
  const c = landingContent[pathname];
  if (!c) return null;
  return (
    <div dir="rtl" className="pb-16">
      <section className="bg-hero border-b border-border">
        <div className="container max-w-4xl py-12 md:py-16 text-right">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">{c.h1}</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">{c.intro}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/intake"><Button variant="cta" size="lg">הגש בקשה עכשיו</Button></Link>
            <Link to="/how-it-works"><Button variant="outline" size="lg">איך זה עובד</Button></Link>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl pt-10 space-y-10 text-right">
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

        <FaqList faqs={c.faqs} />
        <RelatedLinks links={c.links} />

        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">מוכנים להתחיל?</h2>
          <p className="text-muted-foreground mb-5">ממלאים שאלון קצר, מעלים מסמכים ומקבלים בדיקת תיק מקצועית במחיר קבוע של 3,450 ₪.</p>
          <Link to="/intake"><Button variant="cta" size="lg">הגש בקשה עכשיו</Button></Link>
        </section>
      </div>
    </div>
  );
}
