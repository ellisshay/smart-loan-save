import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrackSummary } from "@/lib/mortgage/tracks";
import { CHART, nis, pct } from "./primitives";

const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`);

/** A. Track breakdown donut with an accessible legend (amount + percent). */
export function TrackDonut({ summary }: { summary: TrackSummary }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-40 h-40 shrink-0" dir="ltr" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={summary.byKind} dataKey="amount" nameKey="label" innerRadius="62%" outerRadius="100%" paddingAngle={1} stroke="none" isAnimationActive={false}>
              {summary.byKind.map((k) => <Cell key={k.kind} fill={k.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2">
        {summary.byKind.map((k) => (
          <li key={k.kind} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: k.color }} aria-hidden />
            <span className="flex-1 min-w-0 text-foreground">{k.label}</span>
            <span className="tabular-nums text-muted-foreground whitespace-nowrap">{nis(k.amount)}</span>
            <span className="tabular-nums font-semibold w-12 text-left">{pct(k.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** D. Projected remaining balance per year. */
export function BalanceChart({ points, height = 200 }: { points: { year: number; balance: number }[]; height?: number }) {
  return (
    <div style={{ height }} dir="ltr" role="img" aria-label="תחזית יתרת המשכנתא לאורך השנים">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART.teal} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.light} vertical={false} />
          <XAxis dataKey="year" reversed tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(y) => (y === 0 ? "היום" : `${y}`)} interval="preserveStartEnd" minTickGap={16} />
          <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={short} width={40} />
          <Tooltip formatter={(v: number) => [nis(v), "יתרה משוערת (נומינלית)"]} labelFormatter={(y) => (y === 0 ? "היום" : `בעוד ${y} שנים`)} />
          <Area type="monotone" dataKey="balance" stroke={CHART.teal} strokeWidth={2} fill="url(#balFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * E. What the mortgage costs over its life: principal / interest / CPI linkage, plus the total.
 * Interest and linkage are shown separately: linkage is not interest.
 */
export function CostBreakdown({ principal, interest, indexation, extra = 0 }: { principal: number; interest: number; indexation: number; extra?: number }) {
  const parts = [
    { label: "קרן", value: principal, color: CHART.navy },
    { label: "ריבית (הערכה)", value: interest, color: CHART.teal },
    ...(indexation > 0.5 ? [{ label: "הצמדה למדד (הערכה)", value: indexation, color: CHART.gold }] : []),
    ...(extra > 0.5 ? [{ label: "עלויות נוספות", value: extra, color: CHART.grey }] : []),
  ];
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return null;
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden" role="img" aria-label={parts.map((p) => `${p.label} ${nis(p.value)}`).join(", ")}>
        {parts.map((p) => <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
        {parts.map((p) => (
          <div key={p.label}><dt className="text-muted-foreground"><span className="inline-block w-2.5 h-2.5 rounded-sm ml-1.5" style={{ background: p.color }} />{p.label}</dt><dd className="font-bold tabular-nums">{nis(p.value)}</dd></div>
        ))}
        <div className="col-span-2 sm:col-span-4 border-t border-border pt-2 flex justify-between"><dt className="font-semibold">עלות כוללת משוערת</dt><dd className="font-bold tabular-nums">{nis(total)}</dd></div>
      </dl>
    </div>
  );
}

/** B. First-month payment split: principal / interest / payment uplift from CPI linkage. */
export function PaymentBreakdown({ principal, interest, index }: { principal: number; interest: number; index: number }) {
  const rows = [
    { label: "החזר קרן", value: principal, color: CHART.navy },
    { label: "ריבית", value: interest, color: CHART.teal },
    ...(index > 0.5 ? [{ label: "תוספת להחזר בגלל ההצמדה (הערכה)", value: index, color: CHART.gold }] : []),
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return null;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm mb-1"><span>{r.label}</span><span className="tabular-nums font-semibold">{nis(r.value)}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} /></div>
        </li>
      ))}
    </ul>
  );
}
