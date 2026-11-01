// "כמה משכנתא אני יכול לקחת?" Distinguishes a reasonable range from the possible limit.
import { num, principalFromPayment } from "./amortization";
import type { Rates } from "@/lib/quickCheck";

/** Comfortable / conservative repayment range (industry rule of thumb, not a regulation). */
export const REASONABLE_RATIO = { low: 0.25, high: 0.33 } as const;
/** Above the comfortable range and up to here: possible, but needs caution. */
export const CAUTION_RATIO = 0.4;
/**
 * Bank of Israel general ceiling on repayment-to-income. Shown only as a regulatory maximum,
 * never as a recommendation. Above 40% the Bank of Israel treats the loan as high risk.
 */
export const MAX_PTI = 0.5;
/** Bank of Israel LTV caps by purpose. */
export const LTV_CAP = { single: 0.75, upgrade: 0.7, investment: 0.5 } as const;
export type Purpose = keyof typeof LTV_CAP;

export type DtiBandKey = "comfortable" | "caution" | "high" | "over";
export interface DtiBand { key: DtiBandKey; label: string; short: string; text: string; tone: "good" | "default" | "warn" }

/** Plain-Hebrew band for a repayment-to-income ratio. null when unknown. */
export function dtiBand(dti: number | null | undefined): DtiBand | null {
  if (dti === null || dti === undefined || !Number.isFinite(dti) || dti < 0) return null;
  if (dti <= REASONABLE_RATIO.high) return { key: "comfortable", label: "טווח נוח", short: "בטווח הנוח", text: "ההחזר בטווח הנוח, עד כשליש מההכנסה.", tone: "good" };
  if (dti <= CAUTION_RATIO) return { key: "caution", label: "טווח שדורש זהירות", short: "דורש זהירות", text: "החזר של 33%–40% מההכנסה אפשרי, אבל משאיר פחות מרווח לביטחון.", tone: "default" };
  if (dti <= MAX_PTI) return { key: "high", label: "מעל 40%", short: "מעל 40%: סיכון גבוה", text: "בנק ישראל מגדיר החזר של יותר מ-40% מההכנסה כאזור של סיכון גבוה.", tone: "warn" };
  return { key: "over", label: "מעל המגבלה", short: "מעל המגבלה הרגולטורית", text: "החזר של יותר מ-50% מההכנסה הוא מעל המגבלה הכללית של בנק ישראל.", tone: "warn" };
}

export interface AffordInput {
  netIncome: number;
  obligations: number;
  equity: number;
  years: number;
  rate: number;          // estimated average annual %
  purpose?: Purpose;
}

export interface AffordPoint { ratio: number; payment: number; loan: number; price: number }

/**
 * Four reference points on the repayment-to-income scale. The UI emphasizes the comfortable
 * range; the regulatory ceiling is context only ("מה אפשר לקבל מהבנק אינו בהכרח מה שכדאי לקחת").
 */
export function affordability(input: AffordInput) {
  const income = num(input.netIncome), obligations = num(input.obligations), equity = num(input.equity);
  const months = Math.round(num(input.years) * 12);
  const cap = LTV_CAP[input.purpose || "single"];
  if (!income || !months) return null;
  // A loan above what the LTV cap allows for this equity cannot be used for a purchase.
  const ltvLoanCap = cap < 1 ? (equity * cap) / (1 - cap) : Infinity;
  const point = (ratio: number): AffordPoint => {
    const payment = Math.max(0, income * ratio - obligations);
    const loan = Math.min(principalFromPayment(payment, input.rate, months), ltvLoanCap);
    return { ratio, payment, loan, price: equity + loan };
  };
  const conservative = point(REASONABLE_RATIO.low);
  const comfortableTop = point(REASONABLE_RATIO.high);
  const cautionTop = point(CAUTION_RATIO);
  const regulatory = point(MAX_PTI);
  return {
    conservative,                                   // ~25%
    reasonable: { from: conservative, to: comfortableTop },   // 25%-33%
    caution: { from: comfortableTop, to: cautionTop },        // 33%-40%
    regulatory,                                     // 50% ceiling, not a recommendation
    equityLimited: principalFromPayment(Math.max(0, income * MAX_PTI - obligations), input.rate, months) > ltvLoanCap,
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
 * Market reference rate for single-rate (unlinked) comparisons: the average of today's unlinked
 * market rates (prime, fixed unlinked, variable every 5 years), equally weighted.
 * CPI-linked rates are deliberately excluded: a real rate plus a CPI guess is not a nominal rate.
 * null when rates are unknown.
 */
export function marketReferenceRate(rates: Rates | null | undefined): number | null {
  if (!rates) return null;
  const vals = [rates.prime, rates.fixed_not_linked, rates.variable_5].map((v) => num(v)).filter((v) => v > 0);
  if (!vals.length) return null;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
}
