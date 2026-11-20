import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BalanceCheckPage from "./BalanceCheckPage";

let session: unknown = null;
const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, variable_5_linked: 3, cpi_annual: 2.5 };
const chain = { select: () => chain, order: () => chain, limit: () => chain, maybeSingle: () => Promise.resolve({ data: rates }) };
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => chain,
  auth: { getSession: () => Promise.resolve({ data: { session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
  functions: { invoke: vi.fn() },
} }));

describe("balance check: entered data survives signup (#52)", () => {
  beforeEach(() => { sessionStorage.clear(); session = null; });
  it("anonymous visitor enters tracks, goes to signup, and comes back to the result with the same data", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח");
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "fixed_l" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "420000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "3.4" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "18.5" } });
    fireEvent.click(screen.getByRole("button", { name: "לבדיקה הראשונית" }));
    const signup = await screen.findByRole("link", { name: "הרשמה וצפייה בבדיקה" });
    expect(signup.getAttribute("href")).toBe("/auth?next=/balance-check"); // nothing in the URL
    fireEvent.click(signup);
    expect(JSON.parse(sessionStorage.getItem("easymort_balance_draft")!)).toMatchObject({ show: true, tracks: [{ type: "fixed_l", balance: 420000, rate: 3.4, years: 18.5 }] });
    cleanup();

    session = { user: { id: "u" } }; // back from signup, logged in
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" })).toBeTruthy();
    expect(screen.getByLabelText("יתרה (₪)")).toHaveProperty("value", "420000");
    expect(screen.getByText(/המשכנתה שלכם: כ־420,000/)).toBeTruthy();
    expect(sessionStorage.getItem("easymort_balance_draft")).toBeNull(); // used once
  });
  it("a broken draft is ignored and the form starts empty", async () => {
    sessionStorage.setItem("easymort_balance_draft", "{not json");
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח");
    expect(screen.getByLabelText("יתרה (₪)")).toHaveProperty("value", "");
  });
});
