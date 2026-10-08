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