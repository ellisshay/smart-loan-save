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

describe("embedded payment (#44)", () => {
  beforeEach(() => invoke.mockClear());

  async function openForm() {
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("שם על החשבונית")).toHaveValue("דנה לוי"));
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    return (await screen.findByTitle("טופס תשלום מאובטח של Cardcom")) as HTMLIFrameElement;
  }

  it("the form opens inside our page with a loading state until the provider page loads", async () => {
    const frame = await openForm();
    expect(frame.getAttribute("src")).toBe("https://secure.cardcom.solutions/test");
    expect(screen.getByText(/טוענים את טופס התשלום/)).toBeInTheDocument();
    fireEvent.load(frame);
    await waitFor(() => expect(screen.queryByText(/טוענים את טופס התשלום/)).toBeNull());
    expect(screen.getByText(/לא מגיעים לשרתים שלנו/)).toBeInTheDocument();
  });

  it("a forged message does nothing; our own return message starts a server check and never shows paid by itself", async () => {
    const frame = await openForm();
    window.dispatchEvent(new MessageEvent("message", { origin: "https://evil.test", source: frame.contentWindow, data: { type: "easymorte:cardcom-return", paid: "1", caseId: "case-1" } }));
    window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: window, data: { type: "easymorte:cardcom-return", paid: "1", caseId: "case-1" } }));
    expect(screen.getByTitle("טופס תשלום מאובטח של Cardcom")).toBeInTheDocument();
    window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow, data: { type: "easymorte:cardcom-return", paid: "1", caseId: "case-1" } }));
    await waitFor(() => expect(screen.queryByTitle("טופס תשלום מאובטח של Cardcom")).toBeNull());
    expect(screen.queryByText("התשלום אושר בהצלחה")).toBeNull();
  });

  it("a declined return shows the failure inline with a retry", async () => {
    const frame = await openForm();
    window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow, data: { type: "easymorte:cardcom-return", paid: "0", caseId: "case-1" } }));
    expect(await screen.findByText("התשלום לא הושלם")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /נסה שוב לשלם/ })).toBeInTheDocument();
  });

  it("when an earlier page may already be charged, no new form opens", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "payment_pending_verification" }), { status: 409 }) } });
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("שם על החשבונית")).toHaveValue("דנה לוי"));
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(screen.queryByTitle("טופס תשלום מאובטח של Cardcom")).toBeNull();
    expect(screen.queryByText("התשלום אושר בהצלחה")).toBeNull();
  });
});

describe("while the payment is being checked (#44)", () => {
  it("does not show the pay button, so the client cannot pay twice", async () => {
    render(<MemoryRouter><DashboardPayment /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("שם על החשבונית")).toHaveValue("דנה לוי"));
    fireEvent.click(screen.getByRole("button", { name: /לתשלום ₪3,450/ }));
    const frame = (await screen.findByTitle("טופס תשלום מאובטח של Cardcom")) as HTMLIFrameElement;
    window.dispatchEvent(new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow, data: { type: "easymorte:cardcom-return", paid: "1", caseId: "case-1" } }));
    expect(await screen.findByText("בודקים את התשלום מול Cardcom")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /לתשלום ₪3,450/ })).toBeNull();
    expect(screen.queryByText("התשלום אושר בהצלחה")).toBeNull();
  });
});
