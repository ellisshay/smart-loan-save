// Contact form: the page only claims what actually happened, and the server saves before it emails.
import { readFileSync } from "node:fs";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateContact } from "../../supabase/functions/_shared/contactMessage";
import ContactPageBase from "@/pages/ContactPage";
import { MemoryRouter } from "react-router-dom";
// The page links to other pages, so it renders inside a router.
const ContactPage = () => <MemoryRouter><ContactPageBase /></MemoryRouter>;

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

const RID = "6f1f5f8e-2b7a-4c1e-9a1d-3c2b1a0f9e8d";
const ok = { request_id: RID, name: "דנה בדיקה", phone: "050-123 4567", email: "Dana@Example.co.il", message: "שאלה על מחזור" };

describe("validateContact (server-side rules)", () => {
  it("accepts a valid message and normalises phone and email", () => {
    const r = validateContact(ok);
    expect(r).toEqual({ ok: true, value: { ...ok, phone: "0501234567", email: "dana@example.co.il" } });
  });
  it("rejects each invalid field", () => {
    expect(validateContact({ ...ok, request_id: "x" })).toEqual({ ok: false, field: "request_id" });
    expect(validateContact({ ...ok, name: "ד" })).toEqual({ ok: false, field: "name" });
    expect(validateContact({ ...ok, phone: "12345" })).toEqual({ ok: false, field: "phone" });
    expect(validateContact({ ...ok, email: "not-an-email" })).toEqual({ ok: false, field: "email" });
    expect(validateContact({ ...ok, message: "" })).toEqual({ ok: false, field: "message" });
    expect(validateContact({ ...ok, message: "x".repeat(4001) })).toEqual({ ok: false, field: "message" });
    expect(validateContact(null)).toMatchObject({ ok: false });
  });
  it("flags the honeypot", () => {
    expect(validateContact({ ...ok, website: "http://spam" })).toEqual({ ok: false, field: "website" });
  });
});

function fill() {
  fireEvent.change(screen.getByLabelText("שם מלא"), { target: { value: "דנה בדיקה" } });
  fireEvent.change(screen.getByLabelText("טלפון"), { target: { value: "0501234567" } });
  fireEvent.change(screen.getByLabelText("אימייל"), { target: { value: "dana@example.co.il" } });
  fireEvent.change(screen.getByLabelText("הודעה"), { target: { value: "שאלה" } });
  fireEvent.click(screen.getByRole("button", { name: "שלח הודעה" }));
}
const httpError = (status: number, body: unknown) => ({
  data: null,
  error: { name: "FunctionsHttpError", context: new Response(JSON.stringify(body), { status }) },
});

describe("ContactPage", () => {
  beforeEach(() => invoke.mockReset());

  it("never shows success without calling the server", () => {
    render(<ContactPage />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("saved and emailed: says the message reached the team", async () => {
    invoke.mockResolvedValue({ data: { saved: true, emailed: true }, error: null });
    render(<ContactPage />);
    fill();
    expect(await screen.findByText("ההודעה התקבלה ונשלחה לצוות")).toBeTruthy();
    const [name, opts] = invoke.mock.calls[0];
    expect(name).toBe("contact-message");
    expect(opts.body).toMatchObject({ name: "דנה בדיקה", phone: "0501234567", email: "dana@example.co.il", message: "שאלה", website: "" });
    expect(opts.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("saved but the email failed: says saved, never 'sent'", async () => {
    invoke.mockResolvedValue({ data: { saved: true, emailed: false }, error: null });
    render(<ContactPage />);
    fill();
    expect(await screen.findByText("ההודעה נשמרה אצלנו")).toBeTruthy();
    expect(screen.queryByText(/נשלחה/)).toBeNull();
  });

  it("server failure: keeps the form, says nothing was saved, and a retry reuses the same request id", async () => {
    invoke.mockResolvedValueOnce(httpError(500, { saved: false, error: "server" }));
    render(<ContactPage />);
    fill();
    expect(await screen.findByText(/ההודעה לא נשלחה ולא נשמרה/)).toBeTruthy();
    expect(screen.getByLabelText("שם מלא")).toHaveProperty("value", "דנה בדיקה");
    invoke.mockResolvedValueOnce({ data: { saved: true, emailed: true }, error: null });
    fireEvent.click(screen.getByRole("button", { name: "שלח הודעה" }));
    await screen.findByText("ההודעה התקבלה ונשלחה לצוות");
    expect(invoke.mock.calls[1][1].body.request_id).toBe(invoke.mock.calls[0][1].body.request_id);
  });

  it("invalid input and rate limiting show their own messages", async () => {
    invoke.mockResolvedValueOnce(httpError(400, { saved: false, error: "invalid", field: "phone" }));
    render(<ContactPage />);
    fill();
    expect(await screen.findByText(/נא לבדוק את השדות/)).toBeTruthy();
    invoke.mockResolvedValueOnce(httpError(429, { saved: false, error: "rate_limited" }));
    fireEvent.click(screen.getByRole("button", { name: "שלח הודעה" }));
    expect(await screen.findByText(/יותר מדי פניות/)).toBeTruthy();
  });

  it("a network error (no response) is reported as not sent", async () => {
    invoke.mockResolvedValue({ data: null, error: { name: "FunctionsFetchError" } });
    render(<ContactPage />);
    fill();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/לא נשלחה ולא נשמרה/));
  });
});

describe("contact-message Edge Function (source guarantees)", () => {
  const src = readFileSync("supabase/functions/contact-message/index.ts", "utf8");
  it("validates, rate-limits and saves before it emails", () => {
    const at = (s: string) => src.indexOf(s);
    expect(at("validateContact(")).toBeGreaterThan(-1);
    expect(at("hit_rate_limit")).toBeLessThan(at('from("contact_messages").upsert'));
    expect(at('from("contact_messages").upsert')).toBeLessThan(at("sendEmail("));
  });
  it("is idempotent per request_id and never emails twice", () => {
    expect(src).toMatch(/onConflict: "request_id", ignoreDuplicates: true/);
    expect(src).toMatch(/if \(row\.email_status === "sent"\) return json\(\{ saved: true, emailed: true \}\)/);
  });
  it("records the email outcome separately and reports it honestly", () => {
    expect(src).toMatch(/email_status: emailed \? "sent" : "failed"/);
    expect(src).toMatch(/return json\(\{ saved: true, emailed \}\)/);
  });
  it("logs no message content, contact details or raw errors, and stores no raw IP", () => {
    expect(src).not.toMatch(/console\.[a-z]+\([^)]*\b(d|e|row)\)/);
    expect(src).not.toMatch(/console\.[a-z]+\([^)]*d\.(name|email|phone|message)/);
    expect(src).toMatch(/crypto\.subtle\.digest\("SHA-256"/);
  });
});
