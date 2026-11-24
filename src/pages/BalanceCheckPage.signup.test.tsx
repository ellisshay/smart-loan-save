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
  it("anonymous visitor sees the summary first; signup only to save, reopen or continue; data survives it", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח"); // report upload stays behind login
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "fixed_l" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "420000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "3.4" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "18.5" } });
    fireEvent.click(screen.getByRole("button", { name: "לבדיקה הראשונית" }));
    // The summary is visible without signing up.
    expect(await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" })).toBeTruthy();
    expect(screen.getByText(/המשכנתה שלכם: כ־420,000/)).toBeTruthy();
    expect(screen.queryByText("הבדיקה הראשונית מוכנה, נשאר רק להירשם")).toBeNull();
    // Saving needs signup; the data waits on this device, nothing in the URL.
    const save = screen.getByRole("link", { name: "שמירת הבדיקה באזור האישי" });
    expect(save.getAttribute("href")).toBe("/auth?next=/balance-check");
    fireEvent.click(save);
    expect(JSON.parse(sessionStorage.getItem("easymort_balance_draft")!)).toMatchObject({ show: true, tracks: [{ type: "fixed_l", balance: 420000, rate: 3.4, years: 18.5 }] });
    cleanup();

    session = { user: { id: "u" } }; // back from signup, logged in
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" })).toBeTruthy();
    expect(screen.getByLabelText("יתרה (₪)")).toHaveProperty("value", "420000");
    expect(screen.queryByRole("link", { name: "שמירת הבדיקה באזור האישי" })).toBeNull();
    // Reading the draft does not delete it: a refresh or back still finds it until the check is saved or cleared.
    expect(sessionStorage.getItem("easymort_balance_draft")).not.toBeNull();
  });
  it("continuing to the full check as an anonymous visitor goes through signup and carries tracks and goal", async () => {
    localStorage.clear();
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח");
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "prime" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "500000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "5.8" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "לבדיקה הראשונית" }));
    await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" });
    fireEvent.click(screen.getByRole("button", { name: "לסיים מוקדם יותר" }));
    fireEvent.click(screen.getByRole("button", { name: /ללא עלות|בחינם/ }));
    expect(JSON.parse(localStorage.getItem("easymort_balance_check")!)).toMatchObject({ goal: "early_payoff", tracks: [{ type: "prime", balance: 500000 }] });
    // Saved for the case: only now is the draft removed.
    expect(sessionStorage.getItem("easymort_balance_draft")).toBeNull();
  });
  it("keeps missing values missing across a refresh, and clears only on an explicit action", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח");
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "4.1" } });
    const saved = JSON.parse(sessionStorage.getItem("easymort_balance_draft")!);
    expect(saved.tracks[0]).toMatchObject({ balance: null, rate: 4.1, years: null });
    fireEvent.click(screen.getByRole("button", { name: "ניקוי הנתונים" }));
    expect(sessionStorage.getItem("easymort_balance_draft")).toBeNull();
  });
  it("a broken draft is ignored and the form starts empty", async () => {
    sessionStorage.setItem("easymort_balance_draft", "{not json");
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("הרשמה והעלאת הדוח");
    expect(screen.getByLabelText("יתרה (₪)")).toHaveProperty("value", "");
  });
});
