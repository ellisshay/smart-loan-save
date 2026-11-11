// Admin sees every saved contact message, including ones whose email to info@ failed, and can mark it handled.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ContactMessages from "@/components/admin/ContactMessages";

const { rows, update } = vi.hoisted(() => ({ rows: { current: [] as unknown[] }, update: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => ({ limit: async () => ({ data: rows.current, error: null }) }) }),
      update: (patch: unknown) => ({ eq: async (_c: string, id: string) => (update(patch, id), { error: null }) }),
    }),
  },
}));

const base = { phone: "0501234567", email: "a@example.com", message: "שאלה על מחזור", handled_at: null };

describe("ContactMessages (admin)", () => {
  beforeEach(() => update.mockReset());

  it("lists messages and flags the ones whose email to info@ failed", async () => {
    rows.current = [
      { ...base, id: "1", created_at: "2026-11-11T08:00:00Z", name: "דנה", email_status: "failed" },
      { ...base, id: "2", created_at: "2026-11-11T07:00:00Z", name: "יוסי", email_status: "sent" },
    ];
    render(<ContactMessages />);
    expect(await screen.findByText("דנה")).toBeTruthy();
    expect(screen.getByText("יוסי")).toBeTruthy();
    expect(screen.getAllByText("המייל ל-info@ נכשל")).toHaveLength(1);
    expect(screen.getByText(/2 פתוחות/)).toBeTruthy();
  });

  it("marks a message handled (handled_at only)", async () => {
    rows.current = [{ ...base, id: "1", created_at: "2026-11-11T08:00:00Z", name: "דנה", email_status: "sent" }];
    render(<ContactMessages />);
    fireEvent.click(await screen.findByText("סמן כטופל"));
    await waitFor(() => expect(update).toHaveBeenCalled());
    const [patch, id] = update.mock.calls[0]!;
    expect(id).toBe("1");
    expect(Object.keys(patch as object)).toEqual(["handled_at"]);
  });

  it("empty state", async () => {
    rows.current = [];
    render(<ContactMessages />);
    expect(await screen.findByText("אין פניות עדיין")).toBeTruthy();
  });
});
