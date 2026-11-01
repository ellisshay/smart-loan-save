import { addMonths, monthYear } from "@/lib/mortgage/amortization";
import type { NormalizedTrack } from "@/lib/mortgage/tracks";
import { EstimateNote } from "./primitives";

interface Point { date: Date; label: string; detail?: string; tone: "now" | "event" | "end" }

/** C. Timeline built only from real dates (exit / rate-change dates) plus today and the projected end. */
export default function MortgageTimeline({ tracks, termMonths, rateChangeDate, today = new Date() }: {
  tracks: NormalizedTrack[]; termMonths: number | null; rateChangeDate?: string | null; today?: Date;
}) {
  const pts: Point[] = [{ date: today, label: "היום", tone: "now" }];
  const valid = (s?: string | null) => { if (!s) return null; const d = new Date(s); return Number.isNaN(d.getTime()) || d < today ? null : d; };
  const rc = valid(rateChangeDate);
  if (rc) pts.push({ date: rc, label: "שינוי ריבית צפוי", tone: "event" });
  tracks.forEach((t) => { const d = valid(t.exitDate); if (d) pts.push({ date: d, label: "נקודת יציאה", detail: t.label, tone: "event" }); });
  const half = termMonths ? addMonths(today, Math.round(termMonths / 2)) : null;
  if (half && termMonths && termMonths >= 120) pts.push({ date: half, label: "מחצית התקופה", tone: "event" });
  if (termMonths) pts.push({ date: addMonths(today, termMonths), label: "סיום משוער", tone: "end" });
  pts.sort((a, b) => a.date.getTime() - b.date.getTime());
  const hasVariable = tracks.some((t) => t.variable);

  return (
    <div>
      <ol className="flex gap-0 overflow-x-auto pb-2 -mx-1 px-1 snap-x" aria-label="ציר זמן המשכנתא">
        {pts.map((p, i) => (
          <li key={`${p.label}-${i}`} className="snap-start min-w-[7.5rem] flex-1 relative pt-6">
            <span className="absolute top-2 right-0 left-0 h-0.5 bg-border" aria-hidden />
            <span className={`absolute top-0 right-2 w-4 h-4 rounded-full border-2 ${p.tone === "now" ? "bg-primary border-primary" : p.tone === "end" ? "bg-navy border-navy" : "bg-card border-primary"}`} aria-hidden />
            <p className="text-sm font-semibold pl-2">{p.label}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{monthYear(p.date)}</p>
            {p.detail && <p className="text-[11px] text-muted-foreground mt-0.5 pl-2">{p.detail}</p>}
          </li>
        ))}
      </ol>
      {hasVariable && !rc && !tracks.some((t) => t.exitDate) && (
        <EstimateNote>במשכנתא יש מסלולים בריבית משתנה. מועדי שינוי הריבית לא הוזנו, ולכן הם לא מוצגים בציר. אפשר להוסיף אותם בפרטי המשכנתא.</EstimateNote>
      )}
    </div>
  );
}
