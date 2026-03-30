import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, ShieldCheck, Zap, BarChart3, Award,
  CheckCircle2, ArrowLeft, Star, Briefcase, CreditCard,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const benefits = [
  {
    icon: Users,
    title: "לידים מוכנים לסגירה",
    desc: "לקוחות שכבר השלימו KYC מלא, העלו מסמכים ושילמו — מגיעים אליך מוכנים.",
  },
  {
    icon: ShieldCheck,
    title: "מידע מאומת ומלא",
    desc: "כל ליד כולל נתוני הכנסה, נכסים, התחייבויות ומסמכים — בלי להתחיל מאפס.",
  },
  {
    icon: Zap,
    title: "הגשת הצעות ישירות",
    desc: "שלח הצעות משכנתא מפורטות ישירות ללקוח דרך המערכת, בלי תיווך.",
  },
  {
    icon: BarChart3,
    title: "דשבורד מקצועי",
    desc: "עקוב אחרי הלידים, ההצעות והסטטוסים שלך במקום אחד מסודר.",
  },
  {
    icon: Award,
    title: "דירוג ומוניטין",
    desc: "לקוחות מרוצים מדרגים אותך — ככל שהדירוג עולה, יותר לידים בוחרים בך.",
  },
  {
    icon: TrendingUp,
    title: "עלות רכישה נמוכה",
    desc: "ליד באיכות גבוהה מ-₪200 — הרבה פחות מעלות שיווק מסורתית.",
  },
];

const plans = [
  {
    name: "בסיסי",
    price: "299",
    leads: "5 לידים / חודש",
    features: ["גישה לשוק הלידים", "הגשת הצעות", "דשבורד בסיסי"],
    popular: false,
  },
  {
    name: "מקצועי",
    price: "599",
    leads: "15 לידים / חודש",
    features: ["כל מה שבבסיסי", "סטטיסטיקות מתקדמות", "עדיפות בהצגת הצעות", "תמיכה מועדפת"],
    popular: true,
  },
  {
    name: "פרימיום",
    price: "999",
    leads: "לידים ללא הגבלה",
    features: ["כל מה שבמקצועי", "מיתוג אישי", "לידים בלעדיים", "מנהל לקוח ייעודי"],
    popular: false,
  },
];

const steps = [
  { num: "01", title: "הירשם כיועץ", desc: "צור חשבון יועץ עם מספר רישיון ופרטי החברה." },
  { num: "02", title: "בחר מנוי", desc: "בחר את התוכנית המתאימה לך — או רכוש לידים בודדים." },
  { num: "03", title: "רכוש לידים", desc: "עיין בלידים אנונימיים ורכוש את אלה שמתאימים לך." },
  { num: "04", title: "הגש הצעות וסגור", desc: "שלח הצעת משכנתא מפורטת — הלקוח מקבל ומשווה." },
];

export default function ForAdvisorsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-6">
              <Briefcase size={16} /> פלטפורמת יועצי משכנתאות
            </span>
          </motion.div>
          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground leading-tight mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            קבל לידים איכותיים.
            <br />
            <span className="text-primary-foreground/80">סגור עסקאות מהר יותר.</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            לקוחות ב-EasyMorte משלימים KYC מלא, מעלים מסמכים ומשלמים — לפני שאתה בכלל רואה אותם.
            כל שנשאר לך זה להגיש הצעה ולסגור.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/auth?role=advisor">
              <Button size="lg" variant="cta" className="text-lg px-8 py-6">
                הירשם כיועץ <ArrowLeft size={20} className="mr-2" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                צפה בתוכניות
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              למה יועצים בוחרים ב-EasyMorte?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              הפלטפורמה שמחברת בין לקוחות מוכנים ליועצים מובילים
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted">
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              איך זה עובד?
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="relative bg-card rounded-2xl p-6 border border-border text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="font-display text-4xl font-black text-primary/20">{s.num}</span>
                <h3 className="font-display text-lg font-bold text-foreground mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              תוכניות מנוי ליועצים
            </h2>
            <p className="text-muted-foreground text-lg">
              אפשר גם לרכוש לידים בודדים ב-₪200/ליד ללא מנוי
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative bg-card rounded-2xl p-6 border-2 transition-all ${
                  plan.popular ? "border-primary shadow-xl scale-105" : "border-border"
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1">
                    <Star size={12} /> הכי פופולרי
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display text-4xl font-black text-primary">₪{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/חודש</span>
                </div>
                <p className="text-sm text-primary font-semibold mb-4">{plan.leads}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={16} className="text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?role=advisor">
                  <Button variant={plan.popular ? "cta" : "outline"} className="w-full">
                    התחל עכשיו
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-muted border border-border">
              <CreditCard size={18} className="text-primary" />
              <span className="text-sm text-muted-foreground">
                אין מנוי? רכוש לידים בודדים ב-<strong className="text-foreground">₪200 לליד</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-black text-primary-foreground mb-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            מוכן להגדיל את העסק שלך?
          </motion.h2>
          <motion.p
            className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            הצטרף למאות יועצי משכנתאות שכבר סוגרים עסקאות דרך EasyMorte.
            אין התחייבות — בטל בכל עת.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
            <Link to="/auth?role=advisor">
              <Button size="lg" variant="cta" className="text-lg px-10 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                הירשם כיועץ עכשיו <ArrowLeft size={20} className="mr-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
