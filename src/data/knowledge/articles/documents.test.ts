import { describe, expect, it } from "vitest";
import { documentsArticles } from "./documents";

const a = documentsArticles.find((x) => x.slug === "documents-checklist")!;
const json = JSON.stringify(a);

describe("documents-checklist: preparing to compare offers (#33 round item 2)", () => {
  it("has a prep table that explains why each item is needed and where it comes from", () => {
    const i = a.blocks.findIndex((b) => b.type === "h2" && b.text === "מה להכין כדי לקבל הצעות שאפשר להשוות");
    expect(i).toBeGreaterThan(-1);
    const table = a.blocks.slice(i).find((b) => b.type === "table") as { headers: string[]; rows: string[][] };
    expect(table.headers).toEqual(["נתון", "לשם מה הוא נדרש להצעה", "מאיפה לוקחים"]);
    expect(table.rows.length).toBeGreaterThanOrEqual(5);
  });
  it("promises no approval and links to comparing offers and the bank tender", () => {
    expect(json).toContain("אינם התחייבות לאישור סופי");
    expect(json).toContain("/knowledge/how-to-compare-mortgage-offers-2027");
    expect(json).toContain("/mortgage-tender");
  });
  it("marks the example, drops unverified automation claims and has no dashes", () => {
    expect(json).toContain("דוגמה להמחשה בלבד");
    expect(json).not.toMatch(/מצליבה|בדיקת שלמות אוטומטית|בדיקת איכות ותוכן אוטומטית/);
    expect(json).not.toMatch(/[—–]/);
  });
});
