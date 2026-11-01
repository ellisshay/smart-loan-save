import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { monthYear } from "@/lib/mortgage/amortization";
import { simulate, type Scenario } from "@/lib/mortgage/scenarios";
import type { NormalizedTrack } from "@/lib/mortgage/tracks";
import { EstimateNote, nis, signedNis } from "./primitives";

type Preset = { key: string; label: string; scenario: (v: number) => Scenario; slider?: { min: number; max: number; step: number; def: number; fmt: (v: number) => string } };

const PRESETS: Preset[] = [
  { key: "up", label: "הריבית עולה", scenario: (v) => ({ kind: "rate", delta: v }), slider: { min: 0.25, max: 3, step: 0.25, def: 1, fmt: (v) => `+${v}%` } },
  { key: "down", label: "הריבית יורדת", scenario: (v) => ({ kind: "rate", delta: -v }), slider: { min: 0.25, max: 2, step: 0.25, def: 1, fmt: (v) => `−${v}%` } },
  { key: "extra", label: "מוסיפים להחזר החודשי", scenario: (v) => ({ kind: "extra", amount: v }), slider: { min: 250, max: 3000, step: 250, def: 500, fmt: (v) => `${v.toLocaleString("he-IL")} ₪` } },
  { key: "lump", label: "פירעון מוקדם חלקי", scenario: (v) => ({ kind: "lump", amount: v, mode: "term" }), slider: { min: 10000, max: 300000, step: 10000, def: 50000, fmt: (v) => `${v.toLocaleString("he-IL")} ₪` } },
  { key: "shorten", label: "מקצרים את התקופה", scenario: (v) => ({ kind: "shorten", years: v }), slider: { min: 1, max: 10, step: 1, def: 5, fmt: (v) => `${v} שנים` } },
  { key: "refi", label: "מחזור לריבית אחרת", scenario: (v) => ({ kind: "refi", rate: v, costs: 0 }), slider: { min: 1.5, max: 8, step: 0.1, def: 4.5, fmt: (v) => `${v.toFixed(1)}%` } },
];

/** "מה קורה אם?" — one question at a time, instant answer. */
export default function ScenarioSimulator({ tracks, cpi }: { tracks: NormalizedTrack[]; cpi: number }) {
  const [key, setKey] = useState("up");
  const preset = PRESETS.find((p) => p.key === key)!;
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = Object.fromEntries(PRESETS.map((p) => [p.key, p.slider?.def ?? 0]));
    const total = tracks.reduce((s, t) => s + t.amount, 0);
    // Start the refinance slider half a point below today's weighted rate (rates only, no CPI).
    if (total) init.refi = Math.min(8, Math.max(1.5, Math.round((tracks.reduce((s, t) => s + t.rate * t.amount, 0) / total - 0.5) * 10) / 10));
    return init;
  });
  const v = values[key];
  const base = useMemo(() => simulate(tracks, cpi, { kind: "base" }), [tracks, cpi]);
  const res = useMemo(() => simulate(tracks, cpi, preset.scenario(v)), [tracks, cpi, preset, v]);
  const monthsSaved = -res.monthsDiff;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="בחרו שאלה">
        {PRESETS.map((p) => (
          <button key={p.key} role="tab" aria-selected={p.key === key} onClick={() => setKey(p.key)}
            className={cn("shrink-0 rounded-full px-4 min-h-11 text-sm font-medium border transition-colors",
              p.key === key ? "bg-navy text-white border-navy" : "bg-card border-border text-foreground hover:border-primary")}>
            {p.label}
          </button>
        ))}
      </div>

      {preset.slider && (
        <div className="mt-5">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-sm text-muted-foreground">בכמה?</span>
            <span className="font-display text-xl font-bold tabular-nums">{preset.slider.fmt(v)}</span>
          </div>
          <Slider dir="rtl" min={preset.slider.min} max={preset.slider.max} step={preset.slider.step} value={[v]}
            onValueChange={([n]) => setValues((s) => ({ ...s, [key]: n }))} aria-label={preset.label} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="החזר חודשי" value={nis(res.monthly)} diff={res.monthlyDiff} />
        <Stat label="ריבית (הערכה)" value={nis(res.totalInterest)} diff={res.interestDiff} sub={res.totalIndexation > 0.5 || base.totalIndexation > 0.5 ? `הצמדה למדד: ${nis(res.totalIndexation)}` : undefined} />
        <Stat label="סיום המשכנתא" value={res.months ? monthYear(res.endDate) : "—"} sub={monthsSaved > 0 ? `${Math.round(monthsSaved / 12 * 10) / 10} שנים מוקדם יותר` : monthsSaved < 0 ? "מאוחר יותר" : "ללא שינוי"} />
        <Stat label={res.costDiff <= 0 ? "חיסכון משוער בעלות הכוללת" : "תוספת משוערת לעלות הכוללת"} value={nis(Math.abs(res.costDiff))} tone={res.costDiff < -1 ? "good" : res.costDiff > 1 ? "warn" : undefined} sub="ריבית + הצמדה" />
      </div>
      {res.note && <p className="text-sm text-muted-foreground mt-3">{res.note}</p>}
      {key === "refi" && <p className="text-sm text-muted-foreground mt-3">הריבית בסליידר היא ריבית ממוצעת משוערת לכל היתרה, לפני עמלות פירעון ועלויות מחזור. לבדיקה מדויקת צריך דוח יתרות לסילוק.</p>}
      {key === "lump" && <p className="text-sm text-muted-foreground mt-3">בחישוב הזה ההחזר החודשי נשאר דומה והתקופה מתקצרת. בפירעון מוקדם בפועל ייתכנו עמלות.</p>}
      <EstimateNote>
        חישוב משוער לפי המסלולים והריביות הידועים כרגע. שינוי ריבית מחושב רק על מסלולים בריבית משתנה, ממועד החישוב.
        {tracks.some((t) => t.linked) && cpi > 0 ? ` במסלולים הצמודים הקרן מתעדכנת לפי הנחת מדד שנתית של ${cpi}%, וההצמדה מוצגת בנפרד מהריבית.` : ""}
        {key === "refi" ? " במחזור החישוב מניח הלוואה לא צמודה, ולכן אין בה הצמדה." : ""} ההחזר הבסיסי בחישוב: {nis(base.monthly)}.
      </EstimateNote>
    </div>
  );
}

function Stat({ label, value, diff, sub, tone }: { label: string; value: string; diff?: number; sub?: string; tone?: "good" | "warn" }) {
  const d = diff ?? 0;
  return (
    <div className="rounded-xl bg-muted/40 p-3 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-bold tabular-nums truncate", tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "")}>{value}</p>
      {diff !== undefined && Math.abs(d) >= 1 && <p className={cn("text-xs tabular-nums", d < 0 ? "text-success" : "text-warning")}>{signedNis(d)}</p>}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
