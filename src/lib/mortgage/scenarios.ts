// "מה קורה אם?" scenarios, simulated per track. Every figure here is an estimate.
import { addMonths, num, pmt, schedule, signed } from "./amortization";
import { effectiveRate, type NormalizedTrack } from "./tracks";

export type Scenario =
  | { kind: "base" }
  | { kind: "rate"; delta: number }                         // % points, applied to variable tracks only
  | { kind: "extra"; amount: number }                       // added to the monthly payment
  | { kind: "lump"; amount: number; mode: "payment" | "term" }
  | { kind: "shorten"; years: number }
  | { kind: "refi"; rate: number; costs: number };          // whole balance at one estimated rate

export interface ScenarioResult {
  monthly: number;
  months: number;
  totalInterest: number;
  totalPaid: number;
  endDate: Date;
  affectedShare: number;  // share of the balance the scenario changed (rate scenarios)
  note?: string;
}

export interface ScenarioDiff extends ScenarioResult {
  monthlyDiff: number;    // scenario - base (negative = cheaper)
  interestDiff: number;   // scenario - base, including one-off costs where relevant
  monthsDiff: number;
}

const usable = (tracks: NormalizedTrack[]) => tracks.filter((t) => t.amount > 0 && t.months > 0);

function run(tracks: NormalizedTrack[], cpi: number, sc: Scenario, today: Date): ScenarioResult {
  const list = usable(tracks);
  const total = list.reduce((s, t) => s + t.amount, 0);
  const empty: ScenarioResult = { monthly: 0, months: 0, totalInterest: 0, totalPaid: 0, endDate: today, affectedShare: 0 };
  if (!total) return empty;

  if (sc.kind === "refi") {
    const months = Math.round(list.reduce((s, t) => s + t.months * t.amount, 0) / total);
    const s = schedule(total, num(sc.rate), months);
    return { monthly: s.monthly, months: s.months, totalInterest: s.totalInterest + num(sc.costs), totalPaid: s.totalPaid + num(sc.costs), endDate: addMonths(today, s.months), affectedShare: 1 };
  }

  let monthly = 0, months = 0, interest = 0, paid = 0, affected = 0;
  const lumpTotal = sc.kind === "lump" ? Math.min(num(sc.amount), total) : 0;
  for (const t of list) {
    const share = t.amount / total;
    let rate = effectiveRate(t, cpi);
    let amount = t.amount, m = t.months, extra = 0;
    if (sc.kind === "rate" && t.variable) { rate = Math.max(rate + signed(sc.delta), 0); affected += share; }
    if (sc.kind === "extra") extra = num(sc.amount) * share;
    if (sc.kind === "shorten") m = Math.max(12, t.months - Math.round(num(sc.years) * 12));
    if (sc.kind === "lump") {
      const before = pmt(amount, rate, m);
      amount = Math.max(0, amount - lumpTotal * share);
      if (sc.mode === "term" && amount > 0) extra = Math.max(0, before - pmt(amount, rate, m));
    }
    if (!amount) continue;
    const s = schedule(amount, rate, m, extra);
    monthly += s.monthly; interest += s.totalInterest; paid += s.totalPaid; months = Math.max(months, s.months);
  }
  return {
    monthly, months, totalInterest: interest, totalPaid: paid + lumpTotal, endDate: addMonths(today, months), affectedShare: affected,
    note: sc.kind === "rate" && affected === 0 ? "כל המסלולים בריבית קבועה, ולכן שינוי ריבית לא משנה את ההחזר." : undefined,
  };
}

export function simulate(tracks: NormalizedTrack[], cpi: number, sc: Scenario, today = new Date()): ScenarioDiff {
  const base = run(tracks, cpi, { kind: "base" }, today);
  const res = run(tracks, cpi, sc, today);
  return { ...res, monthlyDiff: res.monthly - base.monthly, interestDiff: res.totalInterest - base.totalInterest, monthsDiff: res.months - base.months };
}

/** Refinance comparison for calculators (single balance). */
export function refinanceCompare(input: { balance: number; years: number; currentRate: number; newRate: number; costs: number; currentPayment?: number }) {
  const months = Math.round(num(input.years) * 12);
  const current = num(input.currentPayment) || pmt(input.balance, input.currentRate, months);
  const next = pmt(input.balance, input.newRate, months);
  const monthlySaving = current - next;
  const costs = num(input.costs);
  const lifetime = monthlySaving * months - costs;
  const breakEven = monthlySaving > 0 ? Math.ceil(costs / monthlySaving) : null;
  const verdict: "potential" | "check" | "none" =
    monthlySaving <= 0 || lifetime <= 0 ? "none"
    : breakEven !== null && breakEven <= 36 && monthlySaving >= 150 ? "potential"
    : "check";
  return { months, current, next, monthlySaving, costs, lifetime, breakEven, verdict };
}

export const VERDICT_TEXT = {
  potential: "נראה שיש פוטנציאל למחזור",
  check: "כדאי לבצע בדיקה מעמיקה",
  none: "כרגע לא מזוהה יתרון ברור",
} as const;
