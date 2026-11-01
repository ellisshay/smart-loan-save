import { useMemo } from "react";
import { CATEGORY_HINT, CATEGORY_LABEL, STRESS_DELTA, compareOffers, explainDifferences, type OfferInput } from "@/lib/mortgage/offers";
import { EstimateNote, nis, pct, years } from "./primitives";

const level = (v: number) => (v >= 0.5 ? "גבוהה" : v >= 0.25 ? "בינונית" : "נמוכה");

/** Plain-language comparison of bank offers. Categories instead of a single "best" offer. */
export default function OfferComparison({ offers, cpi, selectedId }: { offers: OfferInput[]; cpi: number; selectedId?: string | null }) {
  const list = useMemo(() => compareOffers(offers, cpi), [offers, cpi]);
  const explanation = useMemo(() => explainDifferences(list), [list]);
  if (list.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="cmp-title">
      <h2 id="cmp-title" className="font-display text-lg font-bold">השוואה בין ההצעות</h2>
      {explanation && <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{explanation}</p>}

      <div className="mt-4 flex gap-3 overflow-x-auto snap-x pb-2 -mx-1 px-1 md:grid md:grid-cols-3 md:overflow-visible">
        {list.map((o) => (
          <article key={o.id} className={`snap-start shrink-0 w-[85%] sm:w-[60%] md:w-auto rounded-xl border p-4 ${o.id === selectedId ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
            <h3 className="font-display font-bold text-foreground">{o.bank}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2 min-h-6">
              {o.categories.map((c) => (
                <span key={c} title={CATEGORY_HINT[c]} className="text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">{CATEGORY_LABEL[c]}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">החזר חודשי התחלתי</p>
            <p className="font-display text-2xl font-bold tabular-nums">{nis(o.firstPayment)}</p>
            {o.maxPayment !== null
              ? <p className="text-xs text-muted-foreground">עד כ-{nis(o.maxPayment)} אם הריבית המשתנה תעלה ב-{STRESS_DELTA}%</p>
              : <p className="text-xs text-muted-foreground">ללא מסלולים בריבית משתנה</p>}

            <div className="flex h-2.5 rounded-full overflow-hidden mt-4" role="img" aria-label={o.summary.byKind.map((k) => `${k.label} ${pct(k.share)}`).join(", ")}>
              {o.summary.byKind.map((k) => <div key={k.kind} style={{ width: `${k.share * 100}%`, background: k.color }} />)}
            </div>
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {o.summary.byKind.map((k) => <li key={k.kind} className="flex justify-between"><span>{k.label}</span><span className="tabular-nums">{pct(k.share)}</span></li>)}
            </ul>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-sm">
              <dt className="text-muted-foreground">עלות כוללת משוערת</dt><dd className="font-semibold tabular-nums text-left">{nis(o.totalCost)}</dd>
              <dt className="text-muted-foreground">תקופה</dt><dd className="font-semibold text-left">{years(o.months)}</dd>
              <dt className="text-muted-foreground">חשיפה לריבית משתנה</dt><dd className="font-semibold text-left">{pct(o.summary.variableShare)}</dd>
              <dt className="text-muted-foreground">הצמדה למדד</dt><dd className="font-semibold text-left">{pct(o.summary.linkedShare)}</dd>
              <dt className="text-muted-foreground">גמישות</dt><dd className="font-semibold text-left">{level(o.flexibility)}</dd>
            </dl>
          </article>
        ))}
      </div>

      <EstimateNote>
        העלות הכוללת היא הערכה: קרן, ריבית לפי הריביות בהצעה{cpi ? `, הנחת מדד שנתי של ${cpi}% במסלולים צמודים` : ""} ועלויות נוספות אם דווחו.
        ההחזר המרבי הוא תרחיש של עליית ריבית ב-{STRESS_DELTA}% במסלולים המשתנים, לא תחזית. "גמישות" מבוססת על סוגי המסלולים, ותנאי הפירעון המדויקים נקבעים בהצעת הבנק.
      </EstimateNote>
    </section>
  );
}
