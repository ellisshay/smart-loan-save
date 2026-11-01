// Track normalization: case_tracks rows, intake current_mortgage.tracks, tender offer tracks
// and quick-check mixes all become the same NormalizedTrack shape.
import { num, pmt, schedule } from "./amortization";

export type TrackKind = "prime" | "fixed_unlinked" | "fixed_linked" | "variable_unlinked" | "variable_linked" | "fx" | "other";

export const KIND_LABEL: Record<TrackKind, string> = {
  prime: "פריים",
  fixed_unlinked: "קבועה לא צמודה",
  fixed_linked: "קבועה צמודה",
  variable_unlinked: "משתנה לא צמודה",
  variable_linked: "משתנה צמודה",
  fx: "צמודת מט״ח",
  other: "אחר",
};

/** Calm, non-rainbow palette: navy / teal / gold / greys. */
export const KIND_COLOR: Record<TrackKind, string> = {
  prime: "hsl(186 72% 34%)",
  fixed_unlinked: "hsl(215 50% 22%)",
  fixed_linked: "hsl(215 30% 45%)",
  variable_unlinked: "hsl(40 70% 50%)",
  variable_linked: "hsl(40 45% 68%)",
  fx: "hsl(215 15% 62%)",
  other: "hsl(215 12% 78%)",
};

export interface NormalizedTrack {
  kind: TrackKind;
  label: string;          // original label when available
  amount: number;         // principal / balance
  rate: number;           // annual nominal %, excluding CPI
  months: number;         // remaining months
  linked: boolean;        // CPI-linked
  variable: boolean;      // rate can change (prime / variable)
  firstPayment?: number;  // when reported by the bank
  exitDate?: string;      // next exit / reset date when known
}

const hasLinkedWord = (s: string) => /צמוד/.test(s) && !/לא\s*צמוד/.test(s);

/** Classifies a track from free text plus optional structured hints. Unknown -> "other". */
export function classifyTrack(type: string, hints: { indexed?: unknown; indexation?: string; rateType?: string } = {}): TrackKind {
  const t = (type || "").trim().toLowerCase();
  const ix = (hints.indexation || "").trim();
  const indexedFlag = hints.indexed === true || hints.indexed === "yes";
  const linked = indexedFlag || ix === "צמוד מדד" || hasLinkedWord(t) || t === "fixed_linked";
  if (/פריים|prime/.test(t)) return "prime";
  if (/מט["״']?ח|dollar|דולר|יורו|fx/.test(t) || /מט["״']?ח/.test(ix)) return "fx";
  if (/משתנה|variable/.test(t) && !/קבוע/.test(t)) return linked ? "variable_linked" : "variable_unlinked";
  if (/קבוע|fixed|קל"צ|קל״צ/.test(t)) return linked ? "fixed_linked" : "fixed_unlinked";
  if (t === "variable_5") return "variable_unlinked";
  if (hints.rateType === "משתנה") return linked ? "variable_linked" : "variable_unlinked";
  if (hints.rateType === "קבועה") return linked ? "fixed_linked" : "fixed_unlinked";
  return "other";
}

const make = (kind: TrackKind, label: string, amount: unknown, rate: unknown, months: unknown, extra: Partial<NormalizedTrack> = {}): NormalizedTrack => ({
  kind, label: label || KIND_LABEL[kind], amount: num(amount), rate: num(rate), months: Math.round(num(months)),
  linked: kind === "fixed_linked" || kind === "variable_linked",
  variable: kind === "prime" || kind === "variable_linked" || kind === "variable_unlinked",
  ...extra,
});

/** Rows from the case_tracks table (refinance). */
export function fromCaseTrackRows(rows: any[] | null | undefined): NormalizedTrack[] {
  return (rows || []).map((r) => {
    const kind = classifyTrack(String(r.track_type || ""), { indexed: r.is_indexed });
    const months = num(r.remaining_months) || num(r.remaining_years) * 12;
    return make(kind, String(r.track_type || ""), r.principal_balance, r.interest_rate, months, { exitDate: r.exit_date || undefined });
  }).filter((t) => t.amount > 0);
}

/** intake_data.current_mortgage.tracks (refinance, before the normalized table existed). */
export function fromIntakeTracks(tracks: any[] | null | undefined): NormalizedTrack[] {
  return (tracks || []).map((t) => {
    const kind = classifyTrack(String(t.trackType || ""), { indexed: t.isIndexed });
    return make(kind, String(t.trackType || ""), t.principalBalance, t.interestRate, num(t.remainingYears) * 12, { exitDate: t.exitDate || undefined });
  }).filter((t) => t.amount > 0);
}

/** Tracks of a tender offer: {type, amount, months, rate, rate_type, indexation, first_payment}. */
export function fromOfferTracks(tracks: any[] | null | undefined): NormalizedTrack[] {
  return (tracks || []).map((t) => {
    const kind = classifyTrack(String(t.type || ""), { indexation: t.indexation, rateType: t.rate_type });
    return make(kind, String(t.type || ""), t.amount, t.rate, t.months, { firstPayment: num(t.first_payment) || undefined });
  }).filter((t) => t.amount > 0);
}

/** Quick-check mix tracks ({key, amount, years, rate}); rate there already includes CPI for linked tracks. */
export function fromMixTracks(tracks: any[] | null | undefined, cpi = 0): NormalizedTrack[] {
  return (tracks || []).map((t) => {
    const kind = classifyTrack(String(t.key || ""));
    const rate = kind === "fixed_linked" ? Math.max(num(t.rate) - num(cpi), 0) : num(t.rate);
    return make(kind, KIND_LABEL[kind], t.amount, rate, num(t.years) * 12);
  }).filter((t) => t.amount > 0);
}

/** Rate used for cost estimates: CPI-linked tracks add the expected annual CPI. */
export const effectiveRate = (t: NormalizedTrack, cpi: number) => t.rate + (t.linked ? num(cpi) : 0);

export interface TrackSummary {
  total: number;
  byKind: { kind: TrackKind; label: string; amount: number; share: number; color: string }[];
  variableShare: number;
  linkedShare: number;
  kinds: number;
  weightedRate: number;     // excluding CPI
  maxMonths: number;
  monthly: number;          // estimated current monthly payment (CPI not compounded)
  monthlyWithoutCpi: number;
}

export function summarizeTracks(tracks: NormalizedTrack[], cpi = 0): TrackSummary | null {
  const valid = tracks.filter((t) => t.amount > 0);
  const total = valid.reduce((s, t) => s + t.amount, 0);
  if (!total) return null;
  const map = new Map<TrackKind, number>();
  valid.forEach((t) => map.set(t.kind, (map.get(t.kind) || 0) + t.amount));
  const byKind = [...map.entries()].sort((a, b) => b[1] - a[1])
    .map(([kind, amount]) => ({ kind, label: KIND_LABEL[kind], amount, share: amount / total, color: KIND_COLOR[kind] }));
  const share = (pred: (t: NormalizedTrack) => boolean) => valid.filter(pred).reduce((s, t) => s + t.amount, 0) / total;
  const monthlyOf = (withCpi: boolean) => valid.reduce((s, t) =>
    s + (t.firstPayment && withCpi ? t.firstPayment : pmt(t.amount, withCpi ? effectiveRate(t, cpi) : t.rate, t.months)), 0);
  return {
    total, byKind,
    variableShare: share((t) => t.variable),
    linkedShare: share((t) => t.linked),
    kinds: map.size,
    weightedRate: valid.reduce((s, t) => s + t.rate * t.amount, 0) / total,
    maxMonths: Math.max(...valid.map((t) => t.months)),
    monthly: monthlyOf(true),
    monthlyWithoutCpi: monthlyOf(false),
  };
}

/** Combined yearly balance/interest projection across tracks (estimate; CPI as a flat rate add-on). */
export function projectTracks(tracks: NormalizedTrack[], cpi = 0) {
  const scheds = tracks.filter((t) => t.amount > 0 && t.months > 0).map((t) => schedule(t.amount, effectiveRate(t, cpi), t.months));
  const years = Math.max(0, ...scheds.map((s) => s.points[s.points.length - 1]?.year || 0));
  const points = Array.from({ length: years + 1 }, (_, y) => {
    let balance = 0, interestPaid = 0, principalPaid = 0;
    scheds.forEach((s) => {
      const p = s.points.find((q) => q.year === y) || (y === 0 ? s.points[0] : s.points[s.points.length - 1]);
      const ended = y > (s.points[s.points.length - 1]?.year || 0);
      balance += ended ? 0 : p.balance;
      interestPaid += p.interestPaid;
      principalPaid += p.principalPaid;
    });
    return { year: y, balance, interestPaid, principalPaid };
  });
  return {
    points,
    totalInterest: scheds.reduce((s, x) => s + x.totalInterest, 0),
    totalPrincipal: scheds.reduce((s, x) => s + (x.totalPaid - x.totalInterest), 0),
    months: Math.max(0, ...scheds.map((s) => s.months)),
  };
}

/** First-month split of the estimated payment into principal / interest / CPI effect (linked tracks). */
export function firstMonthSplit(tracks: NormalizedTrack[], cpi = 0) {
  let principal = 0, interest = 0, index = 0;
  for (const t of tracks.filter((x) => x.amount > 0 && x.months > 0)) {
    const payment = pmt(t.amount, effectiveRate(t, cpi), t.months);
    const i = (t.amount * t.rate) / 1200;
    const c = t.linked ? (t.amount * num(cpi)) / 1200 : 0;
    interest += i; index += c; principal += Math.max(0, payment - i - c);
  }
  return { principal, interest, index };
}
