// Quick-check estimation logic (pure, unit-tested).
import { schedule } from "@/lib/mortgage/amortization";

/** Market reference rates. A missing or non-positive value means "unknown", never zero. */
export interface Rates {
  prime: number | null;
  fixed_not_linked: number | null;
  fixed_linked: number | null;
  variable_5: number | null;
  cpi_annual?: number | null;
}
export type TrackKey = "prime" | "fixed_not_linked" | "fixed_linked" | "variable_5";
export const TRACK_LABEL: Record<TrackKey, string> = {
  prime: "פריים",
  fixed_not_linked: "קבועה לא צמודה",
  fixed_linked: "קבועה צמודה",
  variable_5: "משתנה כל 5 שנים",
};
/** Tracks whose rate can change during the loan. */
export const VARIABLE_KEYS: readonly TrackKey[] = ["prime", "variable_5"];
/** Tracks whose principal is linked to the CPI. */
export const LINKED_KEYS: readonly TrackKey[] = ["fixed_linked"];

/** rate: effective nominal rate (for linked tracks: the track rate plus the CPI assumption). */
export interface MixTrack { key: TrackKey; amount: number; years: number; rate: number }
export type Exposure = "נמוך" | "בינוני" | "גבוה";
export interface Mix {
  /** Exposure to rate and CPI changes, from the mix composition only. Never from cost or sort order. */
  risk: Exposure;
  name: string;
  tracks: MixTrack[];
  /** First monthly payment. */
  monthly: number;
  /** Total nominal payments, including CPI indexation of linked principal under the stated assumption. */
  total: number;
  /** Share of the loan in variable-rate tracks plus half the CPI-linked share (0..1). */
  exposure: number;
  /** First monthly payment if every variable-rate track were 2 points higher from the start. */
  stressMonthly: number;
}

export const STRESS_RATE_POINTS = 2;

export const pmt = (balance: number, annualRate: number, years: number) => {
  const n = years * 12, m = annualRate / 1200;
  if (n <= 0) return 0;
  return m ? (balance * m) / (1 - Math.pow(1 + m, -n)) : balance / n;
};

const known = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};
/** CPI may legitimately be 0 or negative, but it must be a number to be used. */
const knownCpi = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Which inputs a mix of these tracks would need that are missing. */
export function missingRates(keys: readonly TrackKey[], r: Rates | null | undefined): string[] {
  const out: string[] = [];
  for (const k of keys) if (known(r?.[k]) === null) out.push(TRACK_LABEL[k]);
  if (keys.some((k) => LINKED_KEYS.includes(k)) && knownCpi(r?.cpi_annual) === null) out.push("הנחת מדד");
  return out;
}

/**
 * Effective nominal rate for a track, or null when it can't be known.
 * Linked tracks need a CPI assumption; without it the result is null, not the bare rate.
 */
export function effectiveRate(key: TrackKey, r: Rates | null | undefined): number | null {
  const base = known(r?.[key]);
  if (base === null) return null;
  if (!LINKED_KEYS.includes(key)) return base;
  const cpi = knownCpi(r?.cpi_annual);
  return cpi === null ? null : base + cpi;
}

const SHARES: Record<string, { name: string; shares: Partial<Record<TrackKey, number>> }> = {
  a: { name: "תמהיל יציב", shares: { fixed_not_linked: 0.5, fixed_linked: 0.2, prime: 0.3 } },
  b: { name: "תמהיל מאוזן", shares: { fixed_not_linked: 0.34, prime: 0.33, variable_5: 0.33 } },
  c: { name: "תמהיל גמיש", shares: { prime: 0.5, variable_5: 0.3, fixed_not_linked: 0.2 } },
};

/** Exposure score from composition: variable share + half the linked share. */
export function compositionExposure(tracks: { key: TrackKey; amount: number }[]): number {
  const tot = tracks.reduce((a, t) => a + t.amount, 0);
  if (!(tot > 0)) return 0;
  const share = (keys: readonly TrackKey[]) => tracks.filter((t) => keys.includes(t.key)).reduce((a, t) => a + t.amount, 0) / tot;
  return share(VARIABLE_KEYS) + share(LINKED_KEYS) * 0.5;
}
/** Absolute thresholds, so a label never depends on which other mixes are shown. */
export const exposureLabel = (score: number): Exposure => (score < 0.45 ? "נמוך" : score < 0.7 ? "בינוני" : "גבוה");

function costTracks(tracks: MixTrack[], r: Rates, rateDelta = 0) {
  const cpi = knownCpi(r.cpi_annual) ?? 0;
  let monthly = 0, total = 0;
  for (const t of tracks) {
    const linked = LINKED_KEYS.includes(t.key);
    const delta = VARIABLE_KEYS.includes(t.key) ? rateDelta : 0;
    // Linked tracks: the track rate applies to a principal indexed monthly by the CPI assumption.
    const s = schedule(t.amount, (linked ? t.rate - cpi : t.rate) + delta, t.years * 12, 0, linked ? cpi : 0);
    monthly += s.monthly; total += s.totalPaid;
  }
  return { monthly, total };
}

/**
 * Example mixes from market reference rates. A mix that needs a rate we don't have is left out
 * (use missingRates to tell the user why), never priced with a zero rate.
 */
export function buildMixes(loan: number, years: number, rates: Rates | null | undefined): Mix[] {
  if (!rates || !(loan > 0) || !(years > 0)) return [];
  const out: Mix[] = [];
  for (const { name, shares } of Object.values(SHARES)) {
    const entries = Object.entries(shares) as [TrackKey, number][];
    const tracks: MixTrack[] = [];
    let ok = true;
    for (const [key, s] of entries) {
      const rate = effectiveRate(key, rates);
      if (rate === null) { ok = false; break; }
      tracks.push({ key, amount: Math.round(loan * s), years, rate });
    }
    if (!ok) continue;
    const base = costTracks(tracks, rates);
    const stress = costTracks(tracks, rates, STRESS_RATE_POINTS);
    const exposure = compositionExposure(tracks);
    out.push({ name, tracks, monthly: base.monthly, total: base.total, exposure, risk: exposureLabel(exposure), stressMonthly: stress.monthly });
  }
  // Display order: by exposure, lowest first. Cost plays no part in order or label.
  return out.sort((x, y) => x.exposure - y.exposure);
}

export type Grade = "מצוין" | "אפשרי" | "גבולי";
export const ltvGrade = (ltv: number): Grade => (ltv <= 60 ? "מצוין" : ltv <= 75 ? "אפשרי" : "גבולי");
export const dtiGrade = (dti: number): Grade => (dti <= 30 ? "מצוין" : dti <= 40 ? "אפשרי" : "גבולי");
