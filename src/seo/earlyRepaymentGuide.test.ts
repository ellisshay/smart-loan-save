import { describe, expect, it } from "vitest";
import { calculatorContent } from "./landingContent";

const c = calculatorContent["/calculators/early-repayment"];
const pmt = (p: number, annual: number, n: number) => { const r = annual / 12; return (p * r) / (1 - (1 + r) ** -n); };
const months = (p: number, annual: number, m: number) => { const r = annual / 12; return -Math.log(1 - (p * r) / m) / Math.log(1 + r); };

describe("early repayment guide", () => {
  const text = [c.example, ...(c.guide?.paragraphs ?? [])].join("\n");

  it("states numbers that match the arithmetic", () => {
    const m = pmt(700_000, 0.048, 240);
    const reduced = pmt(650_000, 0.048, 240);
    const n = months(650_000, 0.048, m);
    const saveShort = m * 240 - (m * n + 50_000);
    const saveReduce = m * 240 - (reduced * 240 + 50_000);
    expect(Math.round(m)).toBe(4543);
    expect(Math.round(reduced)).toBe(4218);
    expect(Math.round(n)).toBe(213);
    expect(Math.round(saveShort / 100) * 100).toBe(73600);
    expect(Math.round(saveReduce / 100) * 100).toBe(27900);
    for (const v of ["4,543", "4,218", "213", "73,600", "27,900", "324"]) expect(text).toContain(v);
  });

  it("marks the example, adds no fee figures and has no dashes", () => {
    expect(text).toContain("דוגמה להמחשה בלבד");
    expect(text).not.toMatch(/[-‐-―־!]/);
    expect(c.guide?.links?.map((l) => l.href)).toContain("/knowledge/early-repayment-fee");
  });
});
