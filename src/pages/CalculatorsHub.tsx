import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, TrendingDown, BarChart3, ArrowLeft } from "lucide-react";

const calculators = [
  {
    title: "מדד בזבוז משכנתא",
    desc: "גלה האם המשכנתא שלך עולה לך יותר מדי. קבל ציון 1-100 והמלצות.",
    icon: BarChart3,
    href: "/calculators/waste",
    emoji: "📊",
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "סימולטור מיחזור",
    desc: "בדוק אם מיחזור משכנתא ישתלם לך, ותוך כמה חודשים תגיע לנקודת איזון.",
    icon: TrendingDown,
    href: "/calculators/refinance",
    emoji: "💰",
    color: "bg-success/10 text-success",
  },
  {
    title: "השוואת תמהילים",
    desc: "קבל 3 תמהילים — שמרני, מאוזן ואגרסיבי — מותאמים לפרופיל הסיכון שלך.",
    icon: Calculator,
    href: "/calculators/mix",
    emoji: "⚖️",
    color: "bg-gold/10 text-gold-dark",
  },
];

export default function CalculatorsHub() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            מחשבוני משכנתא <span className="text-gradient-gold">חכמים</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            בחר מחשבון, הזן את הנתונים שלך, וקבל תוצאה מיידית — בלי רישום ובלי שיחות.
          </p>
        </motion.div>

        <div className="space-y-5">
          {calculators.map((calc, i) => (
            <motion.div
              key={calc.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={calc.href}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-card rounded-2xl p-6 md:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-transparent hover:border-gold/20"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${calc.color}`}>
                  {calc.emoji}
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-xl text-foreground mb-1 group-hover:text-gold transition-colors">
                    {calc.title}
                  </h2>
                  <p className="text-muted-foreground text-sm">{calc.desc}</p>
                </div>
                <ArrowLeft size={20} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0 hidden sm:block" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
