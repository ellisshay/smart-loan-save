import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPayment from "./DashboardPayment";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn().mockResolvedValue({ data: { url: "https://secure.cardcom.solutions/test" }, error: null }) }));
const intake = { personal: { borrower1: { firstName: "דנה", lastName: "לוי", phone: "0501234567", email: "dana@example.com" } } };
vi.mock("@/hooks/useDashboardCase", () => ({ useDashboardCase: () => ({ caseId: "case-1", caseType: "new", intakeData: intake, intakeComplete: false, loading: false, staffMode: false }) }));
vi.mock("@/lib/docsComplete", () => ({ countMissingDocs: async () => 4 }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  functions: { invoke },
  auth: { getUser: async () => ({ data: { user: null } }) },
  from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { status: "Draft", payment_succeeded: false } }), maybeSingle: async () => ({ data: null }) }) }) }),
} }));

describe("payment billing details", () => {
  beforeEach(() => invoke.mockClear());

  it("prefills from the case, lets the client edit the invoice name, sends optional tax id", async () => {
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("שם על החשבונית")).toHaveValue("דנה לוי"));
    fireEvent.change(screen.getByLabelText("שם על החשבונית"), { target: { value: "לוי בע״מ" } });
    fireEvent.change(screen.getByLabelText(/ת.ז/), { target: { value: "514123456" } });
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("cardcom-payment-create", {
      body: { caseId: "case-1", origin: window.location.origin, billing: { firstName: "דנה", lastName: "לוי", invoiceName: "לוי בע״מ", email: "dana@example.com", phone: "0501234567", taxId: "514123456" } },
    }));
  });

  it("blocks checkout when the email is invalid", async () => {
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("מייל")).toHaveValue("dana@example.com"));
    fireEvent.change(screen.getByLabelText("מייל"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    await screen.findByText("כתובת מייל לא תקינה");
    expect(invoke).not.toHaveBeenCalled();
  });
});
