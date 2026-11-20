// Engine vs an independent reference (#52, #57 item 2).
// Expected values come from a separate Python implementation with a different formulation
// (classic indexed Spitzer: base annuity on the original principal, payment = base x index;
// re-amortisation only at the rate change). They were not derived from engine.ts.
import { describe, it, expect } from "vitest";
import { runPlan, type EngineTrack } from "./engine";

const T = (o: Partial<EngineTrack>): EngineTrack => ({ id: "a", label: "א", balance: 0, rate: 0, months: 0, linked: false, behavior: "fixed", ...o });
const ref = {
  fixed_500k_5_240: { first: 3299.7787, totalInterest: 291946.89, totalIndexation: 0, totalPaid: 791946.89, peak61: 3299.7787 },
  linked_300k_3_180_cpi25: { first: 2076.0124, totalInterest: 83314.29, totalIndexation: 68504.41, totalPaid: 451818.7, peak61: 2348.8175 },
  prime_400k_55_300_shift2: { first: 2955.9647, totalInterest: 486789.41, totalIndexation: 0, totalPaid: 886789.41, peak61: 2955.9647 },
  reset_350k_48_240_change37_shift2: { first: 2271.3511, totalInterest: 266210.63, totalIndexation: 0, totalPaid: 616210.63, peak61: 2619.8136 },
  fixed_200k_41_1195: { first: 2034.4215, totalInterest: 44130.59, totalIndexation: 0, totalPaid: 244130.59, peak61: 2034.4215 },
};
const close = (p: ReturnType<typeof runPlan>, r: typeof ref.fixed_500k_5_240) => {
  expect(p.firstPayment).toBeCloseTo(r.first, 2);
  expect(p.totalInterest).toBeCloseTo(r.totalInterest, 0);
  expect(p.totalIndexation).toBeCloseTo(r.totalIndexation, 0);
  expect(p.totalPaid).toBeCloseTo(r.totalPaid, 0);
  expect(p.peakPayment).toBeCloseTo(r.peak61, 2);
};

describe("engine matches an independent reference schedule", () => {
  it("fixed unlinked", () => close(runPlan([T({ balance: 500_000, rate: 5, months: 240 })], { cpiAnnual: 0, primeShift: 0, resetShift: 0 }), ref.fixed_500k_5_240));
  it("CPI-linked (indexed principal, payment follows the index)", () =>
    close(runPlan([T({ balance: 300_000, rate: 3, months: 180, linked: true })], { cpiAnnual: 2.5, primeShift: 0, resetShift: 0 }), ref.linked_300k_3_180_cpi25));
  it("prime under a +2 shift from month 1", () =>
    close(runPlan([T({ balance: 400_000, rate: 5.5, months: 300, behavior: "prime" })], { cpiAnnual: 0, primeShift: 2, resetShift: 0 }), ref.prime_400k_55_300_shift2));
  it("reset track: +2 from its change date (month 37), re-amortised over the remaining term", () =>
    close(runPlan([T({ balance: 350_000, rate: 4.8, months: 240, behavior: "reset", nextResetMonth: 37 })], { cpiAnnual: 0, primeShift: 0, resetShift: 2 }), ref.reset_350k_48_240_change37_shift2));
  it("fractional remaining term (119.5 months) is paid in 120 instalments", () =>
    close(runPlan([T({ balance: 200_000, rate: 4.1, months: 119.5 })], { cpiAnnual: 0, primeShift: 0, resetShift: 0 }), ref.fixed_200k_41_1195));
});
