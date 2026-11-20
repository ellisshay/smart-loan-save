import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import FloatingApplyButton from "./FloatingApplyButton";

describe("FloatingApplyButton (#52)", () => {
  it("is not shown on the balance check, where it covered the result and led to another flow", () => {
    const { container } = render(<MemoryRouter initialEntries={["/balance-check"]}><FloatingApplyButton /></MemoryRouter>);
    expect(container.textContent).toBe("");
  });
  it("still shows on calculators", () => {
    const { container } = render(<MemoryRouter initialEntries={["/calculators"]}><FloatingApplyButton /></MemoryRouter>);
    expect(container.textContent).toMatch(/בדיקת המשכנתא שלי/);
  });
});
