import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import StepLiabilities from "./StepLiabilities";
import StepDeclarations from "./StepDeclarations";
import { liabilitiesSchema } from "@/types/intake";
import { DECLARATION_QUESTIONS } from "@/lib/declarationQuestions";

vi.mock("@/hooks/useDashboardCase", () => ({
  useDashboardCase: () => ({
    caseId: "c1", caseType: "new", loading: false, saving: false, saveStep: vi.fn(),
    intakeData: { declarations: { hasExecutionFile: "yes", hasLegalProceedings: "no", hasBankruptcy: "no", hasRestrictedAccount: "no", hasBouncedChecks: "no" } },
  }),
}));
import DashboardDeclarations from "@/pages/dashboard/DashboardDeclarations";

class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;

const countText = (re: RegExp) => (document.body.textContent?.match(re) || []).length;

describe("enforcement and bankruptcy are asked once (#44)", () => {
  it("the liabilities step no longer asks about legal proceedings or enforcement", () => {
    render(<StepLiabilities defaultValues={{}} onNext={() => {}} onBack={() => {}} saving={false} totalIncome={20000} />);
    expect(screen.queryByText(/הוצל״פ|הוצאה לפועל|הליכים משפטיים/)).toBeNull();
    expect(screen.getByText(/חובות בפיגור/)).toBeInTheDocument();
  });

  it("liabilities saved before the change, with the old answer, still load; new ones need no answer", () => {
    const base = { existingLoanPayments: 0, hasSignificantCreditCards: "no", hasDelinquentDebt: "no", maxDesiredPayment: 5000, mainGoal: "stability", riskLevel: "low" };
    expect(liabilitiesSchema.safeParse({ ...base, hasLegalProceedings: "yes" }).success).toBe(true);
    const parsed = liabilitiesSchema.safeParse(base);
    if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues.map((i) => i.path.join("."))));
    expect(parsed.success).toBe(true);
  });

  it("the declarations step asks each topic once, enforcement and bankruptcy as separate questions", () => {
    render(<StepDeclarations defaultValues={{}} onNext={() => {}} onBack={() => {}} saving={false} />);
    expect(countText(/תיק הוצאה לפועל פתוח/g)).toBe(1);
    expect(countText(/חדלות פירעון \(פשיטת רגל\)/g)).toBe(1);
    expect(countText(/הליך משפטי אחר/g)).toBe(1);
  });

  it("an earlier answer is shown for editing, and the truthfulness confirmation is never ticked for the client", () => {
    const { container } = render(<StepDeclarations defaultValues={{ hasExecutionFile: "yes", hasBankruptcy: "no" }} onNext={() => {}} onBack={() => {}} saving={false} />);
    expect((container.querySelector('select[name="hasExecutionFile"]') as HTMLSelectElement).value).toBe("yes");
    expect((container.querySelector('select[name="hasBankruptcy"]') as HTMLSelectElement).value).toBe("no");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("the dashboard uses exactly the same questions as the questionnaire", () => {
    render(<MemoryRouter><DashboardDeclarations /></MemoryRouter>);
    for (const q of DECLARATION_QUESTIONS) expect(screen.getByText(q.label)).toBeInTheDocument();
    expect((document.querySelector('select[name="hasExecutionFile"]') as HTMLSelectElement).value).toBe("yes");
  });
});
