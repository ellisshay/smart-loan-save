import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ContactPage from "./ContactPage";
import { CONTACT_EMAIL } from "@/lib/contactEmail";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

const fill = () => {
  fireEvent.change(screen.getByLabelText("שם מלא"), { target: { value: "דנה כהן" } });
  fireEvent.change(screen.getByLabelText("טלפון"), { target: { value: "0559961997" } });
  fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "dana@example.com" } });
  fireEvent.change(screen.getByLabelText("הודעה"), { target: { value: "שאלה על מחזור" } });
};

describe("contact form", () => {
  it("shows the official mailbox and only confirms after the message is accepted", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: new Error("offline") });
    render(<ContactPage />);
    const mail = screen.getByRole("link", { name: CONTACT_EMAIL });
    expect(mail).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);

    fill();
    fireEvent.click(screen.getByRole("button", { name: "שלח הודעה" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("לא הצלחנו לשלוח");
    expect(screen.queryByText("ההודעה נשלחה!")).not.toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("contact-message", {
      body: { name: "דנה כהן", phone: "0559961997", email: "dana@example.com", message: "שאלה על מחזור" },
    });

    invoke.mockResolvedValueOnce({ data: { ok: true }, error: null });
    fireEvent.click(screen.getByRole("button", { name: "שלח הודעה" }));
    expect(await screen.findByText("ההודעה נשלחה!")).toBeInTheDocument();
  });
});
