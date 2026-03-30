import { motion, AnimatePresence } from "framer-motion";
import MortgageTipsCarousel from "@/components/MortgageTipsCarousel";
import SavingsCalculator from "@/pages/SavingsCalculator";
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
  Home,
  BarChart3,
  PiggyBank,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useScroll, useTransform } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SavingsCalculator />
      <MortgageTipsCarousel />
      <TrustBar />
      <HowItWorksSection />
      <SavingsGraphSection />
      <BenefitsSection />
      <CalculatorsPreview />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}

function HeroSection() {
  const words = ["יותר מדי", "הון תועפות", "עשרות אלפים"];
  const [wordIdx, setWordIdx] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Abstract gradient background */}
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Animated particles/glow */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gold/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container relative py-24 md:py-36">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/15 backdrop-blur-sm text-gold text-sm font-semibold mb-8 border border-gold/20">
              <Zap size={14} />
              אפשרות למשכנתא מאושרת תוך 48 שעות · ללא פגישה · ללא שיחות מיותרות · תהליך דיגיטלי מלא
            </span>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-white">משכנתא חכמה</span>
              <br />
              <span className="text-white">לבית ה</span>
              <span className="text-gradient-gold">חלומות</span>
              <span className="text-white"> שלך</span>
            </h1>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            גלה תוך דקה כמה כסף אתה מפסיד על המשכנתא שלך.
            <br />
            קבל דוח מקצועי עם 3 תמהילים מותאמים אישית — 
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIdx}
                className="inline-block text-gold font-bold mx-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                וחסוך {words[wordIdx]}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/calculators">
              <Button variant="hero" size="xl" className="shadow-gold text-lg px-8">
                <Home size={20} />
                בדוק עכשיו — חינם
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline-light" size="xl" className="text-lg px-8">
                איך זה עובד?
                <ArrowLeft size={18} />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-8 mt-12 text-sm text-white/50"
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

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,30 L1440,60 L0,60 Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { value: "₪847K", label: "חיסכון ממוצע ללקוח", icon: PiggyBank },
    { value: "4,200+", label: "לקוחות מרוצים", icon: Users },
    { value: "48 שעות", label: "זמן טיפול מלא", icon: Clock },
    { value: "98%", label: "שביעות רצון", icon: Star },
  ];

  return (
    <section className="bg-card border-b border-border relative -mt-1">
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className="mx-auto mb-2 text-gold" size={24} />
              <div className="text-2xl md:text-3xl font-display font-black text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


function SavingsGraphSection() {
  const months = ["חודש 1", "חודש 6", "שנה", "שנתיים", "5 שנים", "10 שנים"];
  const savings = [1400, 8400, 16800, 33600, 84000, 168000];
  const maxVal = Math.max(...savings);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">

      <div className="container relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            כמה כסף אתה <span className="text-gradient-gold">חוסך</span> לאורך זמן?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            חיסכון ממוצע של ₪1,400 בחודש מצטבר לסכומים מדהימים
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-card rounded-2xl p-8 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="text-gold" size={24} />
            <h3 className="font-display font-bold text-lg text-foreground">חיסכון מצטבר — דוגמה</h3>
          </div>

          <div className="space-y-4">
            {months.map((month, i) => (
              <motion.div
                key={month}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-sm text-muted-foreground w-20 text-left shrink-0">{month}</span>
                <div className="flex-1 h-10 bg-muted/50 rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-lg bg-gradient-to-l from-gold to-gold-light"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(savings[i] / maxVal) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground">
                    ₪{savings[i].toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gold/5 rounded-xl border border-gold/10 text-center">
            <p className="text-sm text-muted-foreground">
              * על בסיס חיסכון ממוצע של <span className="font-bold text-gold">₪1,400</span> בחודש
            </p>
          </div>
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
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
    {
      num: "02",
      title: "קבל דוח מקצועי",
      desc: "שלם פעם אחת וקבל דוח עם 3 תמהילים מותאמים אישית — שמרני, מאוזן ואגרסיבי.",
      icon: FileText,
      color: "from-sky-500/20 to-blue-500/20",
      iconColor: "text-sky-400",
    },
    {
      num: "03",
      title: "חסוך עשרות אלפים",
      desc: "אנחנו שולחים את ההצעה ישירות לבנקים ומלווים אותך עד לחתימה.",
      icon: TrendingDown,
      color: "from-amber-500/20 to-yellow-500/20",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden bg-muted/20"
    >
      <div className="container relative">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-white/10 hover:border-gold/20 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex flex-col items-center mb-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform mb-3`}>
                  <step.icon className={step.iconColor} size={28} />
                </div>
                <span className="text-5xl font-display font-black text-muted-foreground/10">{step.num}</span>
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section ref={ref} className="py-20 md:py-28 relative overflow-hidden">
      {/* Abstract gradient background */}
      <div className="absolute inset-0 bg-hero" />

      <div className="container relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4">
            למה <span className="text-gradient-gold">EasyMorte</span>?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              className="flex gap-5 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-gold/30 transition-colors"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                <b.icon className="text-gold" size={22} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-1">{b.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{b.desc}</p>
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
      icon: BarChart3,
      color: "from-red-500/20 to-orange-500/20",
      iconColor: "text-red-400",
    },
    {
      title: "סימולטור מיחזור",
      desc: "בדוק אם כדאי לך לבצע מיחזור משכנתא ומה החיסכון הצפוי",
      href: "/calculators/refinance",
      icon: PiggyBank,
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "השוואת תמהילים",
      desc: "קבל 3 תמהילים — שמרני, מאוזן ואגרסיבי — מותאמים אישית",
      href: "/calculators/mix",
      icon: Calculator,
      color: "from-sky-500/20 to-blue-500/20",
      iconColor: "text-sky-400",
    },
    {
      title: "מחשבון משכנתא חדשה",
      desc: "חשב את ההחזר החודשי וגלה כמה תוכל ללוות לבית הראשון שלך",
      href: "/calculators/new-mortgage",
      icon: Home,
      color: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden bg-muted/20"
    >
      <div className="container relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4">
            מחשבונים מקצועיים
          </h2>
          <p className="text-lg text-muted-foreground">
            בדוק חינם — קבל מספרים אמיתיים
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
                className="block bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-white/10 hover:border-gold/20 text-center h-full"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${calc.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <calc.icon className={calc.iconColor} size={28} />
                </div>
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
              className="bg-card rounded-2xl p-8 shadow-card border border-border hover:border-gold/20 transition-colors"
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
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-gold/20 transition-colors"
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-32">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img src={heroHomesImg} alt="" className="w-full h-full object-cover scale-125" />
      </motion.div>
      <div className="absolute inset-0 bg-navy-dark/90" />
      <div className="container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Home className="mx-auto text-gold mb-6" size={48} />
          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4">
            הבית שלך מחכה לך
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            בדיקה חינמית תוך דקה. בלי התחייבות, בלי שיחות מכירה.
          </p>
          <Link to="/calculators">
            <Button variant="hero" size="xl" className="shadow-gold text-lg px-10">
              <Calculator size={20} />
              בדוק עכשיו — חינם
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
