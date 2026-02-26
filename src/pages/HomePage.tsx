import { motion, AnimatePresence } from "framer-motion";
import MortgageTipsCarousel from "@/components/MortgageTipsCarousel";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Shield,
  Clock,
  TrendingDown,
  ChevronDown,
  Star,
  ArrowLeft,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <BenefitsSection />
      <CalculatorsPreview />
      <MortgageTipsCarousel />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}

function HeroSection() {
  return (
    <section className="bg-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(42,85%,55%,0.08)_0%,_transparent_60%)]" />
      <div className="container relative py-20 md:py-32">
        <div className="max-w-3xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
              <Zap size={14} />
              תוצאות תוך 48 שעות
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-primary-foreground leading-tight mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            המשכנתא שלך עולה לך
            <br />
            <span className="text-gradient-gold">יותר מדי</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-primary-foreground/70 leading-relaxed mb-8 max-w-xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            גלה תוך דקה כמה כסף אתה מבזבז על המשכנתא שלך.
            <br />
            קבל דוח מקצועי עם 3 תמהילים חכמים — וחסוך עשרות אלפי שקלים.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/calculators">
              <Button variant="hero" size="xl">
                <Calculator size={20} />
                בדוק עכשיו — חינם
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline-light" size="xl">
                איך זה עובד?
                <ArrowLeft size={18} />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center gap-6 mt-10 text-sm text-primary-foreground/50"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-gold" />
              <span>ללא שיחת מכירה</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gold" />
              <span>דוח מקצועי מלא</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gold" />
              <span>48 שעות</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { value: "₪847K", label: "חיסכון ממוצע ללקוח" },
    { value: "4,200+", label: "לקוחות מרוצים" },
    { value: "48 שעות", label: "זמן טיפול מלא" },
    { value: "98%", label: "שביעות רצון" },
  ];

  return (
    <section className="border-b border-border bg-card">
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-2xl md:text-3xl font-display font-black text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "בדוק את המשכנתא שלך",
      desc: "הזן את פרטי המשכנתא הנוכחית שלך במחשבון החינמי שלנו וקבל ציון מיידי.",
      icon: Calculator,
    },
    {
      num: "02",
      title: "קבל דוח מקצועי",
      desc: "שלם פעם אחת וקבל דוח עם 3 תמהילים מותאמים אישית — שמרני, מאוזן ואגרסיבי.",
      icon: FileText,
    },
    {
      num: "03",
      title: "חסוך עשרות אלפים",
      desc: "אנחנו שולחים את ההצעה ישירות לבנקים ומלווים אותך עד לחתימה.",
      icon: TrendingDown,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            איך זה עובד?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            תהליך פשוט ב-3 צעדים. ללא שיחות מכירה, ללא התחייבות.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <step.icon className="text-gold" size={22} />
                </div>
                <span className="text-4xl font-display font-black text-muted-foreground/20">{step.num}</span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    { icon: TrendingDown, title: "חיסכון אמיתי בכסף", desc: "לא הבטחות — מספרים ותמהילים מותאמים אישית." },
    { icon: Shield, title: "ללא שיחות מכירה", desc: "אנחנו נותנים דוח ונתונים. אתה מחליט." },
    { icon: Clock, title: "48 שעות בלבד", desc: "מהרגע שאתה משלם, תוך 48 שעות יש לך דוח מלא." },
    { icon: Users, title: "אנשי מקצוע אמיתיים", desc: "צוות יועצי משכנתאות עם ניסיון של 15+ שנה." },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            למה <span className="text-gradient-gold">EasyMorte</span>?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              className="flex gap-5 bg-card rounded-2xl p-6 shadow-card"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalculatorsPreview() {
  const calcs = [
    {
      title: "מדד בזבוז משכנתא",
      desc: "גלה כמה כסף אתה מבזבז כל חודש על המשכנתא שלך",
      href: "/calculators/waste",
      icon: "📊",
    },
    {
      title: "סימולטור מיחזור",
      desc: "בדוק אם כדאי לך לבצע מיחזור משכנתא ומה החיסכון הצפוי",
      href: "/calculators/refinance",
      icon: "💰",
    },
    {
      title: "השוואת תמהילים",
      desc: "קבל 3 תמהילים — שמרני, מאוזן ואגרסיבי — מותאמים אישית",
      href: "/calculators/mix",
      icon: "⚖️",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            מחשבונים חכמים
          </h2>
          <p className="text-lg text-muted-foreground">
            בדוק חינם — קבל מספרים אמיתיים
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {calcs.map((calc, i) => (
            <motion.div
              key={calc.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <Link
                to={calc.href}
                className="block bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-transparent hover:border-gold/20"
              >
                <div className="text-4xl mb-4">{calc.icon}</div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2 group-hover:text-gold transition-colors">
                  {calc.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{calc.desc}</p>
                <span className="inline-flex items-center gap-2 text-gold text-sm font-semibold">
                  חשב עכשיו
                  <ArrowLeft size={16} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "דני כ.",
      role: "חיסכון של ₪127,000",
      text: "לא האמנתי כמה כסף בזבזתי. הדוח היה מקצועי להפליא והבנק אישר את התמהיל תוך שבוע.",
    },
    {
      name: "מיכל ר.",
      role: "חיסכון של ₪89,000",
      text: "התלבטתי אם לבצע מיחזור. המחשבון הראה לי שזה חד-משמעית כדאי. הכי טוב — בלי שיחות מכירה.",
    },
    {
      name: "אורי ש.",
      role: "חיסכון של ₪203,000",
      text: "הפתעה ענקית. חשבתי שהמשכנתא שלי טובה. התברר שאני משלם 1,400 ש\"ח יותר מדי כל חודש.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/50">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            מה הלקוחות אומרים
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-card rounded-2xl p-8 shadow-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <div className="font-display font-bold text-foreground">{t.name}</div>
                <div className="text-sm text-gold font-semibold">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "מה ההבדל בינכם ליועץ משכנתאות רגיל?",
      a: "אנחנו לא מתקשרים ולא מוכרים. אתה מזין נתונים, מקבל ניתוח מבוסס מספרים, ומחליט לבד. בלי לחץ, בלי תירוצים.",
    },
    {
      q: "כמה עולה השירות?",
      a: "המחשבונים חינם לגמרי. דוח מקצועי עם 3 תמהילים + שליחה לבנקים עולה 3,500 ₪ חד-פעמי.",
    },
    {
      q: "תוך כמה זמן מקבלים את הדוח?",
      a: "תוך 48 שעות מרגע התשלום והעלאת המסמכים. הדוח כולל 3 תמהילים, ניתוח רגישות, והמלצה.",
    },
    {
      q: "מה קורה אחרי שמקבלים את הדוח?",
      a: "אנחנו שולחים את התמהיל המומלץ ישירות לבנקים, מלווים אותך עד לקבלת הצעה, ומוודאים שהחיסכון מתקיים.",
    },
    {
      q: "האם המידע שלי מאובטח?",
      a: "לחלוטין. כל המידע מוצפן, נשמר בשרתים מאובטחים, ונמחק לפי בקשה. אנחנו עומדים בכל תקני הפרטיות.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container max-w-3xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            שאלות נפוצות
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="bg-card rounded-xl border border-border overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-right"
              >
                <span className="font-display font-bold text-foreground">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-hero py-20 md:py-28">
      <div className="container text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-primary-foreground mb-4">
            מוכן לגלות כמה אתה חוסך?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
            בדיקה חינמית תוך דקה. בלי התחייבות, בלי שיחות מכירה.
          </p>
          <Link to="/calculators">
            <Button variant="hero" size="xl">
              <Calculator size={20} />
              בדוק עכשיו — חינם
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}


