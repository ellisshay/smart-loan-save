import { describe, expect, it } from "vitest";
import { isPrivatePath, PRIVATE_PREFIXES } from "./config";
import { staticPages } from "./pages";

describe("SEO route boundaries", () => {
  for (const path of ["/auth", "/login", "/signup", "/my-cases", "/dashboard", "/admin", "/advisor", "/intake", "/questionnaire", "/results", "/mix-selection", "/documents", "/payment"]) {
    it(`excludes ${path} and its descendants from indexing`, () => {
      expect(PRIVATE_PREFIXES).toContain(path);
      expect(isPrivatePath(path)).toBe(true);
      expect(isPrivatePath(`${path}/child`)).toBe(true);
    });
  }
  it("includes the quick check in public prerender routes", () => {
    expect(staticPages.some((page) => page.path === "/mortgage-check")).toBe(true);
    expect(isPrivatePath("/mortgage-check")).toBe(false);
  });
  it("does not exclude public paths that merely share a private prefix", () => {
    expect(isPrivatePath("/mortgage-advisor")).toBe(false);
    expect(isPrivatePath("/authentication-guide")).toBe(false);
  });
  it("never lists private routes in the public sitemap source", () => {
    expect(staticPages.filter((page) => isPrivatePath(page.path))).toEqual([]);
  });
});