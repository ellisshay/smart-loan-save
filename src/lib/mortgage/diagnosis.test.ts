import { describe, it, expect } from "vitest";
import { diagnose } from "./diagnosis";

const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, variable_5_linked: 3, cpi_annual: 2.5 };

describe("diagnosis summary (#52)", () => {
  it("empty input: no cards, no invented findings", () => {
    const d = diagnose([{ type: "prime", balance: null, rate: null, years: null }], rates);
    expect(d.state).toBe("empty");
    expect(d.findings).toEqual([]);
  });
  it("a plain fixed unlinked mortgage near reference: no forced negative finding", () => {
    const d = diagnose([{ type: "fixed_nl", balance: 400_000, rate: 5.1, years: 12 }], rates);
    expect(d.findings).toEqual([]);
    expect(d.headline).toMatch(/לא זיהינו חשיפה בולטת/);
    expect(d.state).toBe("ready");
  });
  it("at most three findings, most important first, based on the data", () => {
    const d = diagnose([
      { type: "fixed_l", balance: 300_000, rate: 3.4, years: 22 },
      { type: "prime", balance: 250_000, rate: 5.6, years: 22 },
      { type: "var5", balance: 150_000, rate: 5.9, years: 22 },
      { type: "fixed_nl", balance: 100_000, rate: 6.1, years: 22 },
    ], rates);
    expect(d.findings.length).toBeLessThanOrEqual(3);
    // Weights: 69% of the balance above reference, 50% variable, 37.5% linked.
    expect(d.findings.map((f) => f.key)).toEqual(["rate_gap", "variable", "linkage"]);
    expect(d.suggestedGoal).toBe("lower_total");
  });
  it("projected indexation is described as a forecast, not money lost; balance card says what the amount is", () => {
    const d = diagnose([{ type: "fixed_l", balance: 300_000, rate: 3, years: 15 }], rates);
    const f = d.findings.find((x) => x.key === "linkage")!;
    expect(f.detail).toMatch(/תחזית לפי הנחה, לא כסף ששולם או אבד/);
    expect(d.cards.find((c) => c.key === "balance")!.note).toMatch(/קרן כולל הפרשי הצמדה/);
    expect(d.assumptions.join(" ")).toMatch(/2.5%/);
  });
  it("a rate below reference is not turned into advice to keep the track", () => {
    const d = diagnose([{ type: "fixed_nl", balance: 400_000, rate: 3, years: 12 }], rates);
    expect(JSON.stringify(d)).not.toMatch(/כדאי לשמור|לשמור את המסלול/);
  });
  it("missing data: partial state, listed, and not counted as zero", () => {
    const d = diagnose([{ type: "fixed_nl", balance: 400_000, rate: 5, years: 12 }, { type: "prime", balance: 100_000, rate: null, years: 12 }], rates);
    expect(d.state).toBe("partial");
    expect(d.missing).toEqual(["נתונים חסרים במסלול אחד"]);
    expect(d.findings.at(-1)!.key).toBe("missing");
    expect(d.cards[0].value).toBe(`${(400_000).toLocaleString("he-IL")} ₪`);
  });
  it("linked track without a CPI assumption: no linkage finding is computed", () => {
    const d = diagnose([{ type: "fixed_l", balance: 300_000, rate: 3, years: 15 }], { ...rates, cpi_annual: null });
    expect(d.findings.some((f) => f.key === "linkage")).toBe(false);
    expect(d.missing).toContain("הנחת מדד");
  });
  it("uses the report's last payment when available", () => {
    const d = diagnose([{ type: "fixed_nl", balance: 400_000, rate: 5, years: 12 }], rates, { lastPaymentTotal: 3_980 });
    expect(d.cards.find((c) => c.key === "payment")).toMatchObject({ label: "החזר אחרון לפי הדוח" });
  });
});
