import { describe, expect, it } from "vitest";
import { calculatorContent } from "./landingContent";

const c = calculatorContent["/calculators/rate-sensitivity"];
const text = [c.example, ...(c.guide?.paragraphs ?? [])].join("\n");
const pmt = (p: number, annual: number, n: number) => { const r = annual / 12; return (p * r) / (1 - (1 + r) ** -n); };

describe("rate and index guide", () => {
  it("interest example matches the arithmetic", () => {
    expect(Math.round(pmt(1_000_000, 0.05, 300))).toBe(5846);
    const before = pmt(400_000, 0.05, 300), after = pmt(400_000, 0.06, 300);
    expect([Math.round(before), Math.round(after), Math.round(after - before)]).toEqual([2338, 2577, 239]);
    for (const v of ["5,846", "2,338", "2,577", "239"]) expect(text).toContain(v);
  });

  it("index example matches the arithmetic (monthly indexation, constant 3% a year)", () => {
    const p0 = pmt(300_000, 0.035, 240), r = 0.035 / 12, m = 1.03 ** (1 / 12);
    let real = 300_000, idx = 1, b12 = 0, unindexed12 = 0;
    for (let k = 1; k <= 60; k++) {
      real -= p0 - real * r;
      idx *= m;
      if (k === 12) { b12 = real * idx; unindexed12 = real; }
    }
    expect(Math.round(p0)).toBe(1740);
    expect(Math.round(p0 * 1.03)).toBe(1792);
    expect(Math.round(p0 * idx)).toBe(2017);
    expect(Math.round(b12 / 100) * 100).toBe(298100);
    expect(Math.round(unindexed12 / 100) * 100).toBe(289500);
    for (const v of ["1,740", "1,792", "2,017", "298,100", "289,500"]) expect(text).toContain(v);
  });

  it("marks both examples as illustrations and has no dashes", () => {
    expect(text.match(/דוגמה להמחשה בלבד/g)?.length).toBe(2);
    expect(text).not.toMatch(/[-‐-―־!]/);
  });
});
