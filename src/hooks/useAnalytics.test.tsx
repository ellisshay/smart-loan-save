import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./useAnalytics";
import { trackGenerateLead } from "@/lib/analytics";

function clickLink(name: string) {
  const link = screen.getByRole("link", { name });
  link.addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(link);
}

function Probe() {
  useAnalytics();
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate("/pricing")}>go</button>
      <a href="tel:+972559961997">call</a>
      <a href="https://wa.me/972559961997">whatsapp</a>
      <a href="mailto:info@easymorte.co.il">mail</a>
    </>
  );
}

describe("analytics", () => {
  beforeEach(() => {
    delete window.gtag;
  });

  it("does not call gtag when the snippet is missing", () => {
    trackGenerateLead({ form_name: "contact" });
    render(<MemoryRouter><Probe /></MemoryRouter>);
    clickLink("call");
    expect(window.gtag).toBeUndefined();
  });

  it("skips the first page view and sends one after a route change", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(gtag).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("go"));
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "page_view", expect.objectContaining({ page_path: "/pricing" }));
  });

  it("records generate_lead for a saved form and for WhatsApp or phone clicks only", () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    window.history.pushState({}, "", "/contact");
    render(<MemoryRouter initialEntries={["/contact"]}><Probe /></MemoryRouter>);
    trackGenerateLead({ form_name: "contact" });
    clickLink("call");
    clickLink("whatsapp");
    clickLink("mail");
    expect(gtag.mock.calls).toEqual([
      ["event", "generate_lead", { form_name: "contact", page_path: "/contact" }],
      ["event", "generate_lead", { method: "phone", page_path: "/contact" }],
      ["event", "generate_lead", { method: "whatsapp", page_path: "/contact" }],
    ]);
  });
});
