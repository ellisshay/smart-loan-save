import { useMemo, useState } from "react";
import { CalculatorShell, NumberField } from "@/components/calculators/CalculatorShell";
import { nis } from "@/components/mortgage/primitives";
import { simulate } from "@/lib/mortgage/scenarios";
import type { NormalizedTrack } from "@/lib/mortgage/tracks";

export default function EarlyRepaymentCalculator() {
  const [balance, setBalance] = useState<number | null>(700_000);
  const [yrs, setYrs] = useState<number | null>(20);
  const [rate, setRate] = useState<number | null>(4.8);
  const [amount, setAmount] = useState<number | null>(50_000);

  const r = useMemo(() => {
    if (!balance || !yrs || rate === null || !amount) return null;
    const track: NormalizedTrack = { kind: "other", label: "", amount: balance, rate, months: Math.round(yrs * 12), linked: false, variable: false };
    const base = simulate([track], 0, { kind: "base" });
    const pay = simulate([track], 0, { kind: "lump", amount, mode: "payment" });
    const term = simulate([track], 0, { kind: "lump", amount, mode: "term" });
    return { base, pay, term, capped: amount >= balance };
  }, [balance, yrs, rate, amount]);

  const Card = ({ title, sub, rows, best }: { title: string; sub: string; rows: [string, string][]; best?: boolean }) => (
    <div className={`rounded-xl border p-4 ${best ? "border-primary bg-primary/5" : "border-border"}`}>
      <p className="font-display font-bold">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">{sub}</p>
      <dl className="space-y-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}</dl>
    </div>
  );

  return (
    <CalculatorShell
      question="מה יקרה אם אחזיר חלק מהמשכנתא?"
      intro="שתי דרכים לנצל פירעון מוקדם: להקטין את ההחזר החודשי או לקצר את התקופה. כאן רואים את שתיהן זו לצד זו."
      inputs={<>
        <NumberField label="יתרת המשכנתא היום" suffix="₪" value={balance} onChange={setBalance} max={50_000_000} />
        <NumberField label="שנים שנותרו" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת משוערת" suffix="%" value={rate} onChange={setRate} decimals max={15} />
        <NumberField label="סכום לפירעון מוקדם" suffix="₪" value={amount} onChange={setAmount} max={50_000_000} />
      </>}
      result={r ? <>
        {r.capped && <p className="text-sm text-success mb-3">הסכום מכסה את כל היתרה, כלומר פירעון מלא של המשכנתא.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <Card title="הקטנת ההחזר החודשי" sub="התקופה נשארת זהה" rows={[
            ["החזר חודשי חדש", nis(r.pay.monthly)],
            ["פחות בכל חודש", nis(-r.pay.monthlyDiff)],
            ["חיסכון בריבית", nis(-r.pay.interestDiff)],
          ]} />
          <Card title="קיצור התקופה" sub="ההחזר החודשי נשאר דומה" best={!r.capped && r.term.interestDiff < r.pay.interestDiff} rows={[
            ["החזר חודשי", nis(r.term.monthly)],
            ["מסיימים מוקדם יותר ב", r.term.monthsDiff < 0 ? `${Math.round(-r.term.monthsDiff / 12 * 10) / 10} שנים` : "—"],
            ["חיסכון בריבית", nis(-r.term.interestDiff)],
          ]} />
        </div>
      </> : <p className="text-muted-foreground">הזינו יתרה, תקופה, ריבית וסכום כדי לראות את התוצאה.</p>}
      explanation={r && <p>
        קיצור התקופה חוסך בדרך כלל יותר ריבית, כי הקרן נפרעת מהר יותר. הקטנת ההחזר משאירה יותר כסף פנוי בכל חודש. ההחזר היום לפי הנתונים: {nis(r.base.monthly)}.
        בפירעון מוקדם בפועל ייתכנו עמלת פירעון ועמלת היוון, בעיקר במסלולים בריבית קבועה, והן לא כלולות כאן.
      </p>}
      cta={{ text: "רוצים לדעת אילו מסלולים כדאי לפרוע ומה העמלות בפועל?", label: "לבדיקה לפי דוח יתרות לסילוק", href: "/balance-check", secondary: { label: "או בדיקת משכנתא מהירה", href: "/mortgage-check" } }}
    />
  );
}
