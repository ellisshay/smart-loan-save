import { useId, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackOnce } from "@/lib/analytics";

/**
 * One layout for every calculator: a question, up to 6 inputs, an instant result,
 * one visual, a plain-Hebrew explanation and a CTA that fits the result.
 */
export function CalculatorShell({ question, intro, inputs, result, visual, explanation, cta, note }: {
  question: string; intro?: string; inputs: ReactNode; result: ReactNode; visual?: ReactNode;
  explanation?: ReactNode; cta?: { text?: string; label: string; href: string; secondary?: { label: string; href: string } }; note?: ReactNode;
}) {
  const { pathname } = useLocation();
  const started = useRef(false);
  const calculator = pathname.replace(/^\/(calculators\/)?/, "").replace(/[^a-z-]/g, "") || "calculator";
  return (
    <div className="container max-w-5xl py-8 sm:py-12" dir="rtl">
      <header className="mb-6 sm:mb-8">
        <Link to="/calculators" className="text-sm text-muted-foreground hover:text-primary">כל המחשבונים</Link>
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mt-2 leading-tight">{question}</h1>
        {intro && <p className="text-muted-foreground mt-2 max-w-2xl">{intro}</p>}
      </header>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 sm:gap-6 items-start">
        <section aria-label="נתונים" className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4"
          onInputCapture={() => { started.current = true; trackOnce(`calc-start-${calculator}`, "calculator_start", { calculator }); }}
          onBlurCapture={() => { if (started.current) trackOnce(`calc-result-${calculator}`, "calculator_result", { calculator }); }}>{inputs}</section>
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <section aria-label="תוצאה" aria-live="polite" className="rounded-2xl border border-border bg-card p-4 sm:p-6">{result}</section>
          {visual && <section aria-label="גרף" className="rounded-2xl border border-border bg-card p-4 sm:p-6">{visual}</section>}
          {explanation && <section className="rounded-2xl bg-muted/40 p-4 sm:p-6 text-sm leading-relaxed text-foreground/90">{explanation}</section>}
          {cta && (
            <section className="rounded-2xl bg-navy text-white p-5 sm:p-6">
              {cta.text && <p className="text-white/85 text-sm mb-3">{cta.text}</p>}
              <Button asChild variant="cta" size="lg" className="w-full sm:w-auto min-h-12 h-auto py-3 whitespace-normal text-center leading-snug"><Link to={cta.href}>{cta.label}<ArrowLeft size={16} className="mr-1" /></Link></Button>
              {cta.secondary && <Link to={cta.secondary.href} className="block mt-3 text-sm text-white/80 underline underline-offset-4">{cta.secondary.label}</Link>}
            </section>
          )}
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
            <Info size={14} className="shrink-0 mt-0.5" aria-hidden />
            <span>{note ?? "החישוב הוא הערכה כללית בלבד ואינו הצעה של בנק, אישור עקרוני או ייעוץ. התנאים בפועל נקבעים על ידי הבנק."}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const fmt = (n: number, decimals: boolean) =>
  decimals ? String(n) : Math.round(n).toLocaleString("en-US");

/** Number input with thousand separators, numeric keyboard and clamping. Empty -> null. */
export function NumberField({ label, value, onChange, suffix, min = 0, max, decimals = false, hint, placeholder, optional }: {
  label: string; value: number | null; onChange: (v: number | null) => void; suffix?: string;
  min?: number; max?: number; decimals?: boolean; hint?: string; placeholder?: string; optional?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value === null ? "" : fmt(value, decimals));
  const commit = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    if (!cleaned) { onChange(null); return; }
    let n = Number(decimals ? cleaned : cleaned.replace(/\./g, ""));
    if (!Number.isFinite(n)) return;
    if (max !== undefined) n = Math.min(n, max);
    n = Math.max(n, min);
    onChange(n);
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}{optional && <span className="text-muted-foreground font-normal"> (לא חובה)</span>}
      </label>
      <div className="relative">
        <input id={id} inputMode={decimals ? "decimal" : "numeric"} dir="ltr" autoComplete="off" placeholder={placeholder}
          className="w-full h-12 rounded-xl border border-input bg-background px-3 pl-12 text-lg tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={shown}
          onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
          onBlur={() => setText(null)} />
        {suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function BigResult({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("font-display font-bold tabular-nums mt-1 leading-tight", value.length > 14 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl", tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "text-foreground")}>{value}</p>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function ResultGrid({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 mt-5">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-muted/40 p-3 min-w-0">
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className="font-display text-lg font-bold tabular-nums truncate">{i.value}</dd>
          {i.hint && <dd className="text-[11px] text-muted-foreground leading-snug">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Two horizontal bars: before vs after. */
export function BeforeAfter({ rows }: { rows: { label: string; before: number; after: number; fmt: (n: number) => string }[] }) {
  return (
    <div className="space-y-5">
      {rows.map((r) => {
        const max = Math.max(r.before, r.after, 1);
        return (
          <div key={r.label}>
            <p className="text-sm font-semibold mb-2">{r.label}</p>
            {[["היום", r.before, "hsl(215 50% 22%)"], ["אחרי", r.after, "hsl(186 72% 34%)"]].map(([l, v, c]) => (
              <div key={l as string} className="flex items-center gap-2 mb-1.5">
                <span className="w-10 text-xs text-muted-foreground shrink-0">{l}</span>
                <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden"><div className="h-full rounded-md" style={{ width: `${((v as number) / max) * 100}%`, background: c as string }} /></div>
                <span className="w-24 text-left text-sm tabular-nums shrink-0">{r.fmt(v as number)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
