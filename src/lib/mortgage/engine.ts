// Shared mortgage engine for existing and new mortgages (#52 stages 3 and 4). Pure and unit-tested.
//
// Rules:
// - Monthly cash flow per track: CPI indexation of linked principal, rate changes for prime (from the first
//   month) and for reset tracks (at the next change date, then at every reset).
// - Every alternative is compared with the baseline: the existing mortgage continued as is.
// - Assumptions are explicit and returned with every result.
// - Unknown one-off costs (prepayment fees, switching costs) keep the result incomplete. They are never 0.
// - A lower payment that comes from a longer term is never called a saving.
// - Exposure and stress, not price, describe risk.
import { pmt } from "./amortization";
import { dtiBand, LTV_CAP, type DtiBand, type Purpose } from "./affordability";

export type RateBehavior = "fixed" | "prime" | "reset";
export interface EngineTrack {
  id: string;
  label: string;
  /** Outstanding principal including linkage differences (for linked tracks). */
  balance: number;
  /** Current annual rate in %. For linked tracks this is the rate on top of CPI. */
  rate: number;
  /** Remaining months. Fractions are kept in the input; the schedule pays ceil(months) instalments. */
  months: number;
  linked: boolean;
  behavior: RateBehavior;
  /** Reset tracks: months between rate changes, and months from now to the next change. null = unknown. */
  resetEveryMonths?: number | null;
  nextResetMonth?: number | null;
  /** Prepayment fee to repay this whole track now. null = unknown, 0 = known to be zero. */
  prepaymentFee?: number | null;
}

export interface Assumptions {
  /** Annual CPI % applied to linked principal. */
  cpiAnnual: number;
  /** Points added to prime tracks from the first month. */
  primeShift: number;
  /** Points added to reset tracks from their next reset. */
  resetShift: number;
}
export const BASE_ASSUMPTIONS = (cpiAnnual: number): Assumptions => ({ cpiAnnual, primeShift: 0, resetShift: 0 });
/** Stress test: variable rates +2 points, CPI +1 point above the base assumption. */
export const STRESS = { rate: 2, cpi: 1 } as const;
/** Stress is read over the first five years: prime moves at once, 5-year tracks at their first reset,
 * and CPI drift of a linked track over decades does not pass for rate risk. */
export const STRESS_WINDOW = 61;
export const stressOf = (a: Assumptions): Assumptions => ({ cpiAnnual: a.cpiAnnual + STRESS.cpi, primeShift: a.primeShift + STRESS.rate, resetShift: a.resetShift + STRESS.rate });

export interface MonthRow { month: number; payment: number; interest: number; principal: number; indexation: number; balance: number }
export interface PlanResult {
  rows: MonthRow[];
  firstPayment: number;
  maxPayment: number;
  /** Highest payment in the first STRESS_WINDOW months: the horizon used for stress and fit. */
  peakPayment: number;
  months: number;
  totalInterest: number;
  totalIndexation: number;
  /** Everything paid from now: principal + interest + indexation (no one-off costs). */
  totalPaid: number;
  /** Interest + indexation: the cost of the money from now on. */
  financeCost: number;
  /** Assumptions the engine had to make, in Hebrew. */
  notes: string[];
}

const MAX_MONTHS = 480;
const monthlyFactor = (cpi: number) => Math.pow(1 + cpi / 100, 1 / 12);

/** Month-by-month cash flow of one track. */
export function trackRows(t: EngineTrack, a: Assumptions, notes?: Set<string>): MonthRow[] {
  const n = Math.min(MAX_MONTHS, Math.ceil(Math.max(0, t.months)));
  if (!(t.balance > 0) || !n) return [];
  const f = t.linked ? monthlyFactor(a.cpiAnnual) : 1;
  let firstChange = 1;
  if (t.behavior === "reset") {
    if (t.nextResetMonth && t.nextResetMonth > 0) firstChange = Math.ceil(t.nextResetMonth);
    else notes?.add(`${t.label}: מועד שינוי הריבית לא ידוע. בתרחיש שינוי ריבית הנחנו שהוא חל כבר מהחודש הראשון.`);
  }
  const rateAt = (m: number) => {
    if (t.behavior === "prime") return Math.max(0, t.rate + a.primeShift);
    if (t.behavior === "reset" && m >= firstChange) return Math.max(0, t.rate + a.resetShift);
    return t.rate;
  };
  const rows: MonthRow[] = [];
  let bal = t.balance;
  for (let m = 1; m <= n && bal > 0.005; m++) {
    const indexation = bal * (f - 1);
    bal += indexation;
    const r = rateAt(m);
    const payment = pmt(bal, r, n - m + 1); // re-amortised every month: exact for an annuity, follows rate and CPI
    const interest = bal * (r / 1200);
    const principal = Math.min(bal, payment - interest);
    bal -= principal;
    rows.push({ month: m, payment: principal + interest, interest, principal, indexation, balance: Math.max(bal, 0) });
  }
  return rows;
}

/** Monthly cash flow of a whole mortgage. */
export function runPlan(tracks: EngineTrack[], a: Assumptions): PlanResult {
  const notes = new Set<string>();
  const per = tracks.map((t) => trackRows(t, a, notes));
  const months = Math.max(0, ...per.map((r) => r.length));
  const rows: MonthRow[] = Array.from({ length: months }, (_, i) => {
    const row = { month: i + 1, payment: 0, interest: 0, principal: 0, indexation: 0, balance: 0 };
    for (const r of per) { const x = r[i]; if (x) { row.payment += x.payment; row.interest += x.interest; row.principal += x.principal; row.indexation += x.indexation; row.balance += x.balance; } }
    return row;
  });
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const totalIndexation = rows.reduce((s, r) => s + r.indexation, 0);
  const totalPaid = rows.reduce((s, r) => s + r.payment, 0);
  if (tracks.some((t) => t.linked)) notes.add(`הצמדה למדד: הנחת מדד שנתית קבועה של ${a.cpiAnnual}%.`);
  return {
    rows, months, totalInterest, totalIndexation, totalPaid, financeCost: totalInterest + totalIndexation,
    firstPayment: rows[0]?.payment ?? 0, maxPayment: Math.max(0, ...rows.map((r) => r.payment)),
    peakPayment: Math.max(0, ...rows.slice(0, STRESS_WINDOW).map((r) => r.payment)), notes: [...notes],
  };
}

// ---------- alternatives for an existing mortgage ----------

export type AlternativeKind = "baseline" | "shorten" | "extend" | "prepay" | "refi_partial" | "refi_full" | "reduce_exposure";
export type Outcome = "baseline" | "lower_total_cost" | "lower_payment_higher_total" | "higher_cost" | "no_change" | "incomplete";
export interface NewTrackSpec { rate: number | null; behavior: RateBehavior; linked: boolean; months?: number }
export interface Alternative {
  kind: AlternativeKind;
  title: string;
  tracks: EngineTrack[];
  /** Known one-off costs (fees, switching costs). null when any part is unknown. */
  oneOffCosts: number | null;
  /** Lump sum paid now from savings (prepayment). It is the client's money, not a cost. */
  lumpSum: number;
  missing: string[];
}
export interface Evaluated extends Alternative {
  base: PlanResult;
  stress: PlanResult;
  /** financeCost + oneOffCosts; null while one-off costs are unknown. */
  totalCost: number | null;
  vsBaseline: {
    firstPayment: number;
    months: number;
    /** totalCost difference (negative = cheaper over the life of the loan). null when not computable. */
    totalCost: number | null;
    /** Change in the stress-test peak payment (first five years). */
    stressPeakPayment: number;
    /** When one-off costs are unknown: the increase in total cost before them. Costs are never negative,
     * so the true increase is at least this. null when it is not an increase. */
    totalCostAtLeast: number | null;
    /** Months until a lower payment repays the one-off costs. null when not applicable or unknown. */
    breakEvenMonths: number | null;
  };
  outcome: Outcome;
  extendsTerm: boolean;
}

const sumKnown = (xs: (number | null | undefined)[]) => (xs.some((x) => x === null || x === undefined) ? null : (xs as number[]).reduce((s, x) => s + x, 0));
const clone = (t: EngineTrack, patch: Partial<EngineTrack>): EngineTrack => ({ ...t, ...patch });

export const baselineAlt = (tracks: EngineTrack[]): Alternative => ({ kind: "baseline", title: "המשך המשכנתה הקיימת", tracks, oneOffCosts: 0, lumpSum: 0, missing: [] });

/** Change the remaining term of every track by deltaMonths (negative shortens). */
export function changeTerm(tracks: EngineTrack[], deltaMonths: number): Alternative {
  const longer = deltaMonths > 0;
  return {
    kind: longer ? "extend" : "shorten",
    title: longer ? `הארכת התקופה ב־${Math.round(deltaMonths / 12)} שנים` : `קיצור התקופה ב־${Math.round(-deltaMonths / 12)} שנים`,
    // Changing the term at the same bank usually means a new loan agreement; fees are set by the bank.
    tracks: tracks.map((t) => clone(t, { months: Math.min(360, Math.max(12, t.months + deltaMonths)) })),
    oneOffCosts: null, lumpSum: 0,
    missing: ["עלות שינוי התקופה בבנק"],
  };
}

/** Pay a lump sum now, most expensive track first. mode "term" keeps the payment, "payment" keeps the term. */
export function prepay(tracks: EngineTrack[], amount: number, mode: "term" | "payment", cpiAnnual: number): Alternative {
  let left = Math.max(0, amount);
  const order = [...tracks].sort((x, y) => (y.rate + (y.linked ? cpiAnnual : 0)) - (x.rate + (x.linked ? cpiAnnual : 0)));
  const paid = new Map<string, number>();
  for (const t of order) { const p = Math.min(left, t.balance); if (p > 0) paid.set(t.id, p); left -= p; }
  const fees: (number | null)[] = [];
  const next = tracks.flatMap((t) => {
    const p = paid.get(t.id) ?? 0;
    if (!p) return [t];
    // Fee for a partial prepayment, pro rata to the share of the track repaid.
    fees.push(t.prepaymentFee === null || t.prepaymentFee === undefined ? null : t.prepaymentFee * (p / t.balance));
    const balance = t.balance - p;
    if (balance <= 0.5) return [];
    if (mode === "payment") return [clone(t, { balance, prepaymentFee: t.prepaymentFee == null ? t.prepaymentFee : t.prepaymentFee * (balance / t.balance) })];
    // Keep the payment: solve the shorter term for the lower balance at the current rate.
    const before = pmt(t.balance, t.rate, Math.ceil(t.months));
    let m = Math.ceil(t.months);
    while (m > 1 && pmt(balance, t.rate, m - 1) <= before + 0.005) m--;
    return [clone(t, { balance, months: m, prepaymentFee: t.prepaymentFee == null ? t.prepaymentFee : t.prepaymentFee * (balance / t.balance) })];
  });
  const oneOff = sumKnown(fees);
  return {
    kind: "prepay", title: mode === "term" ? "פירעון חלקי וקיצור התקופה" : "פירעון חלקי והקטנת ההחזר",
    tracks: next, oneOffCosts: oneOff, lumpSum: amount - left,
    missing: oneOff === null ? ["עמלת פירעון מוקדם"] : [],
  };
}

/**
 * Refinance the selected tracks into one new track (same total balance). switchingCosts covers bank,
 * appraisal and legal costs; null = unknown. The new rate is a scenario input, not an offer.
 */
export function refinance(tracks: EngineTrack[], ids: string[] | "all", spec: NewTrackSpec, switchingCosts: number | null, kind?: AlternativeKind): Alternative {
  const moving = tracks.filter((t) => ids === "all" || ids.includes(t.id));
  const staying = tracks.filter((t) => !moving.includes(t));
  const balance = moving.reduce((s, t) => s + t.balance, 0);
  const months = spec.months ?? Math.round(moving.reduce((s, t) => s + t.months * t.balance, 0) / (balance || 1));
  const missing: string[] = [];
  if (spec.rate === null) missing.push("ריבית ייחוס למסלול החדש");
  const fees = sumKnown(moving.map((t) => t.prepaymentFee));
  if (fees === null) missing.push("עמלת פירעון מוקדם");
  if (switchingCosts === null) missing.push("עלויות מעבר (שמאות, פתיחת תיק, משפטיות)");
  const fresh: EngineTrack = {
    id: "new", label: "מסלול חדש (תרחיש)", balance, rate: spec.rate ?? 0, months, linked: spec.linked, behavior: spec.behavior,
    resetEveryMonths: spec.behavior === "reset" ? 60 : null, nextResetMonth: spec.behavior === "reset" ? 60 : null, prepaymentFee: null,
  };
  const all = ids === "all" || !staying.length;
  return {
    kind: kind ?? (all ? "refi_full" : "refi_partial"),
    title: kind === "reduce_exposure" ? "הקטנת החשיפה לריבית משתנה" : all ? "מחזור מלא (תרחיש)" : "מחזור חלקי של המסלולים היקרים (תרחיש)",
    tracks: spec.rate === null || !moving.length ? tracks : [...staying, fresh],
    oneOffCosts: fees === null || switchingCosts === null ? null : fees + switchingCosts,
    lumpSum: 0, missing,
  };
}

/**
 * Partial refinance: each selected track is replaced by a track of the same type and term at the
 * reference rate for that type (a scenario, not an offer). Fees and switching costs as in refinance().
 */
export function refinanceEach(tracks: EngineTrack[], ids: string[], rates: Record<string, unknown> | null | undefined, switchingCosts: number | null): Alternative {
  const missing: string[] = [];
  const moving = tracks.filter((t) => ids.includes(t.id));
  const refs = moving.map((t) => referenceFor(t, rates));
  if (refs.some((r) => r === null)) missing.push("ריבית ייחוס למסלול החדש");
  const fees = sumKnown(moving.map((t) => t.prepaymentFee));
  if (fees === null) missing.push("עמלת פירעון מוקדם");
  if (switchingCosts === null) missing.push("עלויות מעבר (שמאות, פתיחת תיק, משפטיות)");
  const next = tracks.map((t) => {
    const i = moving.indexOf(t);
    if (i < 0 || refs[i] === null) return t;
    return clone(t, { id: `${t.id}-new`, label: `${t.label} (חדש, תרחיש)`, rate: refs[i]!, nextResetMonth: t.behavior === "reset" ? (t.resetEveryMonths ?? 60) : null, prepaymentFee: null });
  });
  return { kind: "refi_partial", title: "מחזור חלקי של המסלולים היקרים (תרחיש)", tracks: next, oneOffCosts: fees === null || switchingCosts === null ? null : fees + switchingCosts, lumpSum: 0, missing };
}

/** Evaluate alternatives against the baseline under the same assumptions, plus a stress run. */
export function evaluate(baseline: EngineTrack[], alts: Alternative[], a: Assumptions): Evaluated[] {
  const b = runPlan(baseline, a);
  const bs = runPlan(baseline, stressOf(a));
  const EPS = 1;
  return [baselineAlt(baseline), ...alts].map((alt) => {
    const isBase = alt.kind === "baseline";
    const base = isBase ? b : runPlan(alt.tracks, a);
    const stress = isBase ? bs : runPlan(alt.tracks, stressOf(a));
    // The lump sum is the client's own money moved earlier. It reduces future payments, it is not a cost.
    const totalCost = alt.oneOffCosts === null ? null : base.financeCost + alt.oneOffCosts;
    const dPay = base.firstPayment - b.firstPayment;
    const dCost = totalCost === null ? null : totalCost - b.financeCost;
    const extendsTerm = base.months > b.months;
    const financeDiff = base.financeCost - b.financeCost;
    const breakEvenMonths = alt.oneOffCosts !== null && alt.oneOffCosts > 0 && dPay < -EPS ? Math.ceil(alt.oneOffCosts / -dPay) : null;
    let outcome: Outcome;
    if (isBase) outcome = "baseline";
    else if ((alt.missing.length || dCost === null) && financeDiff > EPS) outcome = dPay < -EPS ? "lower_payment_higher_total" : "higher_cost";
    else if (alt.missing.length || dCost === null) outcome = "incomplete";
    else if (dCost < -EPS) outcome = "lower_total_cost";
    else if (dPay < -EPS) outcome = "lower_payment_higher_total";
    else if (dCost > EPS) outcome = "higher_cost";
    else outcome = "no_change";
    return {
      ...alt, base, stress, totalCost, extendsTerm, outcome,
      vsBaseline: { firstPayment: dPay, months: base.months - b.months, totalCost: dCost, totalCostAtLeast: dCost === null && financeDiff > EPS ? financeDiff : null, stressPeakPayment: stress.peakPayment - bs.peakPayment, breakEvenMonths },
    };
  });
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  baseline: "נקודת ההשוואה",
  lower_total_cost: "עלות כוללת נמוכה יותר בתרחיש הזה",
  lower_payment_higher_total: "החזר חודשי נמוך יותר, אבל עלות כוללת גבוהה יותר. זה לא חיסכון",
  higher_cost: "עלות כוללת גבוהה יותר",
  no_change: "כמעט ללא שינוי",
  incomplete: "חסרים נתונים כדי לקבוע",
};

// ---------- snapshot: cost, stability, fit ----------

export type Goal = "lower_payment" | "lower_total" | "stability" | "early_payoff" | "not_sure";
export const GOAL_TEXT: Record<Goal, string> = {
  lower_payment: "להקטין את ההחזר החודשי",
  lower_total: "להקטין את העלות הכוללת",
  stability: "יותר יציבות וודאות",
  early_payoff: "לסיים מוקדם יותר",
  not_sure: "עוד לא בטוח",
};

/** Reference rate for an engine track, by behaviour and linkage. null when unknown. */
export function referenceFor(t: Pick<EngineTrack, "behavior" | "linked">, rates: Record<string, unknown> | null | undefined): number | null {
  const key = t.behavior === "prime" ? "prime" : t.behavior === "fixed" ? (t.linked ? "fixed_linked" : "fixed_not_linked") : (t.linked ? "variable_5_linked" : "variable_5");
  const v = Number(rates?.[key]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

export interface Snapshot {
  cost: { weightedGap: number | null; aboveShare: number; belowShare: number; comparedShare: number };
  stability: { variableShare: number; linkedShare: number; stressJump: number; stressJumpPct: number };
  fit: { payment: number; ratio: number | null; band: DtiBand | null; monthsLeft: number };
}

export function snapshot(tracks: EngineTrack[], rates: Record<string, unknown> | null | undefined, a: Assumptions, netIncome: number | null, obligations = 0): Snapshot {
  const total = tracks.reduce((s, t) => s + t.balance, 0) || 1;
  let gapW = 0, compared = 0, above = 0, below = 0;
  for (const t of tracks) {
    const ref = referenceFor(t, rates);
    if (ref === null) continue;
    const g = t.rate - ref;
    gapW += g * t.balance; compared += t.balance;
    if (g >= 0.3) above += t.balance; else if (g <= -0.3) below += t.balance;
  }
  const b = runPlan(tracks, a), s = runPlan(tracks, stressOf(a));
  const ratio = netIncome && netIncome > 0 ? (b.firstPayment + obligations) / netIncome : null;
  return {
    cost: { weightedGap: compared ? gapW / compared : null, aboveShare: above / total, belowShare: below / total, comparedShare: compared / total },
    stability: {
      variableShare: tracks.filter((t) => t.behavior !== "fixed").reduce((x, t) => x + t.balance, 0) / total,
      linkedShare: tracks.filter((t) => t.linked).reduce((x, t) => x + t.balance, 0) / total,
      stressJump: s.peakPayment - b.firstPayment,
      stressJumpPct: b.firstPayment ? (s.peakPayment - b.firstPayment) / b.firstPayment : 0,
    },
    fit: { payment: b.firstPayment, ratio, band: dtiBand(ratio), monthsLeft: b.months },
  };
}

/**
 * Standard alternatives for an existing mortgage. Rates for new tracks come from reference data and are
 * scenarios, not offers. Order follows the client's goal, but the baseline always comes first and nothing is
 * filtered out for looking unattractive.
 */
export function existingAlternatives(tracks: EngineTrack[], rates: Record<string, unknown> | null | undefined, opts: { switchingCosts: number | null; prepayAmount?: number | null; goal: Goal; cpiAnnual: number }): Alternative[] {
  const fixedRef = referenceFor({ behavior: "fixed", linked: false }, rates);
  const expensive = tracks.filter((t) => { const r = referenceFor(t, rates); return r !== null && t.rate - r >= 0.3; }).map((t) => t.id);
  const variable = tracks.filter((t) => t.behavior !== "fixed").map((t) => t.id);
  const alts: Alternative[] = [changeTerm(tracks, -60), changeTerm(tracks, 60)];
  if (opts.prepayAmount && opts.prepayAmount > 0) alts.push(prepay(tracks, opts.prepayAmount, "term", opts.cpiAnnual));
  // Partial: each expensive track moves to the reference rate of its own type.
  if (expensive.length) alts.push(refinanceEach(tracks, expensive, rates, opts.switchingCosts));
  alts.push(refinance(tracks, "all", { rate: fixedRef, behavior: "fixed", linked: false }, opts.switchingCosts));
  if (variable.length && variable.length < tracks.length) alts.push(refinance(tracks, variable, { rate: fixedRef, behavior: "fixed", linked: false }, opts.switchingCosts, "reduce_exposure"));
  const rank: Record<Goal, AlternativeKind[]> = {
    lower_payment: ["extend", "refi_partial", "refi_full", "prepay", "reduce_exposure", "shorten"],
    lower_total: ["refi_partial", "prepay", "shorten", "refi_full", "reduce_exposure", "extend"],
    stability: ["reduce_exposure", "refi_full", "refi_partial", "shorten", "prepay", "extend"],
    early_payoff: ["shorten", "prepay", "refi_partial", "refi_full", "reduce_exposure", "extend"],
    not_sure: ["refi_partial", "shorten", "prepay", "reduce_exposure", "refi_full", "extend"],
  };
  return alts.sort((x, y) => rank[opts.goal].indexOf(x.kind) - rank[opts.goal].indexOf(y.kind));
}

// ---------- new mortgage on the same engine ----------

export interface NewMortgageInput {
  price: number;
  equity: number;
  /** Purchase tax, lawyer, broker, appraisal... null = not yet known. Paid from equity. */
  purchaseCosts: number | null;
  purpose: Purpose;
  netIncome: number | null;
  obligations: number;
  targetPayment: number | null;
  years: number;
}

export function newMortgageNeeds(input: NewMortgageInput) {
  const equityForPrice = input.purchaseCosts === null ? input.equity : input.equity - input.purchaseCosts;
  const loan = Math.max(0, input.price - equityForPrice);
  const ltv = input.price > 0 ? loan / input.price : null;
  const cap = LTV_CAP[input.purpose];
  const maxLoanByLtv = input.price * cap;
  return {
    loan, ltv, ltvCap: cap, overLtv: ltv !== null && ltv > cap + 1e-9, maxLoanByLtv,
    missing: [input.purchaseCosts === null && "עלויות הרכישה (מס רכישה, עורך דין, תיווך, שמאות)", !input.netIncome && "הכנסה נטו של משק הבית"].filter(Boolean) as string[],
    costsIncluded: input.purchaseCosts !== null,
  };
}

export interface MixEvaluation { name: string; tracks: EngineTrack[]; base: PlanResult; stress: PlanResult; ratio: number | null; stressRatio: number | null; band: DtiBand | null; stressBand: DtiBand | null; withinTarget: boolean | null }

/** Evaluate candidate mixes for a new mortgage: base and stress payments, and fit to income and target. */
export function evaluateNewMixes(mixes: { name: string; tracks: EngineTrack[] }[], input: NewMortgageInput, a: Assumptions): MixEvaluation[] {
  return mixes.map((m) => {
    const base = runPlan(m.tracks, a), stress = runPlan(m.tracks, stressOf(a));
    const ratio = input.netIncome ? (base.firstPayment + input.obligations) / input.netIncome : null;
    const stressRatio = input.netIncome ? (stress.peakPayment + input.obligations) / input.netIncome : null;
    return { name: m.name, tracks: m.tracks, base, stress, ratio, stressRatio, band: dtiBand(ratio), stressBand: dtiBand(stressRatio), withinTarget: input.targetPayment ? stress.peakPayment <= input.targetPayment : null };
  });
}

// ---------- adapters ----------

/** From the balance check's simple tracks. Unknown values make the track unusable (returned in `skipped`). */
export function fromSimpleTracks(list: { type: string; balance: number | null; rate: number | null; years: number | null }[]) {
  const tracks: EngineTrack[] = [];
  const skipped: number[] = [];
  list.forEach((t, i) => {
    const behavior: RateBehavior | null = t.type === "prime" ? "prime" : t.type === "fixed_nl" || t.type === "fixed_l" ? "fixed" : t.type === "var5" || t.type === "var_l" ? "reset" : null;
    if (!behavior || !(t.balance! > 0) || !(t.rate! > 0) || !(t.years! > 0)) { skipped.push(i); return; }
    tracks.push({
      id: `t${i + 1}`, label: `מסלול ${i + 1}`, balance: t.balance!, rate: t.rate!, months: t.years! * 12,
      linked: t.type === "fixed_l" || t.type === "var_l", behavior,
      resetEveryMonths: behavior === "reset" ? 60 : null, nextResetMonth: null, prepaymentFee: null,
    });
  });
  return { tracks, skipped };
}

/** From quick-check mix tracks (effective rate for linked tracks includes CPI; remove it here). */
export function fromQuickMix(tracks: { key: string; amount: number; years: number; rate: number }[], cpiAnnual: number): EngineTrack[] {
  return tracks.map((t, i) => {
    const linked = t.key === "fixed_linked";
    return {
      id: `${t.key}-${i}`, label: t.key, balance: t.amount, rate: linked ? t.rate - cpiAnnual : t.rate, months: t.years * 12, linked,
      behavior: t.key === "prime" ? "prime" : t.key === "variable_5" ? "reset" : "fixed",
      resetEveryMonths: t.key === "variable_5" ? 60 : null, nextResetMonth: t.key === "variable_5" ? 60 : null, prepaymentFee: 0,
    };
  });
}
