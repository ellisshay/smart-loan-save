import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorShell, NumberField, BigResult, ResultGrid } from "@/components/calculators/CalculatorShell";
import { BalanceChart } from "@/components/mortgage/charts";
import { nis, pct } from "@/components/mortgage/primitives";
import { schedule } from "@/lib/mortgage/amortization";
import { REASONABLE_RATIO, LTV_CAP, dtiBand } from "@/lib/mortgage/affordability";
import { useMarketRates } from "@/hooks/useMarketRates";

export default function NewMortgageCalculator() {
  const { reference } = useMarketRates();
  const [price, setPrice] = useState<number | null>(1_800_000);
  const [equity, setEquity] = useState<number | null>(450_000);
  const [loanOverride, setLoanOverride] = useState<number | null>(null);
  const [yrs, setYrs] = useState<number | null>(25);
  const [rate, setRateState] = useState<number | null>(4.8);
  const touched = useRef(false);
  const setRate = (v: number | null) => { touched.current = true; setRateState(v); };
  const [income, setIncome] = useState<number | null>(null);
  // Use today's market reference once it loads, unless the user already typed a rate.
  useEffect(() => { if (reference && !touched.current) setRateState(reference); }, [reference]);

  const r = useMemo(() => {
    const p = price || 0, e = equity || 0;
    const loan = loanOverride ?? Math.max(0, p - e);
    const months = Math.round((yrs || 0) * 12);
    const rr = rate ?? 0;
    if (!loan || !months) return null;
    const s = schedule(loan, rr, months);
    const ltv = p ? loan / p : null;
    return {
      loan, ltv, s, rr,
      incomeLow: s.monthly / REASONABLE_RATIO.high, incomeHigh: s.monthly / REASONABLE_RATIO.low,
      dti: income ? s.monthly / income : null,
    };
  }, [price, equity, loanOverride, yrs, rate, income]);

  return (
    <CalculatorShell
      question="כמה תעלה לי משכנתא חדשה?"
      intro="הזינו מחיר נכס והון עצמי וקבלו מיד החזר חודשי משוער, אחוז מימון ועלות כוללת."
      inputs={<>
        <NumberField label="מחיר הנכס" suffix="₪" value={price} onChange={setPrice} max={100_000_000} />
        <NumberField label="הון עצמי" suffix="₪" value={equity} onChange={setEquity} max={100_000_000} />
        <NumberField label="סכום המשכנתא" suffix="₪" value={loanOverride} onChange={setLoanOverride} max={100_000_000} optional
          placeholder={price ? Math.max(0, (price || 0) - (equity || 0)).toLocaleString("en-US") : ""} hint="ריק = מחיר הנכס פחות ההון העצמי" />
        <NumberField label="תקופה" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת משוערת" suffix="%" value={rate} onChange={setRate} decimals max={15}
          hint={reference ? `ברירת מחדל: ממוצע ריביות השוק במסלולים לא צמודים (${reference}%)` : "ערך התחלתי לדוגמה. אפשר לשנות"} />
        <NumberField label="הכנסה חודשית נטו של משק הבית" suffix="₪" value={income} onChange={setIncome} optional max={10_000_000} />
      </>}
      result={r ? <>
        <BigResult label="החזר חודשי משוער" value={nis(r.s.monthly)} sub={`למשכנתא של ${nis(r.loan)} ל-${yrs} שנים בריבית ממוצעת של ${r.rr}%`} />
        <ResultGrid items={[
          { label: "אחוז מימון", value: pct(r.ltv), hint: r.ltv !== null && r.ltv > LTV_CAP.single ? "מעל 75%, המימון המרבי לדירה יחידה" : "מתוך מחיר הנכס" },
          { label: "סך ההחזרים", value: nis(r.s.totalPaid) },
          { label: "עלות הריבית", value: nis(r.s.totalInterest), hint: "הערכה בריבית אחת לא צמודה" },
          r.dti !== null
            ? { label: "החזר מתוך ההכנסה", value: pct(r.dti), hint: dtiBand(r.dti)?.short }
            : { label: "הכנסה נדרשת", value: `${nis(r.incomeLow)}–${nis(r.incomeHigh)}`, hint: "כדי שההחזר יהיה 25%–33% מההכנסה" },
        ]} />
      </> : <p className="text-muted-foreground">הזינו מחיר נכס, הון עצמי ותקופה כדי לראות את התוצאה.</p>}
      visual={r && <><p className="text-sm font-semibold mb-2">יתרת המשכנתא לאורך השנים</p><BalanceChart points={r.s.points} /></>}
      explanation={r && <p>
        ההחזר מחושב בשיטת שפיצר (החזר חודשי קבוע) לפי ריבית ממוצעת אחת. במשכנתא אמיתית יש כמה מסלולים, וחלקם צמודים למדד או בריבית משתנה, ולכן ההחזר בפועל יכול להיות שונה.
        {r.dti === null && " הוסיפו הכנסה כדי לראות כמה מההכנסה ילך להחזר."}
      </p>}
      cta={{ text: "רוצים לראות את המספרים לפי הנתונים שלכם ו-3 תמהילים לדוגמה?", label: "לבדיקת משכנתא חינם", href: "/mortgage-check" }}
      note="החישוב הוא הערכה כללית בלבד, לא הצעה של בנק ולא אישור עקרוני. הריבית, התמהיל והתנאים בפועל נקבעים על ידי הבנק."
    />
  );
}
