import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const nis = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${Math.round(n).toLocaleString("he-IL")} ₪`;
export const pct = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;
export const years = (months: number | null | undefined) =>
  !months || !Number.isFinite(months) ? "—" : months % 12 === 0 ? `${months / 12} שנים` : `${(months / 12).toFixed(1)} שנים`;
export const signedNis = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("he-IL")} ₪`;

/** Appends the selected case to dashboard links so every screen stays on the same case. */
export const withCase = (href: string, caseId?: string | null) =>
  caseId && href.startsWith("/dashboard") ? `${href}${href.includes("?") ? "&" : "?"}caseId=${caseId}` : href;

export function Section({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "default", estimate }: { label: string; value: string; hint?: string; tone?: "default" | "warn" | "good"; estimate?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 min-w-0">
      <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
      <p className={cn("font-display text-xl sm:text-2xl font-bold tabular-nums mt-1 truncate",
        tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : "text-foreground")}>
        {value}
      </p>
      {(hint || estimate) && <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">{estimate ? "הערכה" : ""}{estimate && hint ? " · " : ""}{hint}</p>}
    </div>
  );
}

export function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && href && <Link to={href} className="inline-block mt-3 text-sm font-semibold text-primary hover:underline">{cta}</Link>}
    </div>
  );
}

export function EstimateNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground mt-3 leading-relaxed">
      <Info size={14} className="shrink-0 mt-0.5" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Chart colors: navy / teal / gold / greys only. */
export const CHART = {
  navy: "hsl(215 50% 22%)",
  teal: "hsl(186 72% 34%)",
  gold: "hsl(40 70% 50%)",
  grey: "hsl(215 15% 70%)",
  light: "hsl(215 20% 90%)",
};
