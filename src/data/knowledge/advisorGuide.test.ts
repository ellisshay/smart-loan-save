import { describe, expect, it } from "vitest";
import { advisorArticles } from "./articles/advisor";
import { landingContent } from "@/seo/landingContent";

const DASH = /[-‐-―־]/;
const article = advisorArticles.find((a) => a.slug === "do-you-need-advisor")!;

function readerText(): string[] {
  const out = [article.title, article.metaTitle ?? "", article.metaDescription, article.excerpt, article.directAnswer];
  for (const b of article.blocks) {
    if ("text" in b) out.push(b.text);
    if ("title" in b && b.title) out.push(b.title);
    if (b.type === "list") out.push(...b.items);
  }
  out.push(...(article.takeaways ?? []));
  for (const f of article.faqs) out.push(f.q, f.a);
  return out;
}

describe("do-you-need-advisor guide", () => {
  it("keeps reader text free of dashes", () => {
    expect(readerText().filter((t) => DASH.test(t))).toEqual([]);
  });

  it("marks the numeric example as an illustration and makes no rate promise", () => {
    const example = article.blocks.find((b) => b.type === "example");
    expect(example && "title" in example ? example.title : "").toContain("להמחשה");
    expect(readerText().join(" ")).not.toMatch(/מבטיחים|מובטח לכם|בדרך כלל כן/);
  });

  it("is linked from the mortgage-advisor service page", () => {
    const hrefs = (landingContent["/mortgage-advisor"].guides ?? []).map((g) => g.href);
    expect(hrefs).toContain("/knowledge/do-you-need-advisor");
  });
});
