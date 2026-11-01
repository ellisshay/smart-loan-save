import { useMemo, useState } from "react";
import { CalculatorShell, NumberField } from "@/components/calculators/CalculatorShell";
import { nis, pct } from "@/components/mortgage/primitives";
import { affordability, CAUTION_RATIO, MAX_PTI, REASONABLE_RATIO, type Purpose } from "@/lib/mortgage/affordability";
import { useMarketRates } from "@/hooks/useMarketRates";
import { cn } from "@/lib/utils";

const PURPOSES: { key: Purpose; label: string }[] = [
  { key: "single", label: "דירה יחידה" },
  { key: "upgrade", label: "משפרי דיור" },
  { key: "investment", label: "דירה להשקעה" },
];

/** Repayment-to-income scale 0%-50%, comfortable zone emphasized, ceiling shown as context only. */
function RatioScale() {
  const zones = [
    { from: 0, to: REASONABLE_RATIO.low, cls: "bg-success/25", label: "" },
    { from: REASONABLE_RATIO.low, to: REASONABLE_RATIO.high, cls: "bg-success", label: "נוח" },
    { from: REASONABLE_RATIO.high, to: CAUTION_RATIO, cls: "bg-warning/70", label: "זהירות" },
    { from: CAUTION_RATIO, to: MAX_PTI, cls: "bg-destructive/40", label: "סיכון גבוה" },
  ];
  return (
    <div>
      <p className="text-sm font-semibold mb-3">כמה מההכנסה הולך להחזר</p>
      <div className="flex h-8 rounded-full overflow-hidden" role="img" aria-label="טווח נוח 25% עד 33%, זהירות 33% עד 40%, סיכון גבוה 40% עד 50%, 50% מגבלה רגולטורית">
        {zones.map((z) => (
          <div key={z.from} className={cn("h-full flex items-center justify-center text-[11px] font-semibold", z.cls, z.label === "נוח" ? "text-white" : "text-foreground/80")} style={{ width: `${((z.to - z.from) / MAX_PTI) * 100}%` }}>{z.label}</div>
        ))}
      </div>
      <div className="relative h-5 mt-1 text-[11px] text-muted-foreground tabular-nums" dir="ltr">
        {[0, 0.25, 0.33, 0.4, 0.5].map((v) => <span key={v} className="absolute -translate-x-1/2" style={{ right: `${(v / MAX_PTI) * 100}%`, transform: "translateX(50%)" }}>{Math.round(v * 100)}%</span>)}
      </div>
      <p className="text-xs text-muted-foreground mt-2">50% היא המגבלה הכללית של בנק ישראל, לא המלצה. מעל 40% בנק ישראל מגדיר את ההלוואה כסיכון גבוה.</p>
    </div>
  );
}

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

  return (
    <CalculatorShell
      question="כמה משכנתא אני יכול לקחת?"
      intro="מה אפשר לקבל מהבנק אינו בהכרח מה שכדאי לקחת. כאן רואים קודם כל את הטווח הנוח."
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
        <div className="rounded-xl bg-success/10 border border-success/30 p-4">
          <p className="text-sm font-semibold text-success">טווח סביר · 25%–33% מההכנסה</p>
          <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums mt-1 leading-tight">{nis(a.reasonable.from.loan)}–{nis(a.reasonable.to.loan)}</p>
          <p className="text-sm text-muted-foreground mt-1">משכנתא בהחזר חודשי של {nis(a.reasonable.from.payment)}–{nis(a.reasonable.to.payment)} · דירה של כ-{nis(a.reasonable.from.price)}–{nis(a.reasonable.to.price)}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">החזר שמרני · כ-25%</p>
            <p className="font-display text-xl font-bold tabular-nums mt-1">{nis(a.conservative.payment)} בחודש</p>
            <p className="text-xs text-muted-foreground">משכנתא של כ-{nis(a.conservative.loan)}. משאיר מרווח לשינויים בהכנסה ובריבית.</p>
          </div>
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
            <p className="text-sm font-semibold">טווח שדורש זהירות · 33%–40%</p>
            <p className="font-display text-xl font-bold tabular-nums mt-1">עד {nis(a.caution.to.loan)}</p>
            <p className="text-xs text-muted-foreground">החזר של עד {nis(a.caution.to.payment)}. אפשרי, אבל עם פחות מרווח לביטחון.</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">גבול רגולטורי (לא המלצה):</span> החזר של עד {nis(a.regulatory.payment)} (50% מההכנסה). בנק ישראל מגדיר החזר מעל 40% כסיכון גבוה, ובנקים רבים מאשרים פחות.
        </div>
        {a.equityLimited && <p className="text-sm text-warning mt-3">ההון העצמי מגביל את גובה המשכנתא: במימון של עד {pct(a.ltvCap)} צריך הון עצמי של לפחות {pct(1 - a.ltvCap)} ממחיר הדירה.</p>}
        {a.reasonable.to.payment === 0 && <p className="text-sm text-warning mt-3">ההתחייבויות הקיימות גבוהות ביחס להכנסה, ולכן לא נשאר מרווח להחזר משכנתא בטווח הנוח.</p>}
      </> : <p className="text-muted-foreground">הזינו הכנסה ותקופה כדי לראות את התוצאה.</p>}
      visual={a && <RatioScale />}
      explanation={<p>
        מה אפשר לקבל מהבנק אינו בהכרח מה שכדאי לקחת. "טווח סביר" מבוסס על המלצה מקובלת שההחזר לא יעלה על כשליש מההכנסה. בין 33% ל-40% ההחזר אפשרי אבל דורש זהירות. מעל 40% בנק ישראל מגדיר את ההלוואה כסיכון גבוה, ו-50% היא המגבלה הכללית. מימון: עד 75% לדירה יחידה, 70% למשפרי דיור ו-50% לדירה להשקעה.
        {` החישוב משתמש בריבית ממוצעת משוערת של ${rate}%${reference ? " (ממוצע ריביות השוק במסלולים לא צמודים)" : ""} ואינו כולל הצמדה למדד.`}
      </p>}
      cta={{ text: "רוצים לדעת מה נכון לכם לפי הנתונים המלאים?", label: "לבדיקת משכנתא חינם", href: "/mortgage-check" }}
    />
  );
}
