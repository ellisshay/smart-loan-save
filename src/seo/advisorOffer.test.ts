import { describe, expect, it } from "vitest";
import { landingContent } from "./landingContent";

const c = landingContent["/mortgage-advisor"];

describe("/mortgage-advisor: first step and payment are clear", () => {
  it("leads first to the free check, without commitment", () => {
    expect(c.cta).toEqual(expect.objectContaining({ href: "/mortgage-check", label: "התחילו בבדיקה חינמית של המשכנתא" }));
    expect(c.cta!.closing).toContain("לא מחייבת");
  });
  it("says when and how payment happens, consistent with the payment screen", () => {
    const f = c.faqs.find((x) => x.q === "מתי משלמים, ואיך?")!;
    expect(f.a).toContain("אחרי שממלאים את השאלון");
    expect(f.a).toContain("3,450 ₪ כולל מע״מ");
    expect(f.a).not.toMatch(/\d+ תשלומים|[—–]/);
  });
});
