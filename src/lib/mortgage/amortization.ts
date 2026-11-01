// Pure amortization math (Spitzer / annuity). All functions are NaN/Infinity safe.

/** Untyped JSON from the database (intake_data, tender payloads). Values are always coerced with num()/String(). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Loose = any;

/** Coerces any input to a finite, non-negative number (0 otherwise). */
export const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Same as num() but keeps negative values (used for rate deltas). */
export const signed = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Monthly payment for an annuity loan. Rate is annual percent. Handles a 0% rate. */
export function pmt(principal: number, annualRatePct: number, months: number): number {
  const p = num(principal), n = Math.round(num(months));
  if (!p || !n) return 0;
  const r = Math.max(signed(annualRatePct), 0) / 1200;
  if (r === 0) return p / n;
  return (p * r) / (1 - Math.pow(1 + r, -n));
}

/** Principal that a given monthly payment can serve (inverse of pmt). */
export function principalFromPayment(payment: number, annualRatePct: number, months: number): number {
  const a = num(payment), n = Math.round(num(months));
  if (!a || !n) return 0;
  const r = Math.max(signed(annualRatePct), 0) / 1200;
  if (r === 0) return a * n;
  return (a * (1 - Math.pow(1 + r, -n))) / r;
}

/**
 * Months needed to repay a balance with a fixed monthly payment.
 * Returns null when the payment does not cover the monthly interest (never repaid).
 */
export function monthsToRepay(balance: number, annualRatePct: number, payment: number): number | null {
  const b = num(balance), a = num(payment);
  if (!b) return 0;
  if (!a) return null;
  const r = Math.max(signed(annualRatePct), 0) / 1200;
  if (r === 0) return Math.ceil(b / a);
  if (a <= b * r) return null;
  return Math.ceil(-Math.log(1 - (r * b) / a) / Math.log(1 + r));
}

export interface YearPoint {
  year: number;          // 0 = today
  balance: number;       // nominal balance at the end of the year (after indexation)
  principalPaid: number; // cumulative principal repaid (original principal + indexation added to it)
  interestPaid: number;  // cumulative interest
  indexationPaid: number; // cumulative CPI indexation added to the principal
}

export interface Schedule {
  monthly: number;       // first monthly payment (incl. extra)
  lastMonthly: number;   // last full monthly payment (grows with CPI on linked tracks)
  months: number;        // months until repaid
  totalPaid: number;     // nominal shekels
  totalInterest: number;
  totalIndexation: number; // CPI linkage added to the principal over the life of the loan (0 when unlinked)
  points: YearPoint[];
}

/** Monthly CPI factor from an assumed constant annual CPI (percent). */
export const monthlyIndexFactor = (cpiAnnualPct: number) => Math.pow(1 + Math.max(signed(cpiAnnualPct), 0) / 100, 1 / 12);

/**
 * Month-by-month simulation, aggregated per year for charts.
 *
 * Unlinked track (cpiAnnualPct = 0): classic Spitzer, fixed payment = pmt + extra.
 *
 * CPI-linked track (cpiAnnualPct > 0), modelled the way Israeli linked Spitzer loans work:
 *  1. at the start of every month the outstanding principal is indexed by the assumed monthly CPI
 *     factor f = (1 + cpi)^(1/12); the increase is recorded as indexation (not interest);
 *  2. interest = indexed principal x (real annual rate / 12);
 *  3. the payment is the real annuity payment indexed by the same factor: (pmt + extra) x f^t,
 *     so in real terms it stays constant and in nominal shekels it grows with CPI;
 *  4. principal part = payment - interest.
 * Total paid = original principal + total interest + total indexation.
 * The annual CPI is an assumption (constant every year); actual CPI will differ.
 */
export function schedule(principal: number, annualRatePct: number, months: number, extraMonthly = 0, cpiAnnualPct = 0): Schedule {
  const p = num(principal), n = Math.round(num(months));
  const base = pmt(p, annualRatePct, n) + num(extraMonthly);
  const r = Math.max(signed(annualRatePct), 0) / 1200;
  const f = monthlyIndexFactor(cpiAnnualPct);
  const points: YearPoint[] = [{ year: 0, balance: p, principalPaid: 0, interestPaid: 0, indexationPaid: 0 }];
  if (!p || !n) return { monthly: 0, lastMonthly: 0, months: 0, totalPaid: 0, totalInterest: 0, totalIndexation: 0, points };
  let bal = p, paidP = 0, paidI = 0, paidX = 0, m = 0, idx = 1, first = 0, last = 0;
  while (bal > 0.005 && m < n) {
    const indexation = bal * (f - 1);
    bal += indexation; idx *= f; paidX += indexation;
    const interest = bal * r;
    const payment = base * idx;
    const principalPart = Math.min(bal, payment - interest);
    bal -= principalPart; paidP += principalPart; paidI += interest; m += 1;
    if (m === 1) first = principalPart + interest;
    last = principalPart + interest;
    if (m % 12 === 0 || bal <= 0.005) {
      points.push({ year: Math.ceil(m / 12), balance: Math.max(bal, 0), principalPaid: paidP, interestPaid: paidI, indexationPaid: paidX });
    }
  }
  return { monthly: first, lastMonthly: last, months: m, totalPaid: paidP + paidI, totalInterest: paidI, totalIndexation: paidX, points };
}

/** Adds months to a date and returns it (does not mutate). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + Math.round(num(months)));
  return d;
}

/** "מרץ 2049" style label. */
export const monthYear = (d: Date) =>
  d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
