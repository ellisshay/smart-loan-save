import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CalculatorShell, NumberField, BigResult, ResultGrid } from "@/components/calculators/CalculatorShell";
import { Slider } from "@/components/ui/slider";
import { CHART, nis, signedNis } from "@/components/mortgage/primitives";
import { simulate } from "@/lib/mortgage/scenarios";
import type { NormalizedTrack } from "@/lib/mortgage/tracks";

export default function RateSensitivityCalculator() {
  const [balance, setBalance] = useState<number | null>(1_000_000);
  const [yrs, setYrs] = useState<number | null>(25);
  const [rate, setRate] = useState<number | null>(5);
  const [variablePct, setVariablePct] = useState<number | null>(40);
  const [delta, setDelta] = useState(1);

  const tracks = useMemo<NormalizedTrack[] | null>(() => {
    if (!balance || !yrs || rate === null) return null;
    const share = Math.min(100, variablePct ?? 0) / 100, months = Math.round(yrs * 12);
    return [
      { kind: "prime", label: "משתנה", amount: balance * share, rate, months, linked: false, variable: true },
      { kind: "fixed_unlinked", label: "קבועה", amount: balance * (1 - share), rate, months, linked: false, variable: false },
    ].filter((t) => t.amount > 0) as NormalizedTrack[];
  }, [balance, yrs, rate, variablePct]);

  const res = useMemo(() => (tracks ? simulate(tracks, 0, { kind: "rate", delta }) : null), [tracks, delta]);
  const curve = useMemo(() => tracks ? Array.from({ length: 21 }, (_, i) => { const d = -2 + i * 0.25; return { d, payment: simulate(tracks, 0, { kind: "rate", delta: d }).monthly }; }) : [], [tracks]);
  const base = res ? res.monthly - res.monthlyDiff : 0;

  return (
    <CalculatorShell
      question="מה קורה למשכנתא שלי אם הריבית משתנה?"
      intro="הזיזו את הסליידר וראו מיד את ההחזר החדש. שינוי ריבית משפיע רק על החלק שבריבית משתנה."
      inputs={<>
        <NumberField label="יתרת המשכנתא" suffix="₪" value={balance} onChange={setBalance} max={50_000_000} />
        <NumberField label="שנים שנותרו" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת היום" suffix="%" value={rate} onChange={setRate} decimals max={15} />
        <NumberField label="חלק המשכנתא בריבית משתנה" suffix="%" value={variablePct} onChange={setVariablePct} max={100}
          hint="פריים ומסלולים משתנים. מסלולים בריבית קבועה לא מושפעים" />
      </>}
      result={res ? <>
        <div className="mb-5">
          <div className="flex justify-between items-baseline mb-3"><span className="text-sm text-muted-foreground">שינוי בריבית</span><span className="font-display text-2xl font-bold tabular-nums" dir="ltr">{delta > 0 ? "+" : ""}{delta}%</span></div>
          <Slider dir="rtl" min={-2} max={3} step={0.25} value={[delta]} onValueChange={([v]) => setDelta(v)} aria-label="שינוי בריבית" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5" dir="ltr"><span>-2%</span><span>0</span><span>+3%</span></div>
        </div>
        <BigResult label="החזר חודשי חדש" value={nis(res.monthly)} tone={res.monthlyDiff > 1 ? "warn" : res.monthlyDiff < -1 ? "good" : undefined} />
        <ResultGrid items={[
          { label: "הפרש חודשי", value: signedNis(res.monthlyDiff) },
          { label: "הפרש שנתי", value: signedNis(res.monthlyDiff * 12) },
        ]} />
        {res.note && <p className="text-sm text-muted-foreground mt-3">{res.note}</p>}
      </> : <p className="text-muted-foreground">הזינו יתרה, תקופה וריבית כדי לראות את התוצאה.</p>}
      visual={res && curve.length > 0 && <div>
        <p className="text-sm font-semibold mb-2">ההחזר החודשי לפי שינוי הריבית</p>
        <div className="h-52" dir="ltr" role="img" aria-label="גרף ההחזר החודשי לפי שינוי בריבית">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={CHART.light} vertical={false} />
              <XAxis dataKey="d" tickFormatter={(d) => `${d > 0 ? "+" : ""}${d}%`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} ticks={[-2, -1, 0, 1, 2, 3]} type="number" domain={[-2, 3]} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${Math.round(v / 100) / 10}K`} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => [nis(v), "החזר חודשי"]} labelFormatter={(d) => `שינוי של ${d}%`} />
              <Line type="monotone" dataKey="payment" stroke={CHART.teal} strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={delta} y={res.monthly} r={5} fill={CHART.navy} stroke="white" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>}
      explanation={res && <p>
        ההחזר היום לפי הנתונים: {nis(base)}. החישוב מניח שהשינוי חל מיד על כל החלק המשתנה, ושהחלק הקבוע לא משתנה. בפועל, במסלול משתנה כל 5 שנים השינוי חל רק בנקודת השינוי הבאה, ובמסלול צמוד מדד גם האינפלציה משפיעה על ההחזר.
      </p>}
      cta={{ text: "רוצים לדעת כמה המשכנתא שלכם רגישה לריבית לפי המסלולים האמיתיים?", label: "לבדיקת משכנתא חינם", href: "/mortgage-check" }}
    />
  );
}
