import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { calculatorContent, landingContent } from "./landingContent";
import { NOT_FOUND_TITLE, PRIVATE_AREA_TITLE, buildFallbackBodyScript, buildFallbackHeadScript } from "./fallbackHead";
import { PRIVATE_PREFIXES } from "./config";
import { getArticle } from "@/data/knowledge";
import { getCluster } from "@/data/knowledge/clusters";

const HOME_TITLE = "משכנתא דיגיטלית, מחזור משכנתא ומכרז בנקים | EASY MORTE";

function domFor(url: string) {
  return new JSDOM(
    `<!doctype html><html><head>
      <title>${HOME_TITLE}</title>
      <meta name="robots" content="index,follow">
      <meta name="description" content="homepage">
      <link rel="canonical" href="https://easymorte.co.il/">
      <meta property="og:url" content="https://easymorte.co.il/">
      <meta property="og:title" content="${HOME_TITLE}">
      <script type="application/ld+json">{"@type":"WebSite"}</script>
    </head><body><div id="root" data-prerendered="/"><h1 id="home-headline">דף הבית</h1></div></body></html>`,
    { url, runScripts: "outside-only" },
  );
}

describe("plan 0001 copy", () => {
  it("fixes the refinance calculator wording in the visible FAQ", () => {
    const faqs = calculatorContent["/refinance-calculator"].faqs;
    const answer = faqs.find((item) => item.q.startsWith("מה זה מחשבון מחזור משכנתא"))?.a ?? "";
    expect(answer).toContain("הצעות מכמה בנקים");
    expect(answer).not.toContain("הצעות מקצה");
    expect(JSON.stringify(calculatorContent)).not.toContain("מקצה בנקים");
  });

  it("names the percent in the mortgage calculator guide", () => {
    const guide = calculatorContent["/mortgage-calculator"].guide?.paragraphs.join(" ") ?? "";
    expect(guide).toContain("עד כשלושים אחוז מההכנסה הנטו");
    expect(guide).not.toContain("עד כשלושים מההכנסה הנטו");
  });
});

describe("plan 0001 refinance cluster", () => {
  it("makes the worthiness guide the page for בדיקת מחזור משכנתא", () => {
    const article = getArticle("is-refinance-worth-it");
    expect(article?.title.startsWith("בדיקת מחזור משכנתא")).toBe(true);
    expect(article?.metaDescription).toContain("בדיקת מחזור משכנתא");
    expect(article?.updatedDate).toBe("2026-11-16");
    expect(article?.directAnswer).toContain("בדיקת מחזור משכנתא");
    expect(JSON.stringify(article)).not.toMatch(/[—–]/);
    const linked = JSON.stringify(article?.blocks);
    expect(linked).toContain("/refinance-calculator");
    expect(linked).toContain("/knowledge/refinance-guide");
    expect(landingContent["/mortgage-refinance"].links.some((link) => link.href === "/knowledge/is-refinance-worth-it")).toBe(true);
    expect(getCluster("refinance")?.description).toContain("בדיקת מחזור משכנתא");
  });
});

describe("fallback head for unknown URLs", () => {
  const headScript = buildFallbackHeadScript();
  const bodyScript = buildFallbackBodyScript();

  it("embeds every private prefix and does not close the script tag early", () => {
    for (const prefix of PRIVATE_PREFIXES) expect(headScript).toContain(prefix);
    expect(headScript).not.toContain("</script");
    expect(bodyScript).not.toContain("</script");
  });

  it("replaces the homepage title, canonical and index directive on an unknown URL", () => {
    const dom = domFor("https://easymorte.co.il/this-page-should-not-exist-seo-check-9f3a");
    dom.window.eval(headScript);
    dom.window.eval(bodyScript);
    const { document } = dom.window;
    expect(document.title).toBe(NOT_FOUND_TITLE);
    expect(document.querySelector("title")?.textContent).toBe(NOT_FOUND_TITLE);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(document.querySelector("#home-headline")).toBeNull();
    expect(document.querySelector("h1")?.textContent).toBe("העמוד לא נמצא");
    expect(document.getElementById("fallback-hide")).not.toBeNull();
  });

  it("leaves the real homepage untouched", () => {
    const dom = domFor("https://easymorte.co.il/");
    dom.window.eval(headScript);
    dom.window.eval(bodyScript);
    const { document } = dom.window;
    expect(document.title).toBe(HOME_TITLE);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://easymorte.co.il/");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("index,follow");
    expect(document.querySelector("#home-headline")).not.toBeNull();
  });

  it("noindexes a private deep link without labeling it as a missing page", () => {
    const dom = domFor("https://easymorte.co.il/dashboard/status");
    dom.window.eval(headScript);
    dom.window.eval(bodyScript);
    const { document } = dom.window;
    expect(document.title).toBe(PRIVATE_AREA_TITLE);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex,nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector("#home-headline")).not.toBeNull();
  });
});
