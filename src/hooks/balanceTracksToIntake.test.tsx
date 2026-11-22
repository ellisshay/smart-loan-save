import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { balanceTracksToCurrentMortgage, quizToIntake } from "@/hooks/useIntakeForm";
import StepCurrentMortgage from "@/components/intake/StepCurrentMortgage";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() }, rpc: vi.fn(), from: vi.fn() } }));
vi.mock("@/components/intake/IntakeAutosave", () => ({ useStepAutosave: () => undefined }));
afterEach(() => localStorage.clear());

describe("balance check tracks reach the intake without retyping (#52)", () => {
  it("maps known track types and linkage, sums the balance and takes the longest term", () => {
    const cm = balanceTracksToCurrentMortgage([
      { type: "prime", balance: 400000, rate: 5.5, years: 18 },
      { type: "fixed_l", balance: 300000, rate: 3.1, years: 22 },
      { type: "var5", balance: 100000, rate: 4.9, years: 10 },
    ])!;
    expect(cm.tracks).toEqual([
      { trackType: "prime", principalBalance: 400000, interestRate: 5.5, isIndexed: "no", remainingYears: 18 },
      { trackType: "fixed_l", principalBalance: 300000, interestRate: 3.1, isIndexed: "yes", remainingYears: 22 },
      { trackType: "variable_nl", principalBalance: 100000, interestRate: 4.9, isIndexed: "no", remainingYears: 10 },
    ]);
    expect(cm.totalBalance).toBe(800000);
    expect(cm.remainingYears).toBe(22);
    expect(cm.currentMonthlyPayment).toBeUndefined();
    expect(cm.currentBank).toBeUndefined();
  });

  it("does not guess: unknown type and linkage stay empty, a missing balance is not 0 and blocks the total", () => {
    const cm = balanceTracksToCurrentMortgage([
      { type: "unknown", balance: null, rate: 4.2, years: 15 },
      { type: "prime", balance: 200000, rate: null, years: null },
    ])!;
    expect(cm.tracks[0]).toEqual({ trackType: "", interestRate: 4.2, remainingYears: 15 });
    expect(cm.tracks[1]).toEqual({ trackType: "prime", principalBalance: 200000, isIndexed: "no" });
    expect(cm.totalBalance).toBeUndefined();
    expect(cm.remainingYears).toBe(15);
  });

  it("quizToIntake carries the saved balance check into the current mortgage step", () => {
    localStorage.setItem("easymort_balance_check", JSON.stringify({ id: "bc1", goal: "lower_payment", tracks: [{ type: "fixed_nl", balance: 500000, rate: 4.8, years: 20 }] }));
    const out = quizToIntake();
    expect(out.balance_check.id).toBe("bc1");
    expect(out.current_mortgage).toEqual({ tracks: [{ trackType: "fixed_nl", principalBalance: 500000, interestRate: 4.8, isIndexed: "no", remainingYears: 20 }], totalBalance: 500000, remainingYears: 20 });
  });

  it("the intake step shows the prefilled tracks and does not submit an unknown type as prime", async () => {
    const onNext = vi.fn();
    const cm = balanceTracksToCurrentMortgage([{ type: "unknown", balance: 250000, rate: 4, years: 12 }])!;
    const { container } = render(<StepCurrentMortgage defaultValues={cm} onNext={onNext} onBack={() => {}} saving={false} />);
    const typeSelect = container.querySelector('select[name="tracks.0.trackType"]') as HTMLSelectElement;
    const indexSelect = container.querySelector('select[name="tracks.0.isIndexed"]') as HTMLSelectElement;
    expect(typeSelect.value).toBe("");
    expect(indexSelect.value).toBe("");
    expect((container.querySelector('input[name="tracks.0.principalBalance"]') as HTMLInputElement).value).toBe("250000");
    expect((container.querySelector('input[name="totalBalance"]') as HTMLInputElement).value).toBe("250000");
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(typeSelect.getAttribute("aria-invalid")).toBe("true"));
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getAllByText("בחרו סוג מסלול...").length).toBe(1);
  });
});
