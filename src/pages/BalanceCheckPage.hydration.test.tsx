import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The page is prerendered. Anything read from browser storage must be read after hydration (in an effect),
// never in a useState initializer, or the client first render differs from the server HTML and the draft is lost.
describe("balance check draft is read after hydration", () => {
  const src = readFileSync("src/pages/BalanceCheckPage.tsx", "utf8");
  it("does not read the draft in a useState initializer", () => {
    expect(src).not.toMatch(/useState\(readDraft\)/);
    expect(src).not.toMatch(/useState[^;]*draft\?\./);
  });
  it("restores the draft inside an effect", () => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*const draft = readDraft\(\);/);
  });
  it("never deletes the draft while reading it", () => {
    const read = src.slice(src.indexOf("function readDraft"), src.indexOf("function saveDraft"));
    expect(read).not.toMatch(/removeItem/);
  });
});
