import { describe, it, expect } from "vitest";
import { getPublicRoutes, redirects } from "@/entry-server";

describe("redirected paths", () => {
  it("are never prerendered or listed in the sitemap", () => {
    const paths = getPublicRoutes().map((r) => r.path);
    for (const from of Object.keys(redirects)) expect(paths).not.toContain(from);
  });
  it("blog refinance guide points to the knowledge guide", () => {
    expect(redirects["/blog/refinance-guide"]).toBe("/knowledge/refinance-guide");
    expect(getPublicRoutes().map((r) => r.path)).toContain("/knowledge/refinance-guide");
  });
});
