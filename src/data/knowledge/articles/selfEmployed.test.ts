import { describe, expect, it } from "vitest";
import { selfEmployedArticles } from "./selfEmployed";

const a = selfEmployedArticles.find((x) => x.slug === "self-employed-mortgage")!;
const reader = (o: unknown, key = ""): string[] => {
  if (["slug", "clusterId", "href", "imageKey", "related", "type", "variant", "updatedDate"].includes(key)) return [];
  if (typeof o === "string") return [o];
  if (Array.isArray(o)) return o.flatMap((v) => reader(v));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => reader(v, k));
  return [];
};

describe("self-employed-mortgage (#32 item 10)", () => {
  it("explains how to present income", () => {
    const i = a.blocks.findIndex((b) => b.type === "h2" && b.text.includes("איך מציגים את ההכנסה"));
    expect(i).toBeGreaterThan(-1);
    const list = a.blocks.slice(i).find((b) => b.type === "list");
    expect(list && "items" in list && list.items.length).toBeGreaterThanOrEqual(4);
  });

  it("marks every example as illustrative", () => {
    for (const b of a.blocks) if (b.type === "example") expect(b.title).toMatch(/^דוגמה להמחשה בלבד/);
  });

  it("reader text has no dashes or exclamation marks", () => {
    const bad = reader(a).filter((t) => /[-‐-―־!]/.test(t));
    expect(bad).toEqual([]);
  });

  it("makes no unsourced legal claim about equity", () => {
    expect(reader(a).join(" ")).not.toMatch(/על פי חוק|לפי חוק/);
  });
});
