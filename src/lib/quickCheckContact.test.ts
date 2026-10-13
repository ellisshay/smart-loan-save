import { describe, expect, it } from "vitest";
import { formatAmount, parseAmount, quickCheckContactSchema } from "./quickCheckContact";

describe("quick check contact gate", () => {
  it("requires a name before mixes", () => {
    expect(quickCheckContactSchema.safeParse({ firstName: "", phone: "0501234567" }).success).toBe(false);
  });
  it("requires a valid phone before mixes", () => {
    expect(quickCheckContactSchema.safeParse({ firstName: "דנה", phone: "" }).success).toBe(false);
    expect(quickCheckContactSchema.safeParse({ firstName: "דנה", phone: "123" }).success).toBe(false);
  });
  it("normalizes an Israeli contact", () => {
    expect(quickCheckContactSchema.parse({ firstName: " דנה ", phone: "050-123-4567" })).toEqual({ firstName: "דנה", phone: "0501234567" });
  });
  it("keeps comma-separated amounts numeric", () => {
    expect(formatAmount(1400000)).toBe("1,400,000");
    expect(parseAmount("1,400,000")).toBe(1400000);
    expect(parseAmount("1e9")).toBeNull();
  });
});