import { describe, expect, it, beforeEach } from "vitest";
import { sanitize, cleanPath, track, trackOnce } from "./analytics";

type DL = { dataLayer?: Record<string, unknown>[] };

describe("analytics privacy", () => {
  beforeEach(() => { (window as unknown as DL).dataLayer = []; });

  it("keeps only whitelisted, non-identifying metadata", () => {
    expect(sanitize({ step: "income", case_type: "refi", calculator: "mortgage-calculator" }))
      .toEqual({ step: "income", case_type: "refi", calculator: "mortgage-calculator" });
    // financial / personal values never survive
    expect(sanitize({ salary: "25000", balance: 900000, name: "דנה", phone: "0521234567", email: "a@b.co", id_number: "123456789" })).toEqual({});
    expect(sanitize({ step: "1500000", source: "a@b", status: "שולם" })).toEqual({});
  });

  it("strips query strings and case ids from paths", () => {
    expect(cleanPath("/dashboard/tender?caseId=11111111-1111-1111-1111-111111111111")).toBe("/dashboard/tender");
    expect(cleanPath("/offer/11111111-1111-1111-1111-111111111111")).toBe("/offer/:id");
  });

  it("pushes prefixed events to dataLayer and ignores unknown events", () => {
    track("case_opened", { case_type: "new", income: "20000" });
    track("not_an_event" as never);
    expect((window as unknown as DL).dataLayer).toEqual([{ event: "em_case_opened", case_type: "new" }]);
  });

  it("trackOnce fires a single time per key", () => {
    trackOnce("k", "quick_check_start"); trackOnce("k", "quick_check_start");
    expect((window as unknown as DL).dataLayer!.length).toBe(1);
  });
});
