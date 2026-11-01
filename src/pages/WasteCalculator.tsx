import { useMemo, useState } from "react";
import { CalculatorShell, NumberField, BigResult, ResultGrid, BeforeAfter } from "@/components/calculators/CalculatorShell";
import { nis } from "@/components/mortgage/primitives";
import { pmt } from "@/lib/mortgage/amortization";
import { useMarketRates } from "@/hooks/useMarketRates";

/** "האם אני משלם יותר מדי?" Compares the current average rate to today's market reference. */
export default function WasteCalculator() {
  const { reference, failed } = useMarketRates();
  const [balance, setBalance] = useState<number | null>(800_000);
  const [yrs, setYrs] = useState<number | null>(20);
  const [rate, setRate] = useState<number | null>(5.4);
  const [payment, setPayment] = useState<number | null>(null);

  const r = useMemo(() => {
    if (!balance || !yrs || rate === null || !reference) return null;
    const months = Math.round(yrs * 12);
    const current = payment || pmt(balance, rate, months);
    const market = pmt(balance, reference, months);
    const excess = Math.max(0, current - market);
    const gap = rate - reference;
    const verdict = gap <= 0.25 ? "כרגע לא מזוהה פער משמעותי" : gap <= 0.75 ? "כדאי לבדוק" : "נראה שיש פוטנציאל משמעותי לבדיקה";
    return { current, market, excess, gap, verdict, y5: excess * Math.min(60, months), y10: excess * Math.min(120, months) };
  }, [balance, yrs, rate, payment, reference]);

  return (
    <CalculatorShell
      question="האם אני משלם על המשכנתא יותר מהשוק?"
      intro="השוואה בין הריבית הממוצעת שלכם לבין ריביות השוק הממוצעות היום."
      inputs={<>
        <NumberField label="יתרת המשכנתא" suffix="₪" value={balance} onChange={setBalance} max={50_000_000} />
        <NumberField label="שנים שנותרו" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת היום" suffix="%" value={rate} onChange={setRate} decimals max={15} hint="מופיעה בדוח היתרות או בדף המשכנתא באתר הבנק" />
        <NumberField label="החזר חודשי נוכחי" suffix="₪" value={payment} onChange={setPayment} optional max={1_000_000} />
      </>}
      result={!reference
        ? <p className="text-muted-foreground">{failed ? "לא הצלחנו לטעון את ריביות השוק כרגע. נסו לרענן בעוד רגע." : "טוען ריביות שוק עדכניות…"}</p>
        : r ? <>
          <BigResult label="תוצאה ראשונית" value={r.verdict} tone={r.gap > 0.75 ? "warn" : undefined}
            sub={`הריבית שלכם ${r.gap > 0 ? "גבוהה" : "נמוכה"} בכ-${Math.abs(r.gap).toFixed(2)} נקודות אחוז מממוצע השוק (${reference}%)`} />
          <ResultGrid items={[
            { label: "תשלום עודף משוער בחודש", value: nis(r.excess) },
            { label: "ב-5 שנים", value: nis(r.y5), hint: "אם שום דבר לא משתנה" },
            { label: "ב-10 שנים", value: nis(r.y10) },
            { label: "החזר בריבית השוק", value: nis(r.market) },
          ]} />
        </> : <p className="text-muted-foreground">הזינו יתרה, תקופה וריבית כדי לראות את התוצאה.</p>}
      visual={r && <BeforeAfter rows={[{ label: "החזר חודשי: היום מול ריבית השוק הממוצעת", before: r.current, after: r.market, fmt: nis }]} />}
      explanation={reference && <p>
        "ממוצע השוק" הוא ממוצע הריביות העדכניות במסלולים לא צמודים (פריים, קבועה לא צמודה ומשתנה כל 5 שנים). אם חלק מהמשכנתא שלכם צמוד למדד, ההשוואה חלקית: ריבית צמודה נמוכה יותר אבל הקרן גדלה עם המדד. הריבית שתקבלו בפועל תלויה בבנק, באחוז המימון, בהכנסה ובמסלולים. החישוב לא כולל עמלות פירעון או עלויות מחזור.
      </p>}
      cta={{ text: "רוצים לדעת בדיוק אילו מסלולים יקרים לכם?", label: "העלו דוח יתרות לסילוק לבדיקה מדויקת יותר", href: "/balance-check", secondary: { label: "או בדיקת משכנתא מהירה", href: "/mortgage-check" } }}
    />
  );
}
