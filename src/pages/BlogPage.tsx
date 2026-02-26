import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ArrowLeft, TrendingDown, Shield, Home, Percent, Scale, Landmark } from "lucide-react";

const articles = [
  {
    slug: "what-is-prime",
    title: "מה זה ריבית פריים ולמה היא משפיעה על המשכנתא שלך?",
    excerpt: "ריבית הפריים היא הריבית הבסיסית שבנק ישראל קובע. כל שינוי בה משפיע ישירות על ההחזר החודשי שלך. הנה מה שצריך לדעת.",
    readTime: "4 דקות",
    icon: Percent,
    color: "from-amber-500/20 to-yellow-500/20",
    iconColor: "text-amber-400",
  },
  {
    slug: "refinance-guide",
    title: "מיחזור משכנתא: המדריך המלא ל-2026",
    excerpt: "מתי כדאי למחזר? כמה זה עולה? מה עמלת הפירעון המוקדם? כל מה שצריך לדעת לפני שמחליטים.",
    readTime: "7 דקות",
    icon: TrendingDown,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    slug: "first-apartment",
    title: "קונים דירה ראשונה? 10 דברים שחייבים לדעת",
    excerpt: "מהון עצמי דרך מס רכישה ועד בחירת תמהיל — המדריך שיחסוך לכם טעויות יקרות.",
    readTime: "6 דקות",
    icon: Home,
    color: "from-sky-500/20 to-blue-500/20",
    iconColor: "text-sky-400",
  },
  {
    slug: "fixed-vs-variable",
    title: "ריבית קבועה מול משתנה: מה עדיף?",
    excerpt: "ההבדלים, היתרונות והחסרונות של כל סוג ריבית — ואיך לבנות תמהיל שמאזן ביניהם.",
    readTime: "5 דקות",
    icon: Scale,
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-400",
  },
  {
    slug: "cpi-linked",
    title: "צמוד מדד: מה זה אומר ולמה זה מסוכן?",
    excerpt: "מסלול צמוד מדד יכול להיראות זול, אבל אינפלציה גבוהה עלולה להפוך אותו ליקר מאוד.",
    readTime: "4 דקות",
    icon: Shield,
    color: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-400",
  },
  {
    slug: "bank-negotiation",
    title: "איך לנהל משא ומתן מול הבנק?",
    excerpt: "5 טיפים מעשיים שיעזרו לך לקבל תנאים טובים יותר — גם בלי יועץ משכנתאות.",
    readTime: "5 דקות",
    icon: Landmark,
    color: "from-teal-500/20 to-cyan-500/20",
    iconColor: "text-teal-400",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="text-gold" size={28} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">
              משכנתא<span className="text-gradient-gold">פדיה</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-xl mx-auto">
              מאמרים, מדריכים וטיפים מקצועיים שיעזרו לך לקבל את ההחלטות הנכונות בנושא משכנתא.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/blog/${article.slug}`}
                  className="block bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-transparent hover:border-gold/20 h-full"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${article.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <article.icon className={article.iconColor} size={24} />
                  </div>
                  <h2 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-gold transition-colors leading-snug">
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
                    <span className="inline-flex items-center gap-1 text-gold text-sm font-semibold">
                      קרא עוד
                      <ArrowLeft size={14} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
