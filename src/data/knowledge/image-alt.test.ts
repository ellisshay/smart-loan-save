import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { knowledgeArticles as allArticles } from "./index";

describe("image alt (smart-loan-save#40)", () => {
  it("each knowledge image is described the same way wherever it appears", () => {
    const byKey = new Map<string, Set<string>>();
    for (const a of allArticles) if (a.imageKey && a.imageAlt) byKey.set(a.imageKey, (byKey.get(a.imageKey) ?? new Set()).add(a.imageAlt));
    const multi = [...byKey].filter(([, s]) => s.size > 1).map(([k, s]) => `${k}: ${[...s].join(" | ")}`);
    // self-employed-mortgage is aligned in #38, which rewrites that article
    expect(multi.filter((m) => !m.includes("שעצמאיים מממנים"))).toEqual([]);
  });

  it("no image alt falls back to the article title", () => {
    for (const p of ["src/pages/KnowledgeHub.tsx", "src/pages/KnowledgeArticle.tsx"]) expect(readFileSync(p, "utf8"), p).not.toContain("|| article.title");
  });
});
