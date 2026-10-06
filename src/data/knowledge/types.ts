export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  | { type: "example"; title: string; text: string }
  | { type: "note"; variant?: "info" | "warn"; title?: string; text: string };

export interface KnowledgeArticle {
  slug: string;
  clusterId: string;
  /** H1 – שאלה או כותרת עם כוונת חיפוש */
  title: string;
  metaTitle?: string;
  metaDescription: string;
  excerpt: string;
  /** תשובה קצרה וישירה בראש העמוד */
  directAnswer: string;
  readTime: number;
  updatedDate: string;
  author: string;
  imageKey?: "family" | "apartments" | "house";
  imageAlt?: string;
  isPillar?: boolean;
  blocks: Block[];
  takeaways?: string[];
  faqs: { q: string; a: string }[];
  calculator?: { label: string; href: string };
  related: string[];
  /** Authoritative external sources shown at the end of the article. */
  sources?: { label: string; url: string }[];
}

export interface CalculatorLink {
  label: string;
  href: string;
  desc: string;
}

export interface KnowledgeCluster {
  id: string;
  label: string;
  description: string;
  calculators?: CalculatorLink[];
}
