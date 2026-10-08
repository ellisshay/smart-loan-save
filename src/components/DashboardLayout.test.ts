import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) },
}));

import { sideLinks } from "./DashboardLayout";
import { EXTERNAL_ADVISORS_ENABLED } from "@/lib/features";

describe("client-area sidebar while running fully in-house", () => {
  it("does not offer the advisor quote page", () => {
    expect(EXTERNAL_ADVISORS_ENABLED).toBe(false);
    expect(sideLinks.map((l) => l.href)).not.toContain("/dashboard/offers");
  });

  it("still offers the in-house tender page", () => {
    const tender = sideLinks.find((l) => l.href === "/dashboard/tender");
    expect(tender?.label).toBe("מכרז המשכנתא שלי");
  });
});
