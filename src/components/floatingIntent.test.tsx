import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FloatingApplyButton from "./FloatingApplyButton";
import { whatsappMessageFor } from "./FloatingWhatsApp";

vi.mock("@/components/home/HomeFloatingActions", () => ({ default: () => null }));
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><FloatingApplyButton /></MemoryRouter>);

describe("floating actions follow the page's intent", () => {
  it("refinance pages lead to the free check of the existing mortgage", () => {
    for (const p of ["/mortgage-refinance", "/refinance-calculator", "/knowledge/is-refinance-worth-it"]) {
      const { unmount } = at(p);
      expect(screen.getByRole("link").getAttribute("href")).toBe("/balance-check");
      unmount();
    }
  });
  it("other service pages keep the new-mortgage check", () => {
    at("/first-mortgage");
    expect(screen.getByRole("link").getAttribute("href")).toBe("/mortgage-check");
  });
  it("WhatsApp names the service page topic, and stays generic elsewhere", () => {
    expect(whatsappMessageFor("/mortgage-refinance")).toContain("מחזור משכנתא");
    expect(whatsappMessageFor("/first-mortgage")).toContain("משכנתא ראשונה");
    expect(whatsappMessageFor("/mortgage")).toContain("משכנתא חדשה");
    expect(whatsappMessageFor("/mortgage-check")).toBe("שלום, אשמח לקבל מידע נוסף על שירותי EASY MORTE");
    expect(whatsappMessageFor("/knowledge/documents-checklist")).toBe("שלום, אשמח לקבל מידע נוסף על שירותי EASY MORTE");
  });
});
