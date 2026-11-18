// Balance report ("דוח יתרות לסילוק") extraction schema, normalisation and controls (#52).
// Pure TypeScript with no imports, shared by the edge function and unit tests.
//
// Principles:
// - The AI reads and points at evidence. Every number is parsed, checked and reconciled here, in code.
// - A value that was not found stays null. Nothing is guessed, rounded or turned into 0.
// - The payoff balance is not a substitute for principal. A negative fee is a credit line in the
//   report, never a grant to the client.
// - Document text is data. It is never treated as instructions (see PROMPT in the function).

export type Confidence = number; // 0..1
export interface Field<T> { value: T | null; page: number | null; label: string | null; raw: string | null; confidence: Confidence }
export interface Fee { kind: string; amount: Field<number> }
export type RateType = "fixed" | "variable" | "prime";
export type Linkage = "cpi" | "none" | "fx";
export type Amortization = "spitzer" | "equal_principal" | "balloon" | "other";

export interface ReportTrack {
  id: string;
  source_name: Field<string>;
  rate_type: Field<RateType>;
  linkage: Field<Linkage>;
  change_every_months: Field<number>;
  principal: Field<number>;
  linkage_on_principal: Field<number>;
  accrued_interest: Field<number>;
  linkage_on_interest: Field<number>;
  payoff_balance: Field<number>;
  fees: Fee[];
  current_rate: Field<number>;
  original_rate: Field<number>;
  adjusted_rate: Field<number>;
  anchor_rate: Field<number>;
  margin: Field<number>;
  amortization: Field<Amortization>;
  start_date: Field<string>;
  end_date: Field<string>;
  next_change_date: Field<string>;
  months_remaining: Field<number>;
  last_payment: Field<number>;
  forecast_interest: Field<number>;
  comparison_rate: Field<number>;
}

export interface BalanceReport {
  report_date: Field<string>;
  page_count: number | null;
  bank: Field<string>;
  totals: { principal: Field<number>; linkage: Field<number>; accrued_interest: Field<number>; payoff: Field<number>; fees: Field<number> };
  /** Fees stated once for the whole loan, kept apart from per-track fees and from the totals. */
  global_fees: Fee[];
  tracks: ReportTrack[];
}

export const TRACK_NUMBER_FIELDS = [
  "change_every_months", "principal", "linkage_on_principal", "accrued_interest", "linkage_on_interest", "payoff_balance",
  "current_rate", "original_rate", "adjusted_rate", "anchor_rate", "margin", "months_remaining",
  "last_payment", "forecast_interest", "comparison_rate",
] as const;
export const TRACK_DATE_FIELDS = ["start_date", "end_date", "next_change_date"] as const;
type NumKey = typeof TRACK_NUMBER_FIELDS[number];
type DateKey = typeof TRACK_DATE_FIELDS[number];

// ---------- primitive parsing ----------

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Parses a number as written in an Israeli report: "1,234.56", "₪ 1,234", "4.10%", "123.45-", "(123.45)". */
export function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[₪%\s‎‏]/g, "").replace(/[−–]/g, "-");
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/^-/.test(s)) { neg = !neg; s = s.slice(1); } else if (/-$/.test(s)) { neg = !neg; s = s.slice(0, -1); }
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

/** dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy, dd/mm/yy or ISO yyyy-mm-dd, to ISO date. Invalid dates are null. */
export function parseDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  let y: number, m: number, d: number;
  let r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; } else {
    r = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
    if (!r) return null;
    d = +r[1]; m = +r[2]; y = r[3].length === 2 ? 2000 + +r[3] : +r[3];
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || y < 1980 || y > 2100) return null;
  return dt.toISOString().slice(0, 10);
}

// ---------- RTL digit order in PDF text layers ----------

const NUM_TOKEN = /\d[\d.,/]*\d|\d/g;
const rev = (s: string) => [...s].reverse().join("");
/** A token that is only valid in one orientation tells us the page orientation. */
function orientation(tok: string): "ok" | "reversed" | "neutral" {
  const looksAmount = (t: string) => /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(t);
  const looksDate = (t: string) => parseDate(t) !== null && /[/.]/.test(t) && t.length >= 8;
  const okHere = looksAmount(tok) || looksDate(tok);
  const okRev = looksAmount(rev(tok)) || looksDate(rev(tok));
  if (okHere && !okRev) return "ok";
  if (okRev && !okHere) return "reversed";
  return "neutral";
}

/**
 * pdf.js text extraction of Hebrew pages often reverses digit runs ("600,000.00" -> "00.000,006").
 * Detects the orientation per page from unambiguous tokens (grouped amounts, dates) and repairs
 * every numeric token on a reversed page. Mixed signals make the page ambiguous: the caller must
 * not trust its numbers (fall back to reading the original file).
 */
export function repairRtlDigits(page: string): { text: string; reversed: boolean; ambiguous: boolean } {
  let ok = 0, reversed = 0;
  for (const m of page.matchAll(NUM_TOKEN)) {
    const o = orientation(m[0]);
    if (o === "ok") ok++; else if (o === "reversed") reversed++;
  }
  if (reversed && ok) return { text: page, reversed: false, ambiguous: true };
  if (!reversed) return { text: page, reversed: false, ambiguous: false };
  return { text: page.replace(NUM_TOKEN, (t) => rev(t)), reversed: true, ambiguous: false };
}

// ---------- normalisation of the model output ----------

const clamp01 = (n: unknown) => { const x = typeof n === "number" && Number.isFinite(n) ? n : 0; return Math.min(1, Math.max(0, x)); };
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
/** Long digit runs without grouping look like ID or account numbers. They are masked in stored evidence. */
export const redact = (s: string | null) => (s === null ? null : s.replace(/\d{7,}|\d{2,3}-\d{3,}-\d{3,}/g, (m) => "#".repeat(m.length)));

function field<T>(raw: unknown, parse: (v: unknown) => T | null, pageCount: number | null): Field<T> {
  const o = isObj(raw) ? raw : { value: raw };
  const value = o.value === undefined || o.value === null || o.value === "" ? null : parse(o.value);
  const p = typeof o.page === "number" && Number.isInteger(o.page) && o.page >= 1 && (pageCount === null || o.page <= pageCount) ? o.page : null;
  return {
    value,
    page: value === null ? null : p,
    label: value === null ? null : redact(str(o.label, 80)),
    raw: value === null ? null : redact(str(o.raw, 120)),
    confidence: value === null ? 0 : clamp01(o.confidence),
  };
}
const oneOf = <T extends string>(allowed: readonly T[]) => (v: unknown): T | null => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null);
const text = (max: number) => (v: unknown) => str(v, max);
const empty = <T>(): Field<T> => ({ value: null, page: null, label: null, raw: null, confidence: 0 });

function fees(raw: unknown, pageCount: number | null): Fee[] {
  return (Array.isArray(raw) ? raw : []).slice(0, 20).flatMap((f) => {
    if (!isObj(f)) return [];
    const amount = field(f.amount, parseNumber, pageCount);
    const kind = str(f.kind, 60);
    return amount.value === null || !kind ? [] : [{ kind, amount }];
  });
}

/**
 * Turns untrusted model output into a BalanceReport. When the page texts the model read are given,
 * evidence that does not appear on the cited page loses confidence (the control is in code, not in the prompt).
 */
export function normalizeReport(raw: unknown, pages?: string[]): BalanceReport {
  const r = isObj(raw) ? raw : {};
  const pc = typeof r.page_count === "number" && Number.isInteger(r.page_count) && r.page_count > 0 && r.page_count < 200 ? r.page_count : (pages?.length || null);
  const pageCount = pages?.length || pc;
  const t = isObj(r.totals) ? r.totals : {};
  const tracks: ReportTrack[] = (Array.isArray(r.tracks) ? r.tracks : []).slice(0, 12).filter(isObj).map((x, i) => {
    const tr: Record<string, unknown> = {
      id: str(x.id, 30) ?? `track-${i + 1}`,
      source_name: field(x.source_name, text(60), pageCount),
      rate_type: field(x.rate_type, oneOf(["fixed", "variable", "prime"] as const), pageCount),
      linkage: field(x.linkage, oneOf(["cpi", "none", "fx"] as const), pageCount),
      amortization: field(x.amortization, oneOf(["spitzer", "equal_principal", "balloon", "other"] as const), pageCount),
      fees: fees(x.fees, pageCount),
    };
    for (const k of TRACK_NUMBER_FIELDS) tr[k] = field(x[k], parseNumber, pageCount);
    for (const k of TRACK_DATE_FIELDS) tr[k] = field(x[k], parseDate, pageCount);
    return tr as unknown as ReportTrack;
  });
  const report: BalanceReport = {
    report_date: field(r.report_date, parseDate, pageCount),
    page_count: pageCount,
    bank: field(r.bank, text(40), pageCount),
    totals: {
      principal: field(t.principal, parseNumber, pageCount),
      linkage: field(t.linkage, parseNumber, pageCount),
      accrued_interest: field(t.accrued_interest, parseNumber, pageCount),
      payoff: field(t.payoff, parseNumber, pageCount),
      fees: field(t.fees, parseNumber, pageCount),
    },
    global_fees: fees(r.global_fees, pageCount),
    tracks,
  };
  if (pages?.length) verifyEvidence(report, pages);
  return report;
}

const compact = (s: string) => s.replace(/[\s‎‏]/g, "");
function eachField(report: BalanceReport, fn: (f: Field<unknown>, path: string) => void) {
  fn(report.report_date, "report_date"); fn(report.bank, "bank");
  for (const [k, f] of Object.entries(report.totals)) fn(f, `totals.${k}`);
  report.global_fees.forEach((g, i) => fn(g.amount, `global_fees.${i}`));
  report.tracks.forEach((t, i) => {
    for (const [k, f] of Object.entries(t)) if (isObj(f) && "confidence" in f) fn(f as unknown as Field<unknown>, `tracks.${i}.${k}`);
    t.fees.forEach((g, j) => fn(g.amount, `tracks.${i}.fees.${j}`));
  });
}
/** Evidence must be on the cited page. Numbers are compared digit-for-digit. */
function verifyEvidence(report: BalanceReport, pages: string[]) {
  eachField(report, (f) => {
    if (f.value === null) return;
    const page = f.page ? pages[f.page - 1] : null;
    const found = !!page && !!f.raw && compact(page).includes(compact(f.raw).replace(/#+/g, ""));
    if (!found) f.confidence = Math.min(f.confidence, 0.4);
  });
}

// ---------- controls ----------

export type Severity = "conflict" | "missing" | "info";
export interface Issue { code: string; severity: Severity; path: string; message: string }
export type ReportStatus = "complete" | "needs_completion" | "conflict";

/**
 * Reconciliation tolerance, in shekels: rounding of up to 1 ₪ per summed line, or 0.01% of the
 * total, whichever is larger. Anything above it is a conflict to resolve, not a rounding difference.
 */
export const tolerance = (total: number, lines: number) => Math.max(lines * 1, Math.abs(total) * 0.0001);
export const MIN_CONFIDENCE = 0.6;
/** Fields without which a track cannot be analysed. */
export const CRITICAL: (keyof ReportTrack)[] = ["rate_type", "linkage", "principal", "current_rate", "months_remaining"];
const LABEL: Record<string, string> = {
  rate_type: "סוג ריבית", linkage: "הצמדה", principal: "יתרת קרן", current_rate: "ריבית נוכחית", months_remaining: "חודשים שנותרו",
  linkage_on_principal: "הפרשי הצמדה על הקרן",
};
const sum = (xs: (number | null)[]) => (xs.every((x) => x !== null) ? (xs as number[]).reduce((a, b) => a + b, 0) : null);
const monthsBetween = (a: string, b: string) => {
  const [ya, ma, da] = a.split("-").map(Number), [yb, mb, db] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma) + (db - da) / 30;
};

export function checkReport(report: BalanceReport): { status: ReportStatus; issues: Issue[]; recheck: string[] } {
  const issues: Issue[] = [];
  const recheck = new Set<string>();
  const add = (code: string, severity: Severity, path: string, message: string) => issues.push({ code, severity, path, message });
  if (!report.tracks.length) add("no_tracks", "missing", "tracks", "לא זוהו מסלולים בדוח");
  const reportDate = report.report_date.value;

  report.tracks.forEach((t, i) => {
    const p = (k: string) => `tracks.${i}.${k}`;
    for (const k of CRITICAL) {
      const f = t[k] as Field<unknown>;
      if (f.value === null) add("missing_critical", "missing", p(k), `חסר: ${LABEL[k]}`);
      else if (f.confidence < MIN_CONFIDENCE) { add("low_confidence", "missing", p(k), `${LABEL[k]}: נדרש אימות מול הדוח`); recheck.add(p(k)); }
    }
    if (t.linkage.value === "cpi" && t.linkage_on_principal.value === null) add("linkage_unknown", "missing", p("linkage_on_principal"), "מסלול צמוד: חסרים הפרשי ההצמדה על הקרן");
    if (t.payoff_balance.value !== null && t.principal.value === null) add("payoff_not_principal", "info", p("principal"), "יתרה לסילוק אינה תחליף ליתרת הקרן");
    for (const k of ["current_rate", "original_rate", "adjusted_rate", "comparison_rate"] as const) {
      const v = t[k].value;
      if (v !== null && (v < -2 || v > 20)) { add("rate_out_of_range", "conflict", p(k), "ריבית מחוץ לטווח סביר"); recheck.add(p(k)); }
    }
    // The left/right columns of an RTL table: "מתן ההלוואה" is the original rate, "מועד החישוב" is current.
    if (t.current_rate.label && /מתן|מקורי|ביום ההלוואה/.test(t.current_rate.label)) {
      add("original_as_current", "conflict", p("current_rate"), "הריבית הנוכחית נלקחה מעמודת מתן ההלוואה");
      recheck.add(p("current_rate"));
    }
    if (t.original_rate.label && /החישוב|נוכחי|עדכני/.test(t.original_rate.label)) {
      add("current_as_original", "conflict", p("original_rate"), "הריבית המקורית נלקחה מעמודת מועד החישוב");
      recheck.add(p("original_rate"));
    }
    for (const k of ["principal", "payoff_balance", "accrued_interest", "months_remaining"] as const) {
      const v = t[k].value;
      if (v !== null && v < 0) { add("negative_value", "conflict", p(k), "ערך שלילי לא צפוי"); recheck.add(p(k)); }
    }
    t.fees.forEach((f, j) => {
      if ((f.amount.value ?? 0) < 0) add("negative_fee", "info", `${p("fees")}.${j}`, `${f.kind}: סכום שלילי בדוח. זה לא מענק ללקוח ולא מקטין עלות אחרת`);
    });
    // Payoff = principal + linkage + accrued interest + linkage on interest + track fees (positive fees only).
    // Linkage parts are 0 by definition only when the track is known to be unlinked; otherwise unknown stays unknown.
    const lz = (v: number | null) => (v === null && t.linkage.value === "none" ? 0 : v);
    const parts = [t.principal.value, lz(t.linkage_on_principal.value), t.accrued_interest.value, lz(t.linkage_on_interest.value)];
    const feeSum = t.fees.reduce((a, f) => a + Math.max(0, f.amount.value ?? 0), 0);
    const built = sum(parts);
    if (built !== null && t.payoff_balance.value !== null) {
      const diff = t.payoff_balance.value - built;
      const lines = parts.length + t.fees.length;
      if (Math.abs(diff) > tolerance(t.payoff_balance.value, lines) && Math.abs(diff - feeSum) > tolerance(t.payoff_balance.value, lines)) {
        add("payoff_mismatch", "conflict", p("payoff_balance"), "היתרה לסילוק אינה מתיישבת עם רכיבי המסלול");
        recheck.add(p("payoff_balance"));
      }
    }
    // Remaining months must agree with the end date (within one month). Months are never rounded here.
    if (t.end_date.value && reportDate && t.months_remaining.value !== null) {
      const m = monthsBetween(reportDate, t.end_date.value);
      if (Math.abs(m - t.months_remaining.value) > 1.5) { add("months_mismatch", "conflict", p("months_remaining"), "מספר החודשים שנותרו אינו תואם את מועד הסיום"); recheck.add(p("months_remaining")); }
    }
    if (t.start_date.value && reportDate && t.start_date.value > reportDate) add("start_after_report", "conflict", p("start_date"), "מועד מתן ההלוואה אחרי תאריך הדוח");
    if (t.next_change_date.value && reportDate && t.next_change_date.value < reportDate) add("change_date_past", "info", p("next_change_date"), "מועד השינוי הבא שחולץ כבר עבר");
  });

  // Track sums against the report totals.
  const n = report.tracks.length;
  const totalCheck = (key: "principal" | "accrued_interest" | "payoff", trackKey: "principal" | "accrued_interest" | "payoff_balance", name: string) => {
    const total = report.totals[key].value;
    const s = sum(report.tracks.map((t) => t[trackKey].value));
    if (total === null || s === null || !n) return;
    const globalPositive = report.global_fees.reduce((a, f) => a + Math.max(0, f.amount.value ?? 0), 0);
    const tol = tolerance(total, n + (key === "payoff" ? report.global_fees.length : 0));
    const ok = Math.abs(total - s) <= tol || (key === "payoff" && Math.abs(total - s - globalPositive) <= tol);
    if (!ok) { add("total_mismatch", "conflict", `totals.${key}`, `סכום ${name} במסלולים אינו תואם לסיכום הדוח`); recheck.add(`totals.${key}`); }
  };
  totalCheck("principal", "principal", "יתרות הקרן");
  totalCheck("accrued_interest", "accrued_interest", "הריבית שנצברה");
  totalCheck("payoff", "payoff_balance", "היתרות לסילוק");
  const lnk = report.totals.linkage.value, lnkSum = sum(report.tracks.map((t) => t.linkage_on_principal.value));
  if (lnk !== null && lnkSum !== null && n && Math.abs(lnk - lnkSum) > tolerance(lnk, n)) add("total_mismatch", "conflict", "totals.linkage", "סכום הפרשי ההצמדה אינו תואם לסיכום הדוח");
  report.global_fees.forEach((f, j) => { if ((f.amount.value ?? 0) < 0) add("negative_fee", "info", `global_fees.${j}`, `${f.kind}: סכום שלילי בדוח. זה לא מענק ללקוח`); });

  const status: ReportStatus = issues.some((x) => x.severity === "conflict") ? "conflict" : issues.some((x) => x.severity === "missing") ? "needs_completion" : "complete";
  return { status, issues, recheck: [...recheck] };
}

/** Path like "tracks.0.current_rate" or "totals.payoff" to the field in the report. */
export function getField(report: BalanceReport, path: string): Field<unknown> | null {
  const parts = path.split(".");
  let cur: unknown = report;
  for (const k of parts) { if (!cur || typeof cur !== "object") return null; cur = (cur as Record<string, unknown>)[k]; }
  return isObj(cur) && "confidence" in cur ? (cur as unknown as Field<unknown>) : null;
}

/**
 * A second reading answers only the fields under doubt. Agreement raises confidence; disagreement
 * clears the value (it stays unknown and goes to a professional check). Never picks a side.
 */
export function applyRecheck(report: BalanceReport, answers: Record<string, unknown>): BalanceReport {
  for (const [path, ans] of Object.entries(answers)) {
    const f = getField(report, path);
    if (!f || f.value === null) continue;
    const v = typeof f.value === "number" ? parseNumber(isObj(ans) ? ans.value : ans) : typeof f.value === "string" && /date/.test(path) ? parseDate(isObj(ans) ? ans.value : ans) : (isObj(ans) ? ans.value : ans);
    const same = typeof f.value === "number" && typeof v === "number" ? Math.abs(f.value - v) < 0.005 : v === f.value;
    if (same) f.confidence = Math.max(f.confidence, 0.9);
    else { f.value = null; f.page = null; f.label = null; f.raw = null; f.confidence = 0; }
  }
  return report;
}

/** The simple per-track view used by the first-look page. Unknown stays null. */
export type SimpleType = "prime" | "fixed_nl" | "fixed_l" | "var5" | "var_l" | "unknown";
export function simpleTracks(report: BalanceReport): { type: SimpleType; balance: number | null; rate: number | null; years: number | null; pages: number[] }[] {
  return report.tracks.map((t) => {
    const rt = t.rate_type.value, lk = t.linkage.value;
    const type: SimpleType = rt === "prime" ? "prime"
      : rt === "fixed" && lk === "cpi" ? "fixed_l" : rt === "fixed" && lk === "none" ? "fixed_nl"
      : rt === "variable" && lk === "cpi" ? "var_l" : rt === "variable" && lk === "none" ? "var5" : "unknown";
    const principal = t.principal.value;
    // Linked: the outstanding balance includes linkage differences; without them it is not known.
    const balance = principal === null ? null : lk === "cpi" ? (t.linkage_on_principal.value === null ? null : principal + t.linkage_on_principal.value) : principal;
    const months = t.months_remaining.value;
    const pages = [...new Set([t.principal.page, t.current_rate.page, t.months_remaining.page].filter((x): x is number => x !== null))];
    return { type, balance, rate: t.current_rate.value, years: months === null ? null : months / 12, pages };
  });
}

export const emptyField = empty;
