import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, beforeEach } from "vitest";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle on prerendered pages", () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove("dark"); });
  it("does not read storage in the first render", () => {
    expect(readFileSync("src/components/ThemeToggle.tsx", "utf8")).not.toMatch(/useState\(\(\) =>[\s\S]*?localStorage/);
  });
  it("applies a saved dark preference after mount and does not overwrite it", async () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeToggle />);
    expect(await screen.findByLabelText("עבור למצב בהיר")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
