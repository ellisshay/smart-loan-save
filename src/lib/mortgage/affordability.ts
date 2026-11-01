// "כמה משכנתא אני יכול לקחת?" Distinguishes a reasonable range from the possible limit.
import { num, principalFromPayment } from "./amortization";
import { buildMixes, type Rates } from "@/lib/quickCheck";

/** Industry rule of thumb for a comfortable repayment (not a regulation). */
export const REASONABLE_RATIO = { low: 0.25, high: 0.33 } as const;
/** Bank of Israel cap on repayment-to-income ratio (general limit, banks may require less). */
export const MAX_PTI = 0.5;
/** Bank of Israel LTV caps by purpose. */
export const LTV_CAP = { single: 0.75, upgrade: 0.7, investment: 0.5 } as const;
export type Purpose = keyof typeof LTV_CAP;

export interface AffordInput {
  netIncome: number;
  obligations: number;
  equity: number;
  years: number;
  rate: number;          // estimated average annual %
  purpose?: Purpose;
}

export interface AffordBand { paymentLow: number; paymentHigh: number; loanLow: number; loanHigh: number; priceLow: number; priceHigh: number }

export function affordability(input: AffordInput) {
  const income = num(input.netIncome), obligations = num(input.obligations), equity = num(input.equity);
  const months = Math.round(num(input.years) * 12);
  const cap = LTV_CAP[input.purpose || "single"];
  if (!income || !months) return null;

  const loanFor = (payment: number) => principalFromPayment(Math.max(0, payment), input.rate, months);
  // Property price limited both by what the loan + equity buy and by the LTV cap on equity.
  const priceFor = (loan: number) => Math.min(equity + loan, cap < 1 ? equity / (1 - cap) : Infinity);

  const pLow = Math.max(0, income * REASONABLE_RATIO.low - obligations);
  const pHigh = Math.max(0, income * REASONABLE_RATIO.high - obligations);
  const pMax = Math.max(0, income * MAX_PTI - obligations);

  const band = (a: number, b: number): AffordBand => {
    const la = loanFor(a), lb = loanFor(b);
    return { paymentLow: a, paymentHigh: b, loanLow: la, loanHigh: lb, priceLow: priceFor(la), priceHigh: priceFor(lb) };
  };
  const reasonable = band(pLow, pHigh);
  const possibleLoan = loanFor(pMax);
  // Loan above what the LTV cap allows for this equity is not usable for a purchase.
  const ltvLoanCap = cap < 1 ? (equity * cap) / (1 - cap) : Infinity;
  return {
    reasonable,
    possible: { payment: pMax, loan: Math.min(possibleLoan, ltvLoanCap), price: priceFor(Math.min(possibleLoan, ltvLoanCap)) },
    equityLimited: possibleLoan > ltvLoanCap,
    ltvCap: cap,
    obligationsRatio: obligations / income,
  };
}

/** Repayment ratio: (mortgage payment + other obligations) / net income. null when income is unknown. */
export function repaymentRatio(payment: number, income: number, obligations = 0): number | null {
  const i = num(income);
  if (!i) return null;
  return (num(payment) + num(obligations)) / i;
}

/**
 * Average market reference rate: the weighted effective rate (CPI included for linked tracks)
 * of the balanced example mix built from today's market rates. null when rates are unknown.
 */
export function marketReferenceRate(rates: Rates | null | undefined): number | null {
  if (!rates) return null;
  const mixes = buildMixes(1_000_000, 25, rates);
  const mix = mixes.find((m) => m.risk === "בינוני") || mixes[0];
  if (!mix) return null;
  const total = mix.tracks.reduce((s, t) => s + t.amount, 0);
  const r = total ? mix.tracks.reduce((s, t) => s + t.rate * t.amount, 0) / total : 0;
  return r > 0 ? Math.round(r * 100) / 100 : null;
}
