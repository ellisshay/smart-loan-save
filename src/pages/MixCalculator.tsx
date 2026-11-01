import { useMemo, useState } from "react";
import { CalculatorShell, NumberField } from "@/components/calculators/CalculatorShell";
import { nis, pct } from "@/components/mortgage/primitives";
import { buildMixes } from "@/lib/quickCheck";
import { fromMixTracks, projectTracks, summarizeTracks } from "@/lib/mortgage/tracks";
import { useMarketRates } from "@/hooks/useMarketRates";

/** Risk label from the composition (variable + half of CPI-linked share), never from the cost. */
const riskOf = (variable: number, linked: number) => {
  const r = variable + linked * 0.5;
  return r <= 0.35 ? { label: "יציבות גבוהה", hint: "רוב המשכנתא בריבית קבועה" } : r <= 0.55 ? { label: "איזון", hint: "שילוב של קבוע ומשתנה" } : { label: "גמישות גבוהה", hint: "חלק גדול בריבית משתנה" };
};

export default function MixCalculator() {
  const { rates, failed, cpi } = useMarketRates();
  const [loan, setLoan] = useState<number | null>(1_200_000);
  const [yrs, setYrs] = useState<number | null>(25);

  const mixes = useMemo(() => {
    if (!rates || !loan || !yrs) return [];
    return buildMixes(loan, yrs, rates).map((m) => {
      const tracks = fromMixTracks(m.tracks, cpi);
      const s = summarizeTracks(tracks, cpi)!;
      const p = projectTracks(tracks, cpi);
      return { s, total: s.total + p.totalInterest, risk: riskOf(s.variableShare, s.linkedShare) };
    }).sort((a, b) => (a.s.variableShare + a.s.linkedShare * 0.5) - (b.s.variableShare + b.s.linkedShare * 0.5));
  }, [rates, loan, yrs, cpi]);

  return (
    <CalculatorShell
      question="איך נראים תמהילי משכנתא שונים?"
      intro="שלושה תמהילים לדוגמה לפי ריביות השוק הממוצעות היום: החזר חודשי, עלות כוללת וחשיפה לריבית משתנה."
      inputs={<>
        <NumberField label="סכום המשכנתא" suffix="₪" value={loan} onChange={setLoan} max={50_000_000} />
        <NumberField label="תקופה" suffix="שנים" value={yrs} onChange={setYrs} min={4} max={30} />
      </>}
      result={!rates
        ? <p className="text-muted-foreground">{failed ? "לא הצלחנו לטעון את ריביות השוק כרגע. נסו לרענן בעוד רגע." : "טוען ריביות שוק עדכניות…"}</p>
        : mixes.length ? <div className="grid gap-3 sm:grid-cols-3">
          {mixes.map((m, i) => (
            <article key={i} className="rounded-xl border border-border p-4">
              <p className="font-display font-bold">{m.risk.label}</p>
              <p className="text-xs text-muted-foreground mb-3">{m.risk.hint}</p>
              <p className="text-xs text-muted-foreground">החזר חודשי התחלתי</p>
              <p className="font-display text-2xl font-bold tabular-nums">{nis(m.s.monthly)}</p>
              <div className="flex h-2.5 rounded-full overflow-hidden mt-3" aria-hidden>{m.s.byKind.map((k) => <div key={k.kind} style={{ width: `${k.share * 100}%`, background: k.color }} />)}</div>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">{m.s.byKind.map((k) => <li key={k.kind} className="flex justify-between"><span>{k.label}</span><span className="tabular-nums">{pct(k.share)}</span></li>)}</ul>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">עלות כוללת משוערת</dt><dd className="font-semibold tabular-nums">{nis(m.total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">בריבית משתנה</dt><dd className="font-semibold">{pct(m.s.variableShare)}</dd></div>
              </dl>
            </article>
          ))}
        </div> : <p className="text-muted-foreground">הזינו סכום ותקופה כדי לראות את התמהילים.</p>}
      explanation={rates && <p>
        תמהיל עם יותר ריבית קבועה צפוי ויציב יותר, אבל לרוב ההחזר בו גבוה יותר בהתחלה. תמהיל עם יותר ריבית משתנה זול יותר כרגע, אבל ההחזר בו עלול לעלות.
        העלות הכוללת היא הערכה לפי הריביות הנוכחיות{cpi ? ` והנחת אינפלציה של ${cpi}% בשנה במסלולים צמודים` : ""}. אלה תמהילים לדוגמה, לא הצעה של בנק.
        {rates.updated_at && ` ריביות עודכנו ב-${new Date(rates.updated_at).toLocaleDateString("he-IL")}.`}
      </p>}
      cta={{ text: "רוצים תמהילים לפי הנתונים וההעדפות שלכם?", label: "לבדיקת משכנתא חינם", href: "/mortgage-check" }}
    />
  );
}
