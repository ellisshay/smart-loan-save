import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import DashboardDocuments from "./DashboardDocuments";

const state = vi.hoisted(() => ({ paymentSucceeded: false }));
vi.mock("@/hooks/useDashboardCase", () => ({
  useDashboardCase: () => ({
    caseId: "test-case", caseType: "new", intakeData: {},
    intakeComplete: true, status: "WaitingForPayment",
    paymentSucceeded: state.paymentSucceeded, loading: false, saveStep: vi.fn(),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [] }) }) }) },
}));

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("documents payment navigation", () => {
  it("allows a completed questionnaire with zero documents to reach payment", async () => {
    state.paymentSucceeded = false;
    render(<MemoryRouter initialEntries={["/dashboard/documents"]}><DashboardDocuments /><Location /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: /לתשלום —/ }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/dashboard/payment"));
  });
});