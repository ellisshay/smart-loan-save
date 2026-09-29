import { Link } from "react-router-dom";
import type { CalculatorContent } from "@/seo/landingContent";

/** FAQ rendered with native <details> so answers exist in the prerendered HTML. */
export function FaqList({ faqs, title = "שאלות נפוצות" }: { faqs: { q: string; a: string }[]; title?: string }) {
  return (
    <section>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group bg-card border border-border rounded-xl p-4">
            <summary className="cursor-pointer list-none font-display font-bold text-foreground flex justify-between gap-3">
              <h3 className="text-base">{f.q}</h3>
              <span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function RelatedLinks({ links, title = "עמודים קשורים" }: { links: { label: string; href: string }[]; title?: string }) {
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link to={l.href} className="inline-block px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Explanatory HTML content rendered under each calculator. */
export function CalculatorSeoContent({ c }: { c: CalculatorContent }) {
  return (
    <div dir="rtl" className="container max-w-4xl py-12 space-y-10 text-right">
      <section>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">הסבר על המחשבון</h2>
        <p className="text-foreground/90 leading-[1.9]">{c.intro}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">איך משתמשים</h2>
        <ol className="space-y-2">
          {c.howTo.map((s, i) => (
            <li key={s} className="flex items-start gap-2 text-foreground/90">
              <span className="text-primary font-bold">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">דוגמה</h2>
        <p className="text-foreground/90 leading-[1.9]">{c.example}</p>
      </section>
      <FaqList faqs={c.faqs} />
      <RelatedLinks links={c.links} />
    </div>
  );
}
