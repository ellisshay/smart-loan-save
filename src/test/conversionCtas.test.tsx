// Renders the homepage and every service page and checks the critical CTAs point where they should.
import { describe, expect, it, vi, beforeAll } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    functions: { invoke: async () => ({ data: null, error: null }) },
    from: () => ({ select: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }),
  },
}));

import HomePage from "@/pages/HomePage";
import ServiceLandingPage from "@/pages/ServiceLandingPage";

beforeAll(() => {
  // framer-motion's whileInView needs IntersectionObserver, which jsdom lacks.
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO;
});

const hrefsFor = (name: string) =>
  screen.getAllByRole("link", { name }).map((a) => a.getAttribute("href"));

describe("homepage CTAs", () => {
  it("hero leads with 'פתיחת תיק' to /intake and the free check to /mortgage-check", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("10 דקות באתר.");
    expect(hrefsFor("פתיחת תיק").every((h) => h === "/intake")).toBe(true);
    expect(hrefsFor("בדיקת המשכנתא שלי בחינם").every((h) => h === "/mortgage-check")).toBe(true);
    expect(hrefsFor("פתיחת תיק").length).toBeGreaterThanOrEqual(2); // hero + final CTA
  });

  it("has no sample bank offers or winning-bank label", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.queryByText(/ההצעה הטובה ביותר|בחירת הצעה|ריבית ממוצעת/)).toBeNull();
    expect(screen.queryByText(/הצעות מהבנקים$/)).toBeNull();
    cleanup();
  });
});

const SERVICE = {
  "/first-mortgage": "/calculators/affordability",
  "/mortgage": "/calculators/affordability",
  "/mortgage-refinance": "/balance-check",
  "/mortgage-advisor": "/mortgage-check",
  "/mortgage-tender": "/mortgage-check",
} as const;

describe("service page CTA integrity", () => {
  for (const [path, secondary] of Object.entries(SERVICE)) {
    it(`${path}: H1, facts, primary /intake and secondary ${secondary}`, () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes><Route path="*" element={<ServiceLandingPage />} /></Routes>
        </MemoryRouter>,
      );
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
      expect(screen.getByText("מחיר קבוע 3,450 ₪")).toBeTruthy();
      expect(screen.getByText("פנייה לעד 3 בנקים רלוונטיים")).toBeTruthy();
      expect(hrefsFor("פתיחת תיק").every((h) => h === "/intake")).toBe(true);
      const final = screen.getByTestId("service-final-cta");
      const finalLinks = within(final).getAllByRole("link").map((a) => a.getAttribute("href"));
      expect(finalLinks).toEqual(["/intake", secondary]);
      expect(screen.getByText(/נכתב על ידי EasyMorte/)).toBeTruthy();
      cleanup();
    });
  }
});
