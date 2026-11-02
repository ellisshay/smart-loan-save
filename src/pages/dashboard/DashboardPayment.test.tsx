import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import DashboardPayment from "./DashboardPayment";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn().mockResolvedValue({ data: { url: "https://secure.cardcom.solutions/test" }, error: null }) }));
vi.mock("@/hooks/useDashboardCase", () => ({ useDashboardCase: () => ({ caseId: "unfinished-case", caseType: "new", intakeData: {}, intakeComplete: false, loading: false, staffMode: false }) }));
vi.mock("@/lib/docsComplete", () => ({ countMissingDocs: async () => 4 }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  functions: { invoke },
  from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { status: "Draft", payment_succeeded: false } }) }) }) }),
} }));

describe("payment before intake", () => {
  it("creates checkout for an incomplete case with no borrower or billing fields", async () => {
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("cardcom-payment-create", {
      body: { caseId: "unfinished-case", origin: window.location.origin, billing: { firstName: "", lastName: "", email: "", phone: "" } },
    }));
  });
});