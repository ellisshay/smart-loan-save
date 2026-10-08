import { describe, it, expect } from "vitest";
import { completedIntakeSteps } from "./intakeCompletion";

describe("saved intake completion", () => {
  it("retains completed steps regardless of the current step or reopening the case", () => {
    const saved = { income: { employmentStatus: "salaried", monthlyNetIncome: 25000, hasAdditionalIncome: "no", occupation: "מנהל" } };
    expect(completedIntakeSteps(JSON.parse(JSON.stringify(saved)), "new")).toEqual(["income"]);
  });
  it("does not mark a partial answer as a completed step", () => {
    expect(completedIntakeSteps({ personal: { borrowerCount: "1" }, income: { monthlyNetIncome: 25000 } }, "new")).toEqual([]);
  });
  it("reads refinance property from its saved refinance key", () => {
    const data = { refi_property: { estimatedValue: 2000000, hasRecentAppraisal: "no", propertyCity: "חיפה", isInvestment: "no" } };
    expect(completedIntakeSteps(data, "refi")).toEqual(["refi_property"]);
    expect(completedIntakeSteps(data, "new")).toEqual([]);
  });
  it("marks document handling complete only after all required documents are settled or deferred", () => {
    expect(completedIntakeSteps({ deferred_docs: ["purchase_contract"] }, "new", ["id_card", "payslips", "bank_statements"])).toEqual(["documents"]);
    expect(completedIntakeSteps({ deferred_docs: ["purchase_contract"] }, "new", ["id_card", "payslips"])).toEqual([]);
  });
});