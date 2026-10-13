import { describe, it, expect } from "vitest";
import { personalSchema } from "./intake";

const b1 = { firstName: "דני", lastName: "כהן", idNumber: "000000018", birthDate: "1990-01-01", phone: "0501234567", email: "a@b.co", maritalStatus: "married" };
const b2 = { firstName: "רות", lastName: "כהן", idNumber: "000000026", birthDate: "1991-01-01", phone: "0501234568", maritalStatus: "married" };

describe("personal details rules", () => {
  it("second borrower completes without an email", () => {
    expect(personalSchema.safeParse({ borrowerCount: "2", hasGuarantor: "no", borrower1: b1, borrower2: b2 }).success).toBe(true);
  });
  it("main contact still needs an email", () => {
    const { email, ...noEmail } = b1;
    expect(personalSchema.safeParse({ borrowerCount: "1", hasGuarantor: "no", borrower1: noEmail }).success).toBe(false);
  });
  it("completes without a zip code and keeps a saved legacy one", () => {
    const r = personalSchema.safeParse({ borrowerCount: "1", hasGuarantor: "no", borrower1: { ...b1, zipCode: "4410000" } });
    expect(r.success && r.data.borrower1.zipCode).toBe("4410000");
  });
});
