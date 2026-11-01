// Pure amortization math (Spitzer / annuity). All functions are NaN/Infinity safe.

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
  balance: number;       // balance at the end of the year
  principalPaid: number; // cumulative
  interestPaid: number;  // cumulative
}

export interface Schedule {
  monthly: number;       // first monthly payment (incl. extra)
  months: number;        // months until repaid
  totalPaid: number;
  totalInterest: number;
  points: YearPoint[];
}

/**
 * Month-by-month simulation, aggregated per year for charts.
 * `extraMonthly` is added to every payment (shortens the term, payment stays fixed).
 */
export function schedule(principal: number, annualRatePct: number, months: number, extraMonthly = 0): Schedule {
  const p = num(principal), n = Math.round(num(months));
  const base = pmt(p, annualRatePct, n);
  const payment = base + num(extraMonthly);
  const r = Math.max(signed(annualRatePct), 0) / 1200;
  const points: YearPoint[] = [{ year: 0, balance: p, principalPaid: 0, interestPaid: 0 }];
  if (!p || !n) return { monthly: 0, months: 0, totalPaid: 0, totalInterest: 0, points };
  let bal = p, paidP = 0, paidI = 0, m = 0;
  while (bal > 0.005 && m < n) {
    const interest = bal * r;
    const principalPart = Math.min(bal, payment - interest);
    bal -= principalPart; paidP += principalPart; paidI += interest; m += 1;
    if (m % 12 === 0 || bal <= 0.005) {
      points.push({ year: Math.ceil(m / 12), balance: Math.max(bal, 0), principalPaid: paidP, interestPaid: paidI });
    }
  }
  return { monthly: payment, months: m, totalPaid: paidP + paidI, totalInterest: paidI, points };
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
