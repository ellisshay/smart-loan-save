import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BalanceCheckPage from "./BalanceCheckPage";

const rates = { prime: 6, fixed_not_linked: 5, fixed_linked: 3, variable_5: 5, variable_5_linked: 3, updated_at: "2026-10-01T00:00:00Z" };
const chain = { select: () => chain, order: () => chain, limit: () => chain, maybeSingle: () => Promise.resolve({ data: rates }) };
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => chain,
  auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: "u" } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
  functions: { invoke: vi.fn() },
} }));

const results = async () => {
  fireEvent.click(screen.getByRole("button", { name: "לבדיקה הראשונית" }));
  return (await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" })).closest("section")!;
};

beforeEach(() => sessionStorage.clear());

describe("BalanceCheckPage (#52)", () => {
  it("with no data: no ₪0 saving, missing fields named, a free completion CTA", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("בחירת קובץ");
    const s = await results();
    expect(s.textContent).not.toMatch(/0 ₪/);
    expect(within(s).getByText("לא חישבנו סכום חיסכון")).toBeTruthy();
    expect(within(s).getByText(/חסר: יתרה, ריבית, תקופה שנותרה/)).toBeTruthy();
    expect(within(s).getByRole("button", { name: "השלימו איתנו את הבדיקה בחינם" })).toBeTruthy();
    expect(s.textContent).not.toMatch(/נראה יעיל/);
  });
  it("good terms: flagged to keep, no saving claimed, still a free next step", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("בחירת קובץ");
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "400000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "3.1" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "15.5" } });
    const s = await results();
    expect(within(s).getByText("הריבית נמוכה מנתון הייחוס")).toBeTruthy();
    expect(within(s).getByText("לא חישבנו סכום חיסכון")).toBeTruthy();
    expect(within(s).getByRole("button", { name: "בדקו איתנו מה אפשר לשפר, ללא עלות" })).toBeTruthy();
    expect(s.textContent).not.toMatch(/3,450/);
  });
  it("linked track: asks for a linkage review instead of a shekel figure", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("בחירת קובץ");
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "fixed_l" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "300000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "4.5" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "20" } });
    const s = await results();
    expect(within(s).getByText("מסלול צמוד: נדרשת בחינת הצמדה")).toBeTruthy();
    expect(s.textContent).not.toMatch(/תרחיש: באותה יתרה/);
  });
});

describe("BalanceCheckPage: extracted report (#52 stage 2)", () => {
  it("shows the reconciliation status, issues and page sources; sends no file name", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const invoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;
    invoke.mockResolvedValueOnce({ data: {
      analysis_id: "a-1", status: "needs_completion",
      issues: [{ code: "missing_critical", severity: "missing", path: "tracks.1.current_rate", message: "חסר: ריבית נוכחית" }, { code: "negative_fee", severity: "info", path: "x", message: "זיכוי עמלה: סכום שלילי בדוח. זה לא מענק ללקוח" }],
      tracks: [{ type: "fixed_nl", balance: 250000, rate: 4.1, years: 15.58, pages: [2] }, { type: "unknown", balance: 200000, rate: null, years: 15.58, pages: [2] }],
    }, error: null });
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    const input = (await screen.findByText("בחירת קובץ")).closest("label")!.querySelector("input")!;
    fireEvent.change(input, { target: { files: [new File(["%PDF"], "private-name.pdf", { type: "application/pdf" })] } });
    expect(await screen.findByText(/חלק מהנתונים לא נמצאו בדוח/)).toBeTruthy();
    expect(screen.getByText("• חסר: ריבית נוכחית")).toBeTruthy();
    expect(JSON.stringify(invoke.mock.calls[0][1])).not.toContain("private-name");
    const s = (await screen.findByRole("heading", { name: "הבדיקה הראשונית שלכם" })).closest("section")!;
    expect(within(s).getAllByText(/מקור בדוח: עמ׳ 2/)).toHaveLength(2);
    expect(within(s).getByText(/חסר: סוג מסלול, ריבית/)).toBeTruthy();
  });
});

describe("BalanceCheckPage: alternatives against the baseline (#52 stage 3)", () => {
  it("shows the baseline first, flags extension as not a saving, and keeps unknown costs unknown", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("בחירת קובץ");
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "fixed_nl" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "500000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "6.2" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "20" } });
    const s = await results();
    const items = within(s).getAllByRole("listitem").filter((li) => li.className.includes("border-2"));
    expect(within(items[0]).getByText("המשך המשכנתה הקיימת")).toBeTruthy();
    const ext = items.find((li) => li.textContent!.includes("הארכת התקופה"))!;
    expect(ext.textContent).toMatch(/זה לא חיסכון/);
    expect(ext.textContent).toMatch(/עלות כוללת גבוהה לפחות ב־/);
    const full = items.find((li) => li.textContent!.includes("מחזור מלא"))!;
    expect(full.textContent).toMatch(/לא ניתן לקבוע \(חסר: עמלת פירעון מוקדם, עלויות מעבר/);
    expect(s.textContent).not.toMatch(/חיסכון של/);
  });
});

describe("BalanceCheckPage: personal summary first (#52 owner feedback)", () => {
  it("summary, cards and findings come before the per-track detail; the goal travels with the free check", async () => {
    render(<MemoryRouter><BalanceCheckPage /></MemoryRouter>);
    await screen.findByText("בחירת קובץ");
    fireEvent.change(screen.getByLabelText("סוג מסלול"), { target: { value: "prime" } });
    fireEvent.change(screen.getByLabelText("יתרה (₪)"), { target: { value: "600000" } });
    fireEvent.change(screen.getByLabelText("ריבית (%)"), { target: { value: "5.8" } });
    fireEvent.change(screen.getByLabelText("שנים שנותרו"), { target: { value: "22" } });
    const s = await results();
    const text = s.textContent!;
    expect(text.indexOf("המשכנתה שלכם:")).toBeLessThan(text.indexOf("פירוט לפי מסלול"));
    expect(within(s).getByText("חלק בריבית משתנה")).toBeTruthy();
    const findings = within(s).getByRole("list", { name: "ממצאים עיקריים" });
    expect(within(findings).getAllByRole("listitem").length).toBeLessThanOrEqual(3);
    expect(findings.textContent).toMatch(/בריבית משתנה/);
    // The data editor is folded once the result is shown.
    expect(screen.getByText(/צפייה ועריכת הנתונים/).closest("details")).toBeTruthy();
    fireEvent.click(within(s).getByRole("button", { name: "לסיים מוקדם יותר" }));
    fireEvent.click(within(s).getByRole("button", { name: "בדקו איתנו מה אפשר לשפר, ללא עלות" }));
    const saved = JSON.parse(localStorage.getItem("easymort_balance_check")!);
    expect(saved).toMatchObject({ goal: "early_payoff", tracks: [{ type: "prime", balance: 600000, rate: 5.8, years: 22 }] });
    expect(window.location.search).toBe("");
  });
});
