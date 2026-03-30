import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import SavingsCalculator from "@/pages/SavingsCalculator";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ArrowLeft,
  FileText,
  CalendarDays,
  FileStack,
  Wallet,
  Timer,
  Check,
  X,
  Sparkles,
  Upload,
  Brain,
  Gift,
} from "lucide-react";
import { useState, useRef } from "react";
import StatsSection from "@/components/home/StatsSection";
import TrustBar from "@/components/home/TrustBar";
import EnhancedTestimonials from "@/components/home/EnhancedTestimonials";
import BankLogosSection from "@/components/home/BankLogosSection";

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
      <StatsSection />
      <TrustBar />
      <PainSection />
      <HowItWorksSection />
      <ComparisonSection />
      <SavingsCalculator />
      <EnhancedTestimonials />
      <FAQSection />
      <FinalCTA />
    </>
  );
}

function HeroSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const orbOneY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]"
        style={{ y: bgY }}
      />
      <motion.div
        className="absolute top-20 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] animate-pulse"
        style={{ y: orbOneY }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-72 h-72 bg-gold/5 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: "1s", y: orbTwoY }}
      />

      <motion.div
        className="container relative py-24 md:py-36"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/15 backdrop-blur-sm text-gold text-sm font-semibold mb-8 border border-gold/20">
              <Sparkles size={14} />
              ✦ 4,200+ לקוחות כבר חסכו בממוצע ₪847,000
            </span>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <h1 className="font-display text-4xl md:text-[56px] lg:text-6xl font-black leading-tight mb-6 text-white">
              קבל 3 הצעות משכנתא אמיתיות תוך 48 שעות — בלי לצאת מהבית
            </h1>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-white/65 leading-relaxed mb-10 max-w-2xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            ממלאים פרופיל אחד פעם אחת. יועצים מורשים מתחרים על הלקוח שלך. אתה בוחר את הטוב ביותר — בחינם לחלוטין.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/calculators">
              <Button variant="hero" size="xl" className="shadow-gold text-lg px-8">
                בדוק את המשכנתא שלך — חינם
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline-light" size="xl" className="text-lg px-8">
                איך זה עובד?
              </Button>
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 text-sm text-white/50"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <div className="flex items-center gap-2">
              <Check size={16} className="text-gold" />
              <span>ללא שיחות מכירה</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-gold" />
              <span>48 שעות בלבד</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-gold" />
              <span>3 הצעות מינימום</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-gold" />
              <span>חינם ללקוח</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,30 L1440,60 L0,60 Z" className="fill-background" />
        </svg>
      </div>
    </section>
  );
}

function PainSection() {
  const pains = [
    { icon: CalendarDays, title: "5–8 פגישות בבנקים שונים", desc: "כל פגישה עם ניירת אחרת שאי-אפשר להשוות" },
    { icon: FileStack, title: "מסמכים אינסופיים", desc: "כל בנק מבקש שוב מההתחלה" },
    { icon: Wallet, title: "יועצים שגובים ₪3,000–8,000", desc: "לפני שיודעים אם ההצעה טובה" },
    { icon: Timer, title: "3–6 שבועות", desc: "בעוד העסקה מחכה" },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">הבעיה שפותרים</span>
        </motion.div>
        <motion.h2
          className="font-display text-3xl md:text-5xl font-black text-foreground text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          לקחת משכנתא ב-2025 זה עדיין כאב ראש מהגיהנום
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {pains.map((pain, i) => (
            <motion.div
              key={pain.title}
              className="bg-destructive/5 border border-destructive/15 rounded-2xl p-6 text-center hover:border-destructive/30 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <pain.icon className="text-destructive" size={26} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{pain.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pain.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "ממלאים פרופיל חכם", desc: "שאלון של 10 דקות — הכנסות, נכס, הון עצמי", icon: FileText },
    { num: "02", title: "מעלים מסמכים פעם אחת", desc: "תלושי שכר, דפי חשבון, ת\"ז — הכל מוצפן", icon: Upload },
    { num: "03", title: "AI מנתח ושולח ליועצים", desc: "המערכת בונה חבילת לקוח ושולחת ל-5 יועצים מורשים", icon: Brain },
    { num: "04", title: "מקבלים ובוחרים", desc: "תוך 48 שעות מגיעות הצעות, משווים בלחיצה ובוחרים", icon: Gift },
  ];

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]"
        style={{ y: bgY, scale: 1.15 }}
      />

      <div className="container relative">
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">הפתרון</span>
        </motion.div>
        <motion.h2
          className="font-display text-3xl md:text-5xl font-black text-white text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          4 צעדים. 48 שעות. 3 הצעות אמיתיות.
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-gold/30 transition-colors text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <span className="text-5xl font-display font-black text-gold/20 block mb-2">{step.num}</span>
              <div className="w-14 h-14 rounded-xl bg-gold/15 flex items-center justify-center mx-auto mb-4">
                <step.icon className="text-gold" size={26} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">{step.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const oldWay = [
    "5+ פגישות בבנקים",
    "ניירת כפולה",
    "₪3,000–8,000 ליועץ",
    "6 שבועות",
    "קשה להשוות",
  ];
  const newWay = [
    "פרופיל אחד דיגיטלי",
    "מסמכים פעם אחת",
    "חינם ללקוח",
    "48 שעות",
    "השוואה ברורה בלחיצה",
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-black text-foreground text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          EasyMorte מול השיטה הישנה
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Old Way */}
          <motion.div
            className="bg-card rounded-2xl p-8 border border-destructive/20 shadow-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display font-bold text-xl text-destructive mb-6 flex items-center gap-2">
              <X size={22} className="text-destructive" />
              השיטה הישנה
            </h3>
            <ul className="space-y-4">
              {oldWay.map((item) => (
                <li key={item} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <X size={14} className="text-destructive" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* New Way */}
          <motion.div
            className="bg-card rounded-2xl p-8 border border-gold/20 shadow-card ring-2 ring-gold/10"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display font-bold text-xl text-gold mb-6 flex items-center gap-2">
              <Check size={22} className="text-gold" />
              EasyMorte
            </h3>
            <ul className="space-y-4">
              {newWay.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground font-medium">
                  <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <Check size={14} className="text-gold" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


function FAQSection() {
  const faqs = [
    { q: "האם השירות באמת חינם?", a: "כן, לחלוטין. הלקוח לא משלם שום דבר. היועצים הם אלה שמשלמים עבור הלידים." },
    { q: "האם המסמכים שלי מאובטחים?", a: "כל המידע מוצפן בתקן הגבוה ביותר, נשמר בשרתים מאובטחים, ונמחק לפי בקשה. אנחנו עומדים בכל תקני הפרטיות." },
    { q: "מה ההבדל בין EasyMorte ליועץ משכנתאות?", a: "אנחנו פלטפורמת חיבור — אתה ממלא פרופיל אחד ומקבל הצעות מכמה יועצים מורשים שמתחרים ביניהם. בלי לחץ, בלי שיחות מכירה." },
    { q: "כמה זמן לוקח לקבל הצעה?", a: "בדרך כלל תוך 48 שעות מרגע שהפרופיל שלך מושלם ומסמכים הועלו." },
    { q: "האם אני מחויב לבחור מהרשימה?", a: "בשום אופן. אתה רואה את ההצעות, משווה, ומחליט. אין שום התחייבות." },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-3xl">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-black text-foreground text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          שאלות נפוצות
        </motion.h2>

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
                  className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
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
                    <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{faq.a}</div>
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
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24 md:py-32">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]"
        style={{ y: bgY, scale: 1.3 }}
      />
      <div className="container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4">
            מוכן לחסוך עשרות אלפים על המשכנתא שלך?
          </h2>
          <p className="text-lg text-white/65 mb-10 max-w-xl mx-auto">
            זה חינם ולוקח 10 דקות. בלי התחייבות, בלי שיחות מכירה.
          </p>
          <Link to="/calculators">
            <Button variant="hero" size="xl" className="shadow-gold text-lg px-10">
              התחל עכשיו — זה חינם
              <ArrowLeft size={18} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
