// Quick-check estimation logic (pure, unit-tested).
export interface Rates {
  prime: number;
  fixed_not_linked: number;
  fixed_linked: number;
  variable_5: number;
  cpi_annual?: number | null;
}
export type TrackKey = "prime" | "fixed_not_linked" | "fixed_linked" | "variable_5";
export const TRACK_LABEL: Record<TrackKey, string> = {
  prime: "פריים",
  fixed_not_linked: "קבועה לא צמודה",
  fixed_linked: "קבועה צמודה",
  variable_5: "משתנה כל 5 שנים",
};
export interface MixTrack { key: TrackKey; amount: number; years: number; rate: number }
export interface Mix { risk: "נמוך" | "בינוני" | "גבוה"; name: string; tracks: MixTrack[]; monthly: number; total: number }

export const pmt = (balance: number, annualRate: number, years: number) => {
  const n = years * 12, m = annualRate / 1200;
  if (n <= 0) return 0;
  return m ? (balance * m) / (1 - Math.pow(1 + m, -n)) : balance / n;
};

const SHARES: Record<string, Partial<Record<TrackKey, number>>> = {
  a: { fixed_not_linked: 0.5, fixed_linked: 0.2, prime: 0.3 },
  b: { fixed_not_linked: 0.34, prime: 0.33, variable_5: 0.33 },
  c: { prime: 0.5, variable_5: 0.3, fixed_not_linked: 0.2 },
};

/** Effective rate used for cost estimates; linked tracks add expected CPI. */
export function effectiveRate(key: TrackKey, r: Rates) {
  const base = Number(r[key]) || 0;
  return key === "fixed_linked" ? base + (Number(r.cpi_annual) || 0) : base;
}

export function buildMixes(loan: number, years: number, rates: Rates): Mix[] {
  if (!(loan > 0) || !(years > 0)) return [];
  const raw = Object.values(SHARES).map((shares) => {
    const tracks: MixTrack[] = (Object.entries(shares) as [TrackKey, number][]).map(([key, s]) => ({
      key, amount: Math.round(loan * s), years, rate: effectiveRate(key, rates),
    }));
    const monthly = tracks.reduce((a, t) => a + pmt(t.amount, t.rate, t.years), 0);
    return { tracks, monthly, total: monthly * years * 12 };
  });
  // Consistency rule: the lower-risk mix is the one with the higher total cost,
  // so a "safer" mix can never come out cheaper on both monthly and total.
  raw.sort((x, y) => y.total - x.total || y.monthly - x.monthly);
  const names: [Mix["risk"], string][] = [["נמוך", "תמהיל יציב"], ["בינוני", "תמהיל מאוזן"], ["גבוה", "תמהיל גמיש"]];
  return raw.map((m, i) => ({ ...m, risk: names[i][0], name: names[i][1] }));
}

export type Grade = "מצוין" | "אפשרי" | "גבולי";
export const ltvGrade = (ltv: number): Grade => (ltv <= 60 ? "מצוין" : ltv <= 75 ? "אפשרי" : "גבולי");
export const dtiGrade = (dti: number): Grade => (dti <= 30 ? "מצוין" : dti <= 40 ? "אפשרי" : "גבולי");
