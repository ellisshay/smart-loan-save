import { describe, expect, it } from "vitest";
import { refinanceArticles } from "./refinance";
import { evaluate, refinance, BASE_ASSUMPTIONS, type EngineTrack } from "@/lib/mortgage/engine";
import { landingContent } from "@/seo/landingContent";

const a = refinanceArticles.find((x) => x.slug === "is-refinance-worth-it")!;
const json = JSON.stringify(a);
const fixed = (o: Partial<EngineTrack> = {}): EngineTrack => ({ id: "a", label: "קבועה", balance: 600000, rate: 5, months: 240, linked: false, behavior: "fixed", prepaymentFee: 12000, ...o });
const run = (base: EngineTrack[], rate: number, costs: number, cpi: number) =>
  evaluate(base, [refinance(base, "all", { rate, behavior: "fixed", linked: false, months: 240 }, costs)], BASE_ASSUMPTIONS(cpi));

describe("is-refinance-worth-it: every number comes from the site's engine (#33, 24.11)", () => {
  it("table: 4.4% saves on total cost, 4.8% lowers the payment but costs more", () => {
    const [b, low] = run([fixed()], 4.4, 6000, 2.5);
    const [, high] = run([fixed()], 4.8, 6000, 2.5);
    expect(Math.round(b!.base.firstPayment)).toBe(3960);
    expect(Math.round(low!.base.firstPayment)).toBe(3764);
    expect(Math.round(high!.base.firstPayment)).toBe(3894);
    expect(Math.round(b!.base.financeCost)).toBe(350336);
    expect(Math.round(low!.base.financeCost)).toBe(303260);
    expect(Math.round(high!.base.financeCost)).toBe(334499);
    expect(Math.round(low!.vsBaseline.totalCost!)).toBe(-29076);
    expect(Math.round(high!.vsBaseline.totalCost!)).toBe(2162);
    expect(low!.vsBaseline.breakEvenMonths).toBe(92);
    expect(high!.vsBaseline.breakEvenMonths).toBe(273);
    expect(high!.outcome).toBe("lower_payment_higher_total");
    for (const n of ["3,960", "3,764", "3,894", "350,336", "303,260", "334,499", "29,076", "2,162", "92 חודשים", "273 חודשים"]) expect(json).toContain(n);
  });
  it("CPI-linked example: the answer flips with the CPI assumption", () => {
    const linked = [fixed({ balance: 400000, rate: 3, linked: true, prepaymentFee: 8000 })];
    const [b, at25] = run(linked, 4.6, 6000, 2.5);
    const [, at15] = run(linked, 4.6, 6000, 1.5);
    expect(Math.round(b!.base.firstPayment)).toBe(2223);
    expect(Math.round(at25!.base.firstPayment)).toBe(2552);
    expect(Math.round(at25!.vsBaseline.totalCost!)).toBe(-62652);
    expect(Math.round(at15!.vsBaseline.totalCost!)).toBe(5980);
    for (const n of ["2,223", "2,552", "62,652", "5,980"]) expect(json).toContain(n);
  });
  it("marks the examples, keeps no unsourced thresholds or savings promises, has no dashes", () => {
    expect(json).toContain("דוגמה להמחשה בלבד");
    expect(json).not.toMatch(/4 עד 5 שנים|עשרות אלפי שקלים|מחזור ברור ומשתלם|שווה את הטרחה/);
    expect(json).not.toMatch(/[—–]/);
    expect(json).toContain("/balance-check");
  });
  it("the service page makes no savings promise and explains the CPI case", () => {
    const page = JSON.stringify(landingContent["/mortgage-refinance"]);
    expect(page).not.toContain("יכול לחסוך עשרות אלפי שקלים");
    expect(page).toContain("במסלול צמוד מדד ההחזר הראשון מטעה");
    expect(page).toContain("/knowledge/is-refinance-worth-it");
  });
});
