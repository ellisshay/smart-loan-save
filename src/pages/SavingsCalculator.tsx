import { useMemo, useState } from "react";
import { CalculatorShell, NumberField } from "@/components/calculators/CalculatorShell";
import { nis } from "@/components/mortgage/primitives";
import { simulate } from "@/lib/mortgage/scenarios";
import type { NormalizedTrack } from "@/lib/mortgage/tracks";
import { useMarketRates } from "@/hooks/useMarketRates";

/** "כמה אפשר לחסוך?" Three honest levers, side by side. No prices, timers or unverified stats. */
export default function SavingsCalculator() {
  const { reference } = useMarketRates();
  const [balance, setBalance] = useState<number | null>(800_000);
  const [yrs, setYrs] = useState<number | null>(20);
  const [rate, setRate] = useState<number | null>(5.2);

  const r = useMemo(() => {
    if (!balance || !yrs || rate === null) return null;
    const t: NormalizedTrack[] = [{ kind: "other", label: "", amount: balance, rate, months: Math.round(yrs * 12), linked: false, variable: false }];
    return {
      extra: simulate(t, 0, { kind: "extra", amount: 500 }),
      shorten: yrs > 6 ? simulate(t, 0, { kind: "shorten", years: 5 }) : null,
      refi: reference && reference < rate ? simulate(t, 0, { kind: "refi", rate: reference, costs: 0 }) : null,
    };
  }, [balance, yrs, rate, reference]);

  const levers = r ? [
    r.refi && { title: "מחזור לריבית השוק הממוצעת", sub: `ממוצע מסלולים לא צמודים, כ-${reference}%`, monthly: r.refi.monthlyDiff, saving: -r.refi.interestDiff, extra: "לפני עמלות פירעון ועלויות מחזור" },
    { title: "תוספת של 500 ₪ להחזר", sub: "ההחזר עולה, התקופה מתקצרת", monthly: r.extra.monthlyDiff, saving: -r.extra.interestDiff, extra: r.extra.monthsDiff < 0 ? `מסיימים כ-${Math.round(-r.extra.monthsDiff / 12 * 10) / 10} שנים מוקדם יותר` : "" },
    r.shorten && { title: "קיצור התקופה ב-5 שנים", sub: "ההחזר עולה, הריבית הכוללת יורדת", monthly: r.shorten.monthlyDiff, saving: -r.shorten.interestDiff, extra: "" },
  ].filter(Boolean) as { title: string; sub: string; monthly: number; saving: number; extra: string }[] : [];

  return (
    <CalculatorShell
      question="כמה אפשר לחסוך במשכנתא?"
      intro="שלוש דרכים נפוצות להוזיל משכנתא, וההשפעה המשוערת של כל אחת."
      inputs={<>
        <NumberField label="יתרת המשכנתא" suffix="₪" value={balance} onChange={setBalance} max={50_000_000} />
        <NumberField label="שנים שנותרו" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת היום" suffix="%" value={rate} onChange={setRate} decimals max={15} />
      </>}
      result={r ? <div className="space-y-3">
        {levers.map((l) => (
          <div key={l.title} className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0"><p className="font-semibold">{l.title}</p><p className="text-xs text-muted-foreground">{l.sub}{l.extra ? ` · ${l.extra}` : ""}</p></div>
            <div className="text-sm sm:text-left">
              <p className="text-xs text-muted-foreground">חיסכון משוער בריבית</p>
              <p className="font-display text-xl font-bold tabular-nums text-success">{nis(Math.max(0, l.saving))}</p>
              <p className="text-xs text-muted-foreground tabular-nums">החזר חודשי {l.monthly >= 0 ? "+" : "−"}{nis(Math.abs(l.monthly))}</p>
            </div>
          </div>
        ))}
        {!r.refi && <p className="text-sm text-muted-foreground">{reference ? "הריבית שהזנתם לא גבוהה מממוצע השוק הנוכחי, ולכן מחזור לא מוצג כאן כדרך לחיסכון." : "ריביות השוק לא נטענו, ולכן אפשרות המחזור לא מוצגת."}</p>}
      </div> : <p className="text-muted-foreground">הזינו יתרה, תקופה וריבית כדי לראות את התוצאה.</p>}
      explanation={<p>
        החישוב מניח ריבית ממוצעת אחת ולא כולל הצמדה למדד, עמלות פירעון או עלויות מחזור. החיסכון בפועל תלוי במסלולים, בעמלות ובתנאים שהבנק יציע.
      </p>}
      cta={{ text: "רוצים לדעת מה באמת אפשר לחסוך במשכנתא שלכם?", label: "העלו דוח יתרות לסילוק לבדיקה מדויקת יותר", href: "/balance-check", secondary: { label: "או בדיקת משכנתא מהירה", href: "/mortgage-check" } }}
    />
  );
}
