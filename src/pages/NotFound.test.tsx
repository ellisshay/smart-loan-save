import { render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NotFound from "./NotFound";
import { NOT_FOUND_TITLE } from "@/seo/fallbackHead";

describe("NotFound page", () => {
  it("uses its own title and noindex, without a canonical", async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/this-page-should-not-exist"]}>
          <NotFound />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("העמוד לא נמצא");
    await waitFor(() => {
      expect(document.title).toBe(NOT_FOUND_TITLE);
      expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
    });
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
