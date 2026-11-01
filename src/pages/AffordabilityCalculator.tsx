import { useMemo, useState } from "react";
import { CalculatorShell, NumberField, BigResult } from "@/components/calculators/CalculatorShell";
import { nis, pct } from "@/components/mortgage/primitives";
import { affordability, type Purpose } from "@/lib/mortgage/affordability";
import { useMarketRates } from "@/hooks/useMarketRates";
import { cn } from "@/lib/utils";

const PURPOSES: { key: Purpose; label: string }[] = [
  { key: "single", label: "דירה יחידה" },
  { key: "upgrade", label: "משפרי דיור" },
  { key: "investment", label: "דירה להשקעה" },
];

export default function AffordabilityCalculator() {
  const { reference } = useMarketRates();
  const [income, setIncome] = useState<number | null>(20_000);
  const [obligations, setObligations] = useState<number | null>(0);
  const [equity, setEquity] = useState<number | null>(500_000);
  const [yrs, setYrs] = useState<number | null>(25);
  const [purpose, setPurpose] = useState<Purpose>("single");
  const rate = reference ?? 4.8;

  const a = useMemo(() => affordability({ netIncome: income || 0, obligations: obligations || 0, equity: equity || 0, years: yrs || 0, rate, purpose }),
    [income, obligations, equity, yrs, rate, purpose]);

  const maxLoan = a ? Math.max(a.possible.loan, a.reasonable.loanHigh, 1) : 1;
  return (
    <CalculatorShell
      question="כמה משכנתא אני יכול לקחת?"
      intro="מה סביר לפי ההכנסה שלכם, ומה הגבול האפשרי. אלה שני דברים שונים."
      inputs={<>
        <NumberField label="הכנסה חודשית נטו של משק הבית" suffix="₪" value={income} onChange={setIncome} max={10_000_000} />
        <NumberField label="התחייבויות חודשיות קיימות" suffix="₪" value={obligations} onChange={setObligations} max={10_000_000} hint="הלוואות, ליסינג, מזונות" />
        <NumberField label="הון עצמי זמין" suffix="₪" value={equity} onChange={setEquity} max={100_000_000} />
        <NumberField label="תקופת החזר רצויה" suffix="שנים" value={yrs} onChange={setYrs} min={4} max={30} />
        <div>
          <p className="text-sm font-medium mb-1.5">סוג הרכישה</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {PURPOSES.map((p) => (
              <button key={p.key} type="button" role="radio" aria-checked={purpose === p.key} onClick={() => setPurpose(p.key)}
                className={cn("min-h-11 rounded-xl border text-sm", purpose === p.key ? "bg-navy text-white border-navy" : "bg-background border-input")}>{p.label}</button>
            ))}
          </div>
        </div>
      </>}
      result={a ? <>
        <BigResult label="טווח סביר למשכנתא" value={`${nis(a.reasonable.loanLow)}–${nis(a.reasonable.loanHigh)}`}
          sub={`החזר חודשי של ${nis(a.reasonable.paymentLow)}–${nis(a.reasonable.paymentHigh)}, כ-25%–33% מההכנסה אחרי התחייבויות`} />
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-success/10 p-4">
            <p className="text-sm font-semibold text-success">טווח סביר</p>
            <p className="text-xs text-muted-foreground mt-0.5">מחיר דירה משוער</p>
            <p className="font-display text-xl font-bold tabular-nums">{nis(a.reasonable.priceLow)}–{nis(a.reasonable.priceHigh)}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-semibold">גבול אפשרי (לא המלצה)</p>
            <p className="text-xs text-muted-foreground mt-0.5">משכנתא עד כ-{nis(a.possible.loan)} · החזר עד {nis(a.possible.payment)}</p>
            <p className="font-display text-xl font-bold tabular-nums">עד {nis(a.possible.price)}</p>
          </div>
        </div>
        {a.equityLimited && <p className="text-sm text-warning mt-3">ההון העצמי מגביל את גובה המשכנתא: במימון של עד {pct(a.ltvCap)} צריך הון עצמי של לפחות {pct(1 - a.ltvCap)} ממחיר הדירה.</p>}
        {a.reasonable.paymentHigh === 0 && <p className="text-sm text-warning mt-3">ההתחייבויות הקיימות גבוהות ביחס להכנסה, ולכן לא נשאר מרווח להחזר משכנתא בטווח הסביר.</p>}
      </> : <p className="text-muted-foreground">הזינו הכנסה ותקופה כדי לראות את התוצאה.</p>}
      visual={a && <div>
        <p className="text-sm font-semibold mb-3">גובה המשכנתא</p>
        <div className="relative h-8 rounded-full bg-muted overflow-hidden" role="img" aria-label={`טווח סביר ${nis(a.reasonable.loanLow)} עד ${nis(a.reasonable.loanHigh)}, גבול אפשרי ${nis(a.possible.loan)}`}>
          <div className="absolute inset-y-0 right-0 bg-navy/15" style={{ width: `${(a.possible.loan / maxLoan) * 100}%` }} />
          <div className="absolute inset-y-0 bg-success/70 rounded-full" style={{ right: `${(a.reasonable.loanLow / maxLoan) * 100}%`, width: `${((a.reasonable.loanHigh - a.reasonable.loanLow) / maxLoan) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>0 ₪</span><span>{nis(maxLoan)}</span></div>
        <ul className="flex gap-4 text-xs mt-2"><li><span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/70 ml-1" />טווח סביר</li><li><span className="inline-block w-2.5 h-2.5 rounded-sm bg-navy/15 ml-1" />עד הגבול האפשרי</li></ul>
      </div>}
      explanation={<p>
        "טווח סביר" מבוסס על המלצה מקובלת שההחזר לא יעלה על כשליש מההכנסה. "גבול אפשרי" מבוסס על המגבלות הכלליות של בנק ישראל: החזר עד 50% מההכנסה, ומימון של עד 75% לדירה יחידה, 70% למשפרי דיור ו-50% לדירה להשקעה. בנקים רבים מאשרים פחות מהגבול, ולקיחת משכנתא עד הגבול משאירה מעט מרווח לביטחון.
        {` החישוב משתמש בריבית ממוצעת משוערת של ${rate}%${reference ? " לפי ריביות השוק הנוכחיות" : ""}.`}
      </p>}
      cta={{ text: "רוצים לדעת כמה תוכלו לקבל בפועל לפי הנתונים המלאים שלכם?", label: "לבדיקת משכנתא חינם", href: "/mortgage-check" }}
    />
  );
}
