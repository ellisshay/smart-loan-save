// The public privacy policy must describe what the system actually does (SECURITY-B review).
import { describe, expect, it } from "vitest";
import { PRIVACY } from "@/data/legalTexts";
import { CONSENT_VERSIONS } from "@/lib/privacy";

describe("public privacy policy matches implementation", () => {
  it("states the version that consent is recorded against", () => {
    expect(PRIVACY).toContain(`גרסה ${CONSENT_VERSIONS.privacy_notice}`);
  });
  it("Quick Check: discloses first name, phone and optional email", () => {
    expect(PRIVACY).not.toContain("בלי שם, טלפון או מייל");
    expect(PRIVACY).toMatch(/3\.1 בבדיקה המהירה:[^]*שם פרטי וטלפון נייד/);
  });
  it("makes no unsupported retention or automatic-deletion claims", () => {
    expect(PRIVACY).not.toMatch(/7 שנים|שבע שנים|12 חודשים|לאחר מכן המידע נמחק/);
    expect(PRIVACY).toContain("אינו נמחק אוטומטית");
  });
  it("does not promise a separate payment consent that is never recorded", () => {
    expect(PRIVACY).not.toContain("בעת התשלום");
  });
  it("does not claim that every action is logged", () => {
    expect(PRIVACY).not.toMatch(/כל צפייה, העלאה, שינוי סטטוס והעברה/);
  });
  it("AI disclosure matches behavior: ID documents and signatures are not sent; other documents are sent whole", () => {
    expect(PRIVACY).toMatch(/מסמכי זיהוי \(תעודת זהות וספח\) וחתימות אינם מועברים לכלי בינה מלאכותית/);
    expect(PRIVACY).toMatch(/מספר תעודת\nזהות, תאריך לידה ופרטי קשר מהשאלון אינם נשלחים/);
    // analyze-document sends non-ID documents as images, so the policy must not claim ID numbers never reach AI.
    expect(PRIVACY).toMatch(/נשלח לבדיקה כפי שהוא/);
    expect(PRIVACY).not.toMatch(/מספרי תעודת זהות, תאריכי לידה, פרטי קשר וחתימות אינם מועברים/);
  });
  it("chat disclosure says the customer's chat messages are sent to the AI provider", () => {
    expect(PRIVACY).toMatch(/נשלחים תוכן ההודעות שכתבת בצ'אט/);
  });
  it("does not promise a fixed deletion time for the IP hash", () => {
    expect(PRIVACY).not.toMatch(/עד כיומיים/);
  });
  it("names external automation, email and AI processing", () => {
    expect(PRIVACY).toMatch(/Make\.com/);
    expect(PRIVACY).toMatch(/שליחת מיילים/);
    expect(PRIVACY).toMatch(/בינה מלאכותית/);
  });
});
