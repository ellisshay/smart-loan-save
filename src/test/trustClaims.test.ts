// Guards against unsupported trust claims returning to customer-facing copy.
// Rule of thumb: prefer a precise factual statement over a stronger marketing claim.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..");
// Internal-only areas (staff tools, disabled advisor marketplace) and generated code are not customer copy.
const SKIP_DIRS = ["admin", "advisor", "integrations", "test"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return SKIP_DIRS.includes(name) ? [] : files(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

const sources = files(ROOT).map((p) => ({ path: relative(ROOT, p), lines: readFileSync(p, "utf8").split("\n") }));

/** Phrases that must not appear in customer-facing copy (unverified or explicitly disallowed). */
const FORBIDDEN: { re: RegExp; why: string; allow?: string[] }[] = [
  { re: /מוסדר ע/, why: "regulatory claim" },
  { re: /יועצים מורשים|יועץ מורשה/, why: "licensing claim" },
  { re: /SSL 256|256-bit/, why: "unverified security badge" },
  { re: /אלפי (לקוחות|משפחות|ישראלים)|חוסכים לישראלים/, why: "unsupported volume claim" },
  { re: /חיסכון ממוצע|חוסכים בממוצע|בממוצע ₪/, why: "unsupported savings statistic" },
  { re: /הצעות מכל הבנקים|כל הבנקים המובילים/, why: "use 'עד 3 בנקים רלוונטיים'" },
  { re: /100% דיגיטלי|כל תהליך המשכנתא.*דיגיטלי|לא צריך להגיע לפגישה|אף פעם לא צריך להגיע|משכנתא בקליק/, why: "the bank may require ID or signing" },
  { re: /צוות (המומחים|היועצים|יועצי)|עשרות מומחים|היועץ שלכם|היועץ שלך/, why: "no verified advisor team" },
  { re: /24\/7|זמינים תמיד|מענה בכל שעה/, why: "no documented support hours" },
  { re: /נבנה על ידי|About Digital/, why: "no third-party credits on EasyMorte" },
  { re: /תשלום רק אחרי שהמסמכים/, why: "payment can happen before documents" },
];

describe("trust claims in customer-facing copy", () => {
  for (const f of FORBIDDEN) {
    it(`does not contain: ${f.why}`, () => {
      const hits = sources.filter((s) => !f.allow?.includes(s.path))
        .flatMap((s) => s.lines.map((l, i) => (f.re.test(l) ? `${s.path}:${i + 1}` : null)).filter(Boolean));
      expect(hits).toEqual([]);
    });
  }

  it("72 hours is never tied to bank approval or bank offers", () => {
    const bad = sources.flatMap((s) => s.lines.map((l, i) => {
      if (!/72\s*שעות/.test(l)) return null;
      const tiedToBank = /הצעות תוך 72|אישור תוך 72|הבנק יאשר.*72|מקבלים הצעות.*72/.test(l);
      const negated = /לא נכון|אינם|לא מבטיח|לא בשליטת/.test(l);
      return tiedToBank && !negated ? `${s.path}:${i + 1}` : null;
    }).filter(Boolean));
    expect(bad).toEqual([]);
  });

  it("homepage carries the approved primary message and CTAs", () => {
    const home = sources.find((s) => s.path === "pages/HomePage.tsx")!.lines.join("\n");
    expect(home).toContain("10 דקות באתר.");
    expect(home).toMatch(/ואנחנו נכנסים[\s\S]{0,120}לעבודה\./); // the H1 may split the line with markup
    expect(home).toContain("פתיחת תיק");
    expect(home).toContain("בדיקת המשכנתא שלי בחינם");
    expect(home).not.toMatch(/sampleOffers|ההצעה הטובה ביותר/);
  });
});
