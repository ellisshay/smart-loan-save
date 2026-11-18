import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StepIncome from "./StepIncome";

describe("intake invalid submission", () => {
  it("does not save incomplete income and returns focus to the missing field", async () => {
    vi.stubGlobal("CSS", { escape: (value: string) => value });
    Element.prototype.scrollIntoView = vi.fn();
    const onNext = vi.fn();
    const { container } = render(<StepIncome defaultValues={{ employmentStatus: "salaried", occupation: "", monthlyNetIncome: 25000, hasAdditionalIncome: "no" }} onNext={onNext} onBack={() => {}} saving={false} hasBorrower2={false} />);
    const form = container.querySelector("form");
    if (!form) throw new Error("Income form missing");
    fireEvent.submit(form);
    const dialog = await screen.findByRole("alertdialog");
    expect(onNext).not.toHaveBeenCalled();
    fireEvent.click(dialog.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(document.activeElement).toBe(container.querySelector('[name="occupation"]')));
    vi.unstubAllGlobals();
  });
});
describe("household income and second borrower", () => {
  const total = (c: HTMLElement) => c.textContent?.match(/סה״כ הכנסה נטו משק בית:\s*₪([\d,]+)/)?.[1];

  it("the shown total adds both borrowers and counts additional income only when marked yes", () => {
    const { container } = render(<StepIncome defaultValues={{ employmentStatus: "salaried", monthlyNetIncome: 49100, hasAdditionalIncome: "no", b2EmploymentStatus: "self_employed", b2MonthlyNetIncome: 35000, b2HasAdditionalIncome: "no" }} onNext={() => {}} onBack={() => {}} saving={false} hasBorrower2={true} />);
    expect(total(container)).toBe((84100).toLocaleString());
  });

  it("a removed second borrower no longer adds to the total", () => {
    const { container } = render(<StepIncome defaultValues={{ employmentStatus: "salaried", monthlyNetIncome: 20000, hasAdditionalIncome: "no", b2MonthlyNetIncome: 35000, b2HasAdditionalIncome: "yes", b2AdditionalIncomeAmount: 4000 }} onNext={() => {}} onBack={() => {}} saving={false} hasBorrower2={false} />);
    expect(total(container)).toBe((20000).toLocaleString());
  });

  it("a self employed second borrower is asked for the business, not an employer", () => {
    render(<StepIncome defaultValues={{ employmentStatus: "salaried", monthlyNetIncome: 20000, hasAdditionalIncome: "no", b2EmploymentStatus: "self_employed", b2MonthlyNetIncome: 35000 }} onNext={() => {}} onBack={() => {}} saving={false} hasBorrower2={true} />);
    expect(screen.getByText("שם העסק")).toBeInTheDocument();
    expect(screen.getByText("ותק עסק (חודשים)")).toBeInTheDocument();
  });

  it("a pensioner second borrower is not asked for a workplace", () => {
    render(<StepIncome defaultValues={{ employmentStatus: "salaried", monthlyNetIncome: 20000, hasAdditionalIncome: "no", b2EmploymentStatus: "pensioner", b2MonthlyNetIncome: 8000 }} onNext={() => {}} onBack={() => {}} saving={false} hasBorrower2={true} />);
    expect(screen.queryByText("שם העסק")).toBeNull();
    expect(container_has_label("הכנסה נטו חודשית (₪)")).toBe(true);
    expect(container_has_label("מקום עבודה")).toBe(false);
  });

  it("the button says where it leads, not that a result is ready", () => {
    render(<StepIncome defaultValues={{ employmentStatus: "salaried", monthlyNetIncome: 20000 }} onNext={() => {}} onBack={() => {}} saving={false} hasBorrower2={false} />);
    expect(screen.getByRole("button", { name: /המשך לשלב ההתחייבויות/ })).toBeInTheDocument();
    expect(screen.queryByText(/וקבל תוצאה/)).toBeNull();
  });
});

function container_has_label(text: string) {
  // Borrower 1 is salaried here and has its own "מקום עבודה" field; count only labels inside the borrower 2 section.
  const heading = [...document.querySelectorAll("h3")].find((h) => h.textContent?.includes("לווה 2"));
  const section = heading?.parentElement;
  return !!section && [...section.querySelectorAll("label")].some((l) => l.textContent?.trim() === text);
}
