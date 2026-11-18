import { describe, expect, it } from "vitest";
import { buildReturnMessage, readReturnMessage, RETURN_MESSAGE_TYPE } from "./paymentFrame";

const frame = {} as Window;
const other = {} as Window;
const ok = { origin: "https://easymorte.co.il", frame, caseId: "case-1" };
const msg = (data: unknown, origin = ok.origin, source: Window = frame) => ({ origin, source, data }) as unknown as MessageEvent;

describe("payment iframe messages", () => {
  it("builds a message only for a known result and case", () => {
    expect(buildReturnMessage("1", "case-1")).toEqual({ type: RETURN_MESSAGE_TYPE, paid: "1", caseId: "case-1" });
    expect(buildReturnMessage("yes", "case-1")).toBeNull();
    expect(buildReturnMessage("1", null)).toBeNull();
  });
  it("accepts our own message from our iframe about this case", () => {
    expect(readReturnMessage(msg(buildReturnMessage("1", "case-1")), ok)).toBe("1");
    expect(readReturnMessage(msg(buildReturnMessage("0", "case-1")), ok)).toBe("0");
  });
  it("rejects another origin, another window, another case or another shape", () => {
    const good = buildReturnMessage("1", "case-1");
    expect(readReturnMessage(msg(good, "https://secure.cardcom.solutions"), ok)).toBeNull();
    expect(readReturnMessage(msg(good, ok.origin, other), ok)).toBeNull();
    expect(readReturnMessage(msg(buildReturnMessage("1", "case-2")), ok)).toBeNull();
    expect(readReturnMessage(msg({ type: "other", paid: "1", caseId: "case-1" }), ok)).toBeNull();
    expect(readReturnMessage(msg({ type: RETURN_MESSAGE_TYPE, paid: "paid", caseId: "case-1" }), ok)).toBeNull();
    expect(readReturnMessage(msg("paid"), ok)).toBeNull();
    expect(readReturnMessage(msg(good), { ...ok, frame: null })).toBeNull();
  });
});
