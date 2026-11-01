// Bank offer comparison. No single "best" label; offers earn categories instead.
import { num } from "./amortization";
import { fromOfferTracks, projectTracks, summarizeTracks, type NormalizedTrack, type TrackSummary } from "./tracks";
import { simulate } from "./scenarios";

/** Assumption used for the "estimated maximum payment" of offers with variable tracks. */
export const STRESS_DELTA = 2;

export interface OfferInput {
  id: string;
  bank: string;
  tracks: any[];
  first_payment?: number | null;
  total_amount?: number | null;
  extra_costs?: number | null;
  kind?: string;
  valid_until?: string | null;
  advisor_explanation?: string | null;
}

export type OfferCategory = "lowest_payment" | "lowest_cost" | "most_stable" | "most_flexible";

export const CATEGORY_LABEL: Record<OfferCategory, string> = {
  lowest_payment: "ההחזר ההתחלתי הנמוך ביותר",
  lowest_cost: "העלות הכוללת המשוערת הנמוכה ביותר",
  most_stable: "היציבה ביותר",
  most_flexible: "הגמישה ביותר",
};

export const CATEGORY_HINT: Record<OfferCategory, string> = {
  lowest_payment: "מתאימה אם חשוב לכם החזר חודשי נמוך כבר מההתחלה.",
  lowest_cost: "מתאימה אם חשוב לכם לשלם כמה שפחות לאורך כל התקופה.",
  most_stable: "החלק הקטן ביותר בריבית משתנה ובהצמדה, כך שההחזר צפוי יותר.",
  most_flexible: "החלק הגדול ביותר במסלולים שבדרך כלל קל יותר לפרוע מוקדם או לשנות.",
};

export interface OfferMetrics {
  id: string;
  bank: string;
  tracks: NormalizedTrack[];
  summary: TrackSummary;
  firstPayment: number;
  maxPayment: number | null;     // only when the offer has variable tracks
  totalCost: number;             // principal + estimated interest + extra costs
  totalInterest: number;
  months: number;
  flexibility: number;           // share of prime/variable tracks (0..1)
  categories: OfferCategory[];
  raw: OfferInput;
}

export function analyzeOffer(o: OfferInput, cpi: number): OfferMetrics | null {
  const tracks = fromOfferTracks(o.tracks);
  const summary = summarizeTracks(tracks, cpi);
  if (!summary) return null;
  const proj = projectTracks(tracks, cpi);
  const firstPayment = num(o.first_payment) || summary.monthly;
  const stress = summary.variableShare > 0 ? simulate(tracks, cpi, { kind: "rate", delta: STRESS_DELTA }).monthly : null;
  return {
    id: o.id, bank: o.bank, tracks, summary, firstPayment,
    maxPayment: stress !== null ? Math.max(stress, firstPayment) : null,
    totalInterest: proj.totalInterest,
    totalCost: summary.total + proj.totalInterest + num(o.extra_costs),
    months: summary.maxMonths,
    flexibility: summary.variableShare,
    categories: [],
    raw: o,
  };
}

/** Assigns categories (ties share a category). Categories need at least two comparable offers. */
export function compareOffers(offers: OfferInput[], cpi: number): OfferMetrics[] {
  const list = offers.map((o) => analyzeOffer(o, cpi)).filter((x): x is OfferMetrics => !!x);
  if (list.length < 2) return list;
  const award = (cat: OfferCategory, value: (m: OfferMetrics) => number, lowerIsBetter: boolean) => {
    const vals = list.map(value);
    const best = lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
    const worst = lowerIsBetter ? Math.max(...vals) : Math.min(...vals);
    if (Math.abs(best - worst) < 1e-9) return; // no difference, no category
    list.forEach((m, i) => { if (Math.abs(vals[i] - best) <= Math.abs(best) * 0.005 + 1e-9) m.categories.push(cat); });
  };
  award("lowest_payment", (m) => m.firstPayment, true);
  award("lowest_cost", (m) => m.totalCost, true);
  award("most_stable", (m) => m.summary.variableShare + m.summary.linkedShare * 0.5, true);
  award("most_flexible", (m) => m.flexibility, false);
  return list;
}

/** Short plain-Hebrew explanation of the main trade-off between offers. */
export function explainDifferences(list: OfferMetrics[]): string | null {
  if (list.length < 2) return null;
  const byPay = [...list].sort((a, b) => a.firstPayment - b.firstPayment);
  const byCost = [...list].sort((a, b) => a.totalCost - b.totalCost);
  const payGap = byPay[byPay.length - 1].firstPayment - byPay[0].firstPayment;
  const costGap = byCost[byCost.length - 1].totalCost - byCost[0].totalCost;
  const nis = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;
  if (byPay[0].id === byCost[0].id) {
    return `ההצעה של ${byPay[0].bank} זולה יותר גם בהחזר החודשי (בכ-${nis(payGap)}) וגם בעלות הכוללת המשוערת (בכ-${nis(costGap)}). כדאי לבדוק גם את רמת היציבות שלה לפני החלטה.`;
  }
  return `ההצעה של ${byPay[0].bank} נותנת החזר חודשי נמוך יותר (בכ-${nis(payGap)}), אבל ההצעה של ${byCost[0].bank} זולה יותר לאורך כל התקופה (בכ-${nis(costGap)}, הערכה). הבחירה תלויה במה שחשוב לכם יותר.`;
}
