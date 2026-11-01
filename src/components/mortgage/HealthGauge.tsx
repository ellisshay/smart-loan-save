import type { HealthResult } from "@/lib/mortgage/health";
import { CHART, EmptyState, EstimateNote } from "./primitives";

const BAND_COLOR = { good: CHART.teal, check: CHART.gold, review: "hsl(15 70% 50%)" } as const;

/** "מדד מצב המשכנתא": circular gauge + plain-Hebrew reasons. Not a credit score. */
export default function HealthGauge({ health, missingHref, emptyText, emptyCta, estimateNote }: {
  health: HealthResult | null; missingHref?: string; emptyText?: string; emptyCta?: string; estimateNote?: string;
}) {
  if (!health) {
    return <EmptyState text={emptyText ?? "חסרים נתונים כדי להציג את מדד מצב המשכנתא. השלימו הכנסה, שווי נכס וסכום משכנתא."} cta={emptyCta ?? "להשלמת הפרטים"} href={missingHref} />;
  }
  const r = 52, c = 2 * Math.PI * r, arc = c * 0.75;
  const filled = (health.score / 100) * arc;
  const color = BAND_COLOR[health.band];
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-36 h-36 shrink-0" role="img" aria-label={`מדד מצב המשכנתא ${health.score} מתוך 100, ${health.bandLabel}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[225deg]">
          <circle cx="60" cy="60" r={r} fill="none" stroke={CHART.light} strokeWidth="10" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${filled} ${c}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold tabular-nums text-foreground">{health.score}</span>
          <span className="text-xs text-muted-foreground">מתוך 100</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 text-center sm:text-right">
        <p className="font-display text-lg font-bold" style={{ color }}>{health.bandLabel}</p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
          {health.reasons.map((t) => <li key={t} className="leading-snug">• {t}</li>)}
        </ul>
        <EstimateNote>
          הציון מבוסס על הנתונים הזמינים כרגע ({health.factors.map((f) => f.label).join(", ")}).
          {health.missing.length > 0 && ` לא נכללו: ${health.missing.join(", ")}.`}{estimateNote ? ` ${estimateNote}` : ""} זה לא ציון אשראי, לא ציון בנקאי ולא סיכוי לאישור.
        </EstimateNote>
      </div>
    </div>
  );
}
