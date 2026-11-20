import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { ResultView } from "./QuickCheckPage";
import { quizToIntake } from "@/hooks/useIntakeForm";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: vi.fn() }, rpc: vi.fn() } }));
const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, cpi_annual: 2.5 };
const a = { goal: "first" as const, value: 2_000_000, equity: 600_000, firstName: "", phone: "", income: 30_000, obligations: 0, balance: 0, currentPayment: 0, yearsLeft: 0, borrowers: "2" };
const nis = (v: number) => `₪${Math.round(v).toLocaleString("he-IL")}`;

describe("new mortgage: target payment and purchase costs (#52, #57 item 3)", () => {
  const view = () => render(<MemoryRouter><ResultView a={a} loan={1_400_000} years={25} refi={false} rates={rates} token="t" /></MemoryRouter>);
  it("unknown purchase costs are not assumed; entering them raises the loan the mixes are built on", () => {
    view();
    expect(screen.getByText(nis(1_400_000))).toBeTruthy();
    expect(screen.getByText(/עלויות הרכישה עוד לא ידועות ולא נכללו/)).toBeTruthy();
    const before = screen.getAllByText(/החזר חודשי משוער/)[0].nextSibling!.textContent;
    fireEvent.change(screen.getByLabelText(/עלויות רכישה מתוך ההון העצמי/), { target: { value: "120,000" } });
    expect(screen.getByText(nis(1_520_000))).toBeTruthy();
    expect(screen.getByText(/כולל ₪120,000 עלויות רכישה/)).toBeTruthy();
    expect(screen.getAllByText(/החזר חודשי משוער/)[0].nextSibling!.textContent).not.toBe(before);
  });
  it("target payment is judged per mix, including the stress test", () => {
    view();
    fireEvent.change(screen.getByLabelText(/החזר חודשי שנוח לכם/), { target: { value: "9,000" } });
    const verdicts = screen.getAllByText(/בתוך היעד|מעל היעד/).map((e) => e.textContent);
    expect(verdicts).toHaveLength(3);
    // 1.4M/25y (values from the engine): stable 8,129 -> 8,915 under stress; flexible 8,602 -> 9,925.
    expect(verdicts[0]).toBe("בתוך היעד שלכם גם בתרחיש הלחץ");
    expect(verdicts[2]).toBe("בתוך היעד היום, אבל חורג ממנו בתרחיש הלחץ");
  });
  it("LTV above the cap for the deal type is stated, not hidden", () => {
    view();
    fireEvent.change(screen.getByLabelText(/עלויות רכישה מתוך ההון העצמי/), { target: { value: "150,000" } });
    expect(screen.getByText(/מעל התקרה לסוג העסקה \(75%\)/)).toBeTruthy();
  });
  it("the target payment reaches the intake as the same question, asked once", () => {
    localStorage.setItem("easymort_quick_check", JSON.stringify({ answers: { ...a, targetPayment: 8600, purchaseCosts: 120000 } }));
    expect(quizToIntake().liabilities).toEqual({ maxDesiredPayment: 8600 });
    localStorage.clear();
  });
});
