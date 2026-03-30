import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen, Clock, ArrowLeft, TrendingDown, Shield, Home, Percent, Scale, Landmark,
  Search, ChevronDown, Lightbulb, HelpCircle, BookMarked,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Articles ──
const articles = [
  {
    slug: "what-is-prime",
    title: "מה זה ריבית פריים ולמה היא משפיעה על המשכנתא שלך?",
    excerpt: "ריבית הפריים היא הריבית הבסיסית שבנק ישראל קובע. כל שינוי בה משפיע ישירות על ההחזר החודשי שלך. הנה מה שצריך לדעת.",
    readTime: "4 דקות",
    icon: Percent,
    category: "מושגים",
  },
  {
    slug: "refinance-guide",
    title: "מיחזור משכנתא: המדריך המלא ל-2026",
    excerpt: "מתי כדאי למחזר? כמה זה עולה? מה עמלת הפירעון המוקדם? כל מה שצריך לדעת לפני שמחליטים.",
    readTime: "7 דקות",
    icon: TrendingDown,
    category: "מדריכים",
  },
  {
    slug: "first-apartment",
    title: "קונים דירה ראשונה? 10 דברים שחייבים לדעת",
    excerpt: "מהון עצמי דרך מס רכישה ועד בחירת תמהיל — המדריך שיחסוך לכם טעויות יקרות.",
    readTime: "6 דקות",
    icon: Home,
    category: "מדריכים",
  },
  {
    slug: "fixed-vs-variable",
    title: "ריבית קבועה מול משתנה: מה עדיף?",
    excerpt: "ההבדלים, היתרונות והחסרונות של כל סוג ריבית — ואיך לבנות תמהיל שמאזן ביניהם.",
    readTime: "5 דקות",
    icon: Scale,
    category: "מושגים",
  },
  {
    slug: "cpi-linked",
    title: "צמוד מדד: מה זה אומר ולמה זה מסוכן?",
    excerpt: "מסלול צמוד מדד יכול להיראות זול, אבל אינפלציה גבוהה עלולה להפוך אותו ליקר מאוד.",
    readTime: "4 דקות",
    icon: Shield,
    category: "מושגים",
  },
  {
    slug: "bank-negotiation",
    title: "איך לנהל משא ומתן מול הבנק?",
    excerpt: "5 טיפים מעשיים שיעזרו לך לקבל תנאים טובים יותר — גם בלי יועץ משכנתאות.",
    readTime: "5 דקות",
    icon: Landmark,
    category: "טיפים",
  },
  {
    slug: "mortgage-mix-explained",
    title: "תמהיל משכנתא: איך בונים את השילוב המושלם?",
    excerpt: "למה לא כדאי לשים הכל על מסלול אחד, ואיך לפזר את הסיכון בצורה חכמה בין מסלולים שונים.",
    readTime: "6 דקות",
    icon: Scale,
    category: "מדריכים",
  },
  {
    slug: "early-repayment",
    title: "פירעון מוקדם: מתי זה משתלם ומתי לא?",
    excerpt: "עמלת פירעון מוקדם, חישוב הכדאיות, והמקרים שבהם עדיף להשאיר את הכסף במקום אחר.",
    readTime: "5 דקות",
    icon: TrendingDown,
    category: "טיפים",
  },
  {
    slug: "ltv-explained",
    title: "מה זה LTV ולמה הבנק מסתכל על זה?",
    excerpt: "יחס הלוואה לשווי (LTV) הוא אחד הפרמטרים הכי חשובים שהבנק בודק. ככל שהוא נמוך יותר — התנאים טובים יותר.",
    readTime: "3 דקות",
    icon: Percent,
    category: "מושגים",
  },
];

// ── Glossary ──
const glossary = [
  { term: "ריבית פריים", definition: "ריבית בסיסית שבנק ישראל קובע, ומשמשת כבסיס למסלולי משכנתא בריבית משתנה." },
  { term: "LTV", definition: "Loan To Value — יחס סכום ההלוואה לשווי הנכס. ככל שנמוך יותר, התנאים טובים יותר." },
  { term: "תמהיל", definition: "שילוב של מספר מסלולי משכנתא (קבועה, משתנה, צמודה) ביחד." },
  { term: "פירעון מוקדם", definition: "החזרת חלק מהמשכנתא או כולה לפני תום התקופה. עלול להיות כרוך בעמלה." },
  { term: "צמוד מדד", definition: "מסלול שבו קרן ההלוואה מתעדכנת לפי מדד המחירים לצרכן (אינפלציה)." },
  { term: "ריבית קבועה לא צמודה", definition: "מסלול בו הריבית קבועה לכל התקופה ואינה מושפעת ממדד או פריים." },
  { term: "DTI", definition: "Debt To Income — יחס ההחזרים החודשיים להכנסה. הבנקים דורשים שלא יעלה על ~40%." },
  { term: "מס רכישה", definition: "מס שמשלמים בעת רכישת דירה. לדירה ראשונה יש מדרגות מס מופחתות." },
  { term: "הון עצמי", definition: "הסכום שהקונה מביא מכספו — לפחות 25% לדירה ראשונה, 50% לדירה שנייה." },
  { term: "ביטוח משכנתא", definition: "ביטוח חיים וביטוח מבנה שהבנק מחייב כתנאי למשכנתא." },
  { term: "עמלת פירעון מוקדם", definition: "עמלה שהבנק גובה בעת סגירה מוקדמת של המשכנתא או חלק ממנה." },
  { term: "גרייס", definition: "תקופה שבה משלמים רק ריבית, בלי להחזיר קרן. נפוץ בשלב הבנייה." },
];

// ── FAQ ──
const faqs = [
  {
    q: "כמה הון עצמי צריך לדירה ראשונה?",
    a: "לדירה ראשונה נדרש הון עצמי של 25% לפחות משווי הנכס. לדירה שנייה — 50%. למשפרי דיור — 30%.",
  },
  {
    q: "מתי כדאי למחזר משכנתא?",
    a: "כדאי לבדוק מיחזור כשהריבית ירדה משמעותית, כשעברו לפחות 3 שנים מתחילת המשכנתא, או כשהמצב הכלכלי שלכם השתפר ואתם יכולים לקבל תנאים טובים יותר.",
  },
  {
    q: "מה עדיף — ריבית קבועה או משתנה?",
    a: "אין תשובה אחת. ריבית קבועה מספקת ודאות אבל בדרך כלל גבוהה יותר. ריבית משתנה (כמו פריים) נמוכה יותר אבל עלולה לעלות. השילוב הנכון תלוי בפרופיל הסיכון שלכם.",
  },
  {
    q: "מה זה עמלת פירעון מוקדם ואיך נמנעים ממנה?",
    a: "עמלת פירעון מוקדם נגבית כשסוגרים משכנתא לפני הזמן. גובהה תלוי בסוג המסלול, הריבית הנוכחית וכמה זמן נשאר. אפשר לצמצם אותה על ידי תזמון נכון ובחירת מסלולים עם עמלות נמוכות.",
  },
  {
    q: "כמה זמן לוקח לקבל אישור עקרוני?",
    a: "אישור עקרוני מהבנק לוקח בדרך כלל 1-3 ימי עסקים. עם EasyMorte, אנחנו מכינים את כל החומרים מראש כדי לזרז את התהליך.",
  },
  {
    q: "האם חובה לקחת ביטוח משכנתא?",
    a: "כן. הבנק מחייב ביטוח חיים (למקרה פטירה) וביטוח מבנה (למקרה נזק לנכס). אפשר לבחור חברת ביטוח עצמאית — לא חייבים את הביטוח של הבנק.",
  },
  {
    q: "מה ההבדל בין אישור עקרוני לאישור סופי?",
    a: "אישור עקרוני הוא הסכמה ראשונית של הבנק, בכפוף לבדיקות נוספות. אישור סופי מתקבל אחרי הערכת שמאי, בדיקת נכס ואישור כל המסמכים.",
  },
  {
    q: "מה עושים אם הבנק דחה את הבקשה?",
    a: "דחייה לא סופית. אפשר לפנות לבנק אחר, לשפר את הפרופיל הפיננסי (סגירת הלוואות, הגדלת הון עצמי), או לפנות ליועץ משכנתאות שיעזור למצוא פתרון.",
  },
];

// ── Tips ──
const tips = [
  "אל תיקחו משכנתא מהבנק הראשון — תמיד להשוות לפחות 3 הצעות",
  "שמרו על DTI (יחס החזרים להכנסה) מתחת ל-35% למרחב נשימה",
  "כשהריבית גבוהה, העדיפו מסלולים משתנים שיירדו בעתיד",
  "אל תשכחו לחשב עלויות נלוות: שמאי, עו\"ד, מס רכישה, ביטוח",
  "שלבו בין מסלול קבוע (יציבות) למשתנה (גמישות) — אל תהמרו על מסלול אחד",
  "בדקו את עמלת הפירעון המוקדם לפני שסוגרים — לפעמים עדיף לחכות חודש",
];

const categories = ["הכל", "מדריכים", "מושגים", "טיפים"];

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"articles" | "glossary" | "faq">("articles");

  const filteredArticles = articles.filter((a) => {
    const matchesSearch = !search || a.title.includes(search) || a.excerpt.includes(search);
    const matchesCat = activeCategory === "הכל" || a.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const filteredGlossary = glossary.filter(
    (g) => !search || g.term.includes(search) || g.definition.includes(search)
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="text-primary" size={28} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
              משכנתא<span className="text-primary">פדיה</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
              מאמרים, מדריכים, מושגים ושאלות נפוצות — כל מה שצריך לדעת כדי לקחת משכנתא בצורה חכמה.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חפש מאמר, מושג או שאלה..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 text-center"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          {/* Tab buttons */}
          <div className="flex justify-center gap-2 mb-10">
            {[
              { key: "articles" as const, label: "מאמרים", icon: BookMarked },
              { key: "glossary" as const, label: "מילון מושגים", icon: BookOpen },
              { key: "faq" as const, label: "שאלות נפוצות", icon: HelpCircle },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Articles tab ── */}
          {activeTab === "articles" && (
            <>
              {/* Category filters */}
              <div className="flex justify-center gap-2 mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, i) => (
                  <motion.div
                    key={article.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={`/blog/${article.slug}`}
                      className="block bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-transparent hover:border-primary/20 h-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <article.icon className="text-primary" size={22} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {article.category}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {article.readTime}
                        </span>
                        <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                          קרא עוד
                          <ArrowLeft size={14} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <p className="text-center text-muted-foreground py-12">לא נמצאו מאמרים תואמים</p>
              )}
            </>
          )}

          {/* ── Glossary tab ── */}
          {activeTab === "glossary" && (
            <div className="max-w-3xl mx-auto">
              <div className="space-y-3">
                {filteredGlossary.map((item, i) => (
                  <motion.div
                    key={item.term}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors"
                  >
                    <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-2">
                      <BookOpen size={16} className="text-primary" />
                      {item.term}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.definition}</p>
                  </motion.div>
                ))}
              </div>
              {filteredGlossary.length === 0 && (
                <p className="text-center text-muted-foreground py-12">לא נמצאו מושגים תואמים</p>
              )}
            </div>
          )}

          {/* ── FAQ tab ── */}
          {activeTab === "faq" && (
            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-right hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-display font-bold text-foreground flex items-center gap-2">
                      <HelpCircle size={16} className="text-primary shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="px-5 pb-5"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed pr-6">{faq.a}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tips Banner */}
      <section className="py-16 bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="text-primary" size={24} />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black text-foreground mb-2">
              טיפים מהירים
            </h2>
            <p className="text-muted-foreground">דברים שכדאי לזכור לפני שלוקחים משכנתא</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-sm">{i + 1}</span>
                </span>
                <p className="text-sm text-foreground leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container text-center">
          <h2 className="font-display text-2xl md:text-3xl font-black text-primary-foreground mb-4">
            רוצה לדעת כמה אתה באמת משלם?
          </h2>
          <p className="text-primary-foreground/70 mb-6">
            בדוק את המשכנתא שלך במחשבונים החינמיים שלנו
          </p>
          <Link to="/calculators">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold px-8 py-3 rounded-xl text-lg hover:bg-primary-foreground/90 transition-colors"
            >
              למחשבונים <ArrowLeft size={18} />
            </motion.button>
          </Link>
        </div>
      </section>
    </>
  );
}
