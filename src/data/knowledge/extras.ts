import type { KnowledgeArticle } from "./types";

type Extra = { faqs: { q: string; a: string }[]; links: { label: string; href: string }[] };

/** Extra FAQ items (merged into FAQPage JSON-LD) and contextual links for existing guides. */
const extras: Record<string, Extra> = {
  "what-bank-checks-before-mortgage": {
    faqs: [
      { q: "האם הבנק בודק גם את הלווה השני?", a: "כן. כל מי שרשום כלווה נבדק: הכנסה, התחייבויות ומסמכים. ההכנסה המשותפת והחובות המשותפים קובעים יחד את יכולת ההחזר." },
      { q: "האם אפשר להתכונן לבדיקות הבנק מראש?", a: "כן. מרכזים תלושים, דפי חשבון ואישורי הון עצמי, סוגרים חובות קטנים במידת האפשר ומחשבים יחס החזר לפני חתימה על חוזה." },
    ],
    links: [
      { label: "יחס החזר מומלץ", href: "/knowledge/mortgage-payment-ratio" },
      { label: "איך משווים הצעות משכנתא", href: "/knowledge/how-to-compare-mortgage-offers-2027" },
      { label: "משכנתא ראשונה", href: "/first-mortgage" },
    ],
  },
  "mortgage-payment-ratio": {
    faqs: [
      { q: "האם יחס ההחזר מחושב לפי ברוטו או נטו?", a: "הבנקים מחשבים לפי ההכנסה הפנויה, כלומר הכנסה נטו של הלווים לאחר ניכויים, ומביאים בחשבון גם התחייבויות קיימות." },
      { q: "איך אפשר להקטין את יחס ההחזר?", a: "להגדיל הון עצמי, להאריך את התקופה, לסגור הלוואות קיימות או לצרף לווה עם הכנסה. לכל אפשרות יש מחיר, ולכן כדאי להשוות ביניהן." },
    ],
    links: [
      { label: "מה הבנק בודק לפני אישור", href: "/knowledge/what-bank-checks-before-mortgage" },
      { label: "מחשבון משכנתא לפי החזר חודשי", href: "/mortgage-calculator" },
      { label: "משכנתא חדשה", href: "/mortgage" },
    ],
  },
  "do-you-need-advisor": {
    faqs: [
      { q: "האם אפשר לקבל כמה הצעות בלי ללכת לכל בנק בנפרד?", a: "כן. במכרז בנקים מכינים תיק אחד ומגישים אותו לכמה בנקים, כך שההצעות מבוססות על אותם נתונים וקל יותר להשוות ביניהן." },
      { q: "מה כדאי לבדוק לפני שבוחרים ליווי?", a: "את מבנה התשלום (קבוע או אחוזים), מה בדיוק כלול בשירות, האם יש קשר לבנק מסוים ומי בודק את התיק בפועל." },
    ],
    links: [
      { label: "איך משווים הצעות משכנתא", href: "/knowledge/how-to-compare-mortgage-offers-2027" },
      { label: "מכרז בנקים למשכנתא", href: "/mortgage-tender" },
      { label: "משכנתא חדשה", href: "/mortgage" },
    ],
  },
  "how-to-compare-mortgage-offers-2027": {
    faqs: [
      { q: "האם להשוות רק לפי הריבית?", a: "לא. משווים לפי סך התשלומים הצפוי, ההחזר החודשי, החשיפה למדד ולריבית משתנה, ותנאי פירעון מוקדם. ריבית נמוכה במסלול אחד לא אומרת שכל ההצעה זולה יותר." },
      { q: "למה חשוב שכל הבנקים יקבלו אותם נתונים?", a: "כשהנתונים זהים, ההבדלים בין ההצעות משקפים את התמחור של הבנק ולא הבדלים במידע שנמסר." },
    ],
    links: [
      { label: "מכרז בנקים למשכנתא", href: "/mortgage-tender" },
      { label: "מה הבנק בודק לפני אישור", href: "/knowledge/what-bank-checks-before-mortgage" },
      { label: "האם צריך יועץ משכנתאות", href: "/knowledge/do-you-need-advisor" },
    ],
  },
  "bank-auction-guide": {
    faqs: [
      { q: "מה ההבדל בין מכירה פומבית של בנק למכרז בנקים למשכנתא?", a: "מכירה פומבית היא מכירת נכס שהבנק מממש. מכרז בנקים למשכנתא הוא הגשת תיק אחד לכמה בנקים כדי לקבל ולהשוות הצעות מימון." },
      { q: "האם צריך אישור עקרוני לפני מכירה פומבית?", a: "מומלץ. לוחות הזמנים קצרים, ואישור עקרוני מראש מראה כמה מימון אפשר לצפות לקבל ומפחית את הסיכון להתחייב בלי מימון." },
    ],
    links: [
      { label: "מכרז בנקים למשכנתא", href: "/mortgage-tender" },
      { label: "איך משווים הצעות משכנתא", href: "/knowledge/how-to-compare-mortgage-offers-2027" },
      { label: "משכנתא חדשה", href: "/mortgage" },
    ],
  },
};

export function applyArticleExtras(articles: KnowledgeArticle[]): KnowledgeArticle[] {
  return articles.map((a) => {
    const e = extras[a.slug];
    if (!e) return a;
    return {
      ...a,
      blocks: [...a.blocks, { type: "links", title: "להמשך קריאה", items: e.links }],
      faqs: [...a.faqs, ...e.faqs],
    };
  });
}
