// Per-track first look at an existing mortgage (balance check page). Pure and unit-tested.
// Rules (#52): unknown stays unknown (null), never 0. Linked tracks need a linkage review, so no
// monthly figure is computed for them from the rate alone. A rate gap is a reason to look further,
// never a verdict on the whole mortgage, and good terms are flagged as worth keeping.
import { pmt } from "@/lib/quickCheck";

export type BalanceTrackType = "prime" | "fixed_nl" | "fixed_l" | "var5" | "var_l" | "unknown";
export const BALANCE_TRACK_TYPES: Record<BalanceTrackType, { label: string; rateKey: string; linked: boolean }> = {
  prime: { label: "פריים", rateKey: "prime", linked: false },
  fixed_nl: { label: "קבועה לא צמודה", rateKey: "fixed_not_linked", linked: false },
  fixed_l: { label: "קבועה צמודה", rateKey: "fixed_linked", linked: true },
  var5: { label: "משתנה כל 5 לא צמודה", rateKey: "variable_5", linked: false },
  var_l: { label: "משתנה כל 5 צמודה", rateKey: "variable_5_linked", linked: true },
  /** Extraction could not tell the rate type or linkage. Never guessed; the user picks it. */
  unknown: { label: "סוג לא זוהה, נא לבחור", rateKey: "", linked: false },
};

/** A track as entered or extracted. null means "not known". */
export interface BalanceTrack { type: BalanceTrackType; balance: number | null; rate: number | null; years: number | null }

export type TrackStatus =
  | "incomplete" // a needed value is missing
  | "no_reference" // we have no reference rate for this track type
  | "linked_review" // linked track: rate gap shown, cost needs a linkage review
  | "worth_checking_strong"
  | "worth_checking"
  | "near_reference"
  | "keep_terms"; // the rate is clearly below the reference

export interface TrackResult {
  status: TrackStatus;
  /** Missing inputs, in Hebrew, for the incomplete status. */
  missing: string[];
  /** Current rate minus reference, in points. null when not comparable. */
  gap: number | null;
  /** Monthly payment difference in a scenario at the reference rate, same balance and term,
   * before prepayment fees and switching costs. null when not computed (unknown, linked, or no gap). */
  monthlyDiff: number | null;
}

const pos = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const STATUS_TEXT: Record<TrackStatus, string> = {
  incomplete: "חסרים נתונים לבדיקה",
  no_reference: "אין לנו נתון ייחוס אמין למסלול הזה",
  linked_review: "מסלול צמוד: נדרשת בחינת הצמדה",
  worth_checking_strong: "פער גדול מנתון הייחוס, כדאי לבדוק",
  worth_checking: "יש פער, כדאי לבדוק",
  near_reference: "הריבית קרובה לנתון הייחוס",
  keep_terms: "הריבית נמוכה מנתון הייחוס, תנאי שכדאי לשמור",
};

export function analyzeBalanceTrack(t: BalanceTrack, rates: Record<string, unknown> | null | undefined): TrackResult {
  const meta = BALANCE_TRACK_TYPES[t.type];
  const balance = pos(t.balance), rate = pos(t.rate), years = pos(t.years);
  const missing = [t.type === "unknown" && "סוג מסלול", balance === null && "יתרה", rate === null && "ריבית", years === null && "תקופה שנותרה"].filter(Boolean) as string[];
  if (missing.length) return { status: "incomplete", missing, gap: null, monthlyDiff: null };
  const ref = pos(rates?.[meta.rateKey]);
  if (ref === null) return { status: meta.linked ? "linked_review" : "no_reference", missing: [], gap: null, monthlyDiff: null };
  const gap = +(rate! - ref).toFixed(2);
  if (meta.linked) return { status: "linked_review", missing: [], gap, monthlyDiff: null };
  const monthlyDiff = gap > 0 ? pmt(balance!, rate!, years!) - pmt(balance!, ref, years!) : null;
  const status: TrackStatus = gap >= 0.8 ? "worth_checking_strong" : gap >= 0.3 ? "worth_checking" : gap <= -0.3 ? "keep_terms" : "near_reference";
  return { status, missing: [], gap, monthlyDiff };
}

export interface BalanceSummary {
  /** Sum of monthly differences we could compute, or null when none could be computed. */
  knownMonthlyDiff: number | null;
  /** Tracks we could not put a number on (missing data, linked, no reference). */
  notComputed: number;
  /** Tracks whose terms look worth keeping. */
  keep: number;
  /** Tracks with a gap worth checking. */
  worthChecking: number;
}

export function summarizeBalance(results: TrackResult[]): BalanceSummary {
  const diffs = results.map((r) => r.monthlyDiff).filter((v): v is number => v !== null);
  return {
    knownMonthlyDiff: diffs.length ? diffs.reduce((a, b) => a + b, 0) : null,
    notComputed: results.filter((r) => ["incomplete", "no_reference", "linked_review"].includes(r.status)).length,
    keep: results.filter((r) => r.status === "keep_terms").length,
    worthChecking: results.filter((r) => r.status === "worth_checking" || r.status === "worth_checking_strong").length,
  };
}

/** Text input to a known positive number or null. Decimals are kept (no rounding of terms). */
export const parseInput = (v: string): number | null => pos(v.replace(/,/g, ""));

/** Freshness of the reference data, per field. prime has its own stamp when the daily job updated it. */
export function referenceDates(rates: Record<string, unknown> | null | undefined): { prime: string | null; others: string | null } {
  const d = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);
  return { prime: d(rates?.prime_updated_at) ?? d(rates?.updated_at), others: d(rates?.updated_at) };
}

export const BALANCE_CHECK_STORE = "easymort_balance_check";
