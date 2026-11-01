import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Check, ChevronLeft } from "lucide-react";
import StatsSection from "@/components/home/StatsSection";
import BankLogosSection from "@/components/home/BankLogosSection";
import heroLifestyle from "@/assets/hero-lifestyle.jpg";
import homeBalcony from "@/assets/home-balcony.jpg";
import ctaLight from "@/assets/cta-light.jpg";
import founderImage from "@/assets/shay-ellis-founder.png";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ─── How it works: 4 editorial steps ───
const steps = [
  { title: "פותחים תיק", desc: "כמה דקות של פרטים ראשוניים." },
  { title: "מעלים פעם אחת", desc: "מסמכים ונתונים במקום אחד." },
  { title: "אנחנו נכנסים לעבודה", desc: "בדיקה, בניית חלופות ופנייה לבנקים הרלוונטיים." },
  { title: "רואים הכול ברור", desc: "הצעות, השוואה והשלב הבא במקום אחד." },
];

const faqItems = [
  { q: "כמה זמן זה לוקח?", a: "פתיחת התיק והעלאת המסמכים לוקחות בערך 10 דקות. מרגע שהתיק מלא ושולם, אנחנו מטפלים בו בחלון של עד 72 שעות. זמני האישור והמענה של הבנקים אינם בשליטת EasyMorte." },
  { q: "האם צריך להגיע לפגישה?", a: "לא. הכל מתנהל אונליין — פרטים, מסמכים והצעות — בלי פגישות מיותרות." },
  { q: "מתי משלמים?", a: "הבדיקה הראשונית חינם. תשלום אחד של ₪3,450 משלמים כשפותחים תיק מלא, לפני שאנחנו נכנסים לעבודה." },
  { q: "האם אתם מבטיחים אישור?", a: "לא, ואף אחד לא יכול. את המשכנתא מאשרים הבנקים. אנחנו מבטיחים תהליך מסודר, שקוף ומקצועי — ושתדעו בדיוק איפה הדברים עומדים." },
  { q: "מה כולל המחיר?", a: "ניתוח הנתונים, בניית חלופות, טיפול מול בנקים רלוונטיים, השוואת הצעות וסטטוס דיגיטלי לאורך כל הדרך." },
  { q: "מה אם עדיין חסרים לי מסמכים?", a: "פותחים תיק וממשיכים. אפשר להשלים מסמכים בהמשך — המערכת מסמנת בדיוק מה חסר, ואנחנו עוזרים לסדר את זה." },
];

// ─── Product mockup: the case command center (illustrative) ───
function CommandCenterMockup() {
  const stages = ["פתיחת תיק", "מסמכים", "בנקים", "חתימה"];
  const activeStage = 2;
  const kpis = [
    { label: "החזר חודשי", value: "₪4,980" },
    { label: "סכום המשכנתא", value: "₪980,000" },
    { label: "ריבית ממוצעת", value: "4.62%" },
  ];
  const offers = [
    { bank: "בנק א'", rate: "4.62%", best: true },
    { bank: "בנק ב'", rate: "4.85%", best: false },
    { bank: "בנק ג'", rate: "5.11%", best: false },
  ];
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-card-hover overflow-hidden text-right">
      {/* window bar */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-border" aria-hidden />
        <span className="w-2.5 h-2.5 rounded-full bg-border/70" aria-hidden />
        <span className="w-2.5 h-2.5 rounded-full bg-border/40" aria-hidden />
        <span className="mx-auto font-ticker text-[11px] text-muted-foreground" dir="ltr">easymorte.co.il/dashboard</span>
      </div>
      <div className="grid grid-cols-[auto_1fr]">
        {/* sidebar */}
        <div className="hidden sm:flex flex-col gap-3.5 border-l border-border p-4" aria-hidden>
          <span className="w-20 h-2 rounded-full bg-primary/40" />
          <span className="w-16 h-2 rounded-full bg-muted" />
          <span className="w-24 h-2 rounded-full bg-muted" />
          <span className="w-14 h-2 rounded-full bg-muted" />
          <span className="w-20 h-2 rounded-full bg-muted" />
        </div>
        {/* main panel */}
        <div className="p-4 md:p-6 space-y-5">
          {/* case status */}
          <div>
            <p className="text-xs text-muted-foreground">מצב התיק</p>
            <div className="mt-2.5 flex items-center gap-2 sm:gap-3 flex-wrap">
              {stages.map((stage, i) => (
                <span key={stage} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${i < activeStage ? "bg-primary/20" : i === activeStage ? "bg-primary" : "bg-border/60"}`}>
                    {i < activeStage ? <Check size={10} strokeWidth={3} className="text-primary" /> : null}
                  </span>
                  <span className={`text-[11px] ${i === activeStage ? "font-bold text-foreground" : "text-muted-foreground"}`}>{stage}</span>
                  {i < stages.length - 1 && <span className="hidden sm:block w-4 h-px bg-border" aria-hidden />}
                </span>
              ))}
            </div>
          </div>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                <p className="font-ticker font-bold text-sm md:text-base text-foreground tabular-nums leading-tight mt-0.5 whitespace-nowrap" dir="ltr">{kpi.value}</p>
              </div>
            ))}
          </div>
          {/* structure bar */}
          <div>
            <p className="text-xs text-muted-foreground">תמהיל המשכנתא</p>
            <div className="mt-2 flex h-2.5 gap-1 rounded-full overflow-hidden" aria-hidden>
              <span className="bg-primary" style={{ width: "38%" }} />
              <span className="bg-primary/50" style={{ width: "26%" }} />
              <span className="bg-gold-gradient" style={{ width: "18%" }} />
              <span className="bg-border flex-1" />
            </div>
          </div>
          {/* offers */}
          <div className="grid sm:grid-cols-3 gap-2.5">
            {offers.map((offer) => (
              <div key={offer.bank} className={`rounded-xl border p-3 ${offer.best ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <p className="text-[11px] text-muted-foreground">{offer.bank}</p>
                <p className="font-ticker font-bold text-foreground tabular-nums" dir="ltr">{offer.rate}</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
                  <div className={`h-full rounded-full ${offer.best ? "bg-gold-gradient" : "bg-primary/35"}`} style={{ width: offer.best ? "100%" : offer.bank === "בנק ב'" ? "82%" : "60%" }} />
                </div>
              </div>
            ))}
          </div>
          {/* next action */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
            <p className="text-xs font-medium text-foreground">הפעולה הבאה: אישור ההצעה של בנק א'</p>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step visuals: each step looks different ───
function StepVisual({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div className="mt-4 w-40" aria-hidden>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>בקצב שלכם</span>
          <span className="font-ticker tabular-nums">~10 דק'</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-primary/60" style={{ width: "30%" }} />
        </div>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className="mt-4 space-y-1.5" aria-hidden>
        <span className="block w-40 h-2 rounded-full bg-primary/25" />
        <span className="block w-32 h-2 rounded-full bg-border" />
        <span className="block w-36 h-2 rounded-full bg-border/70" />
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className="mt-4 flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((j) => (
          <span key={j} className={`w-8 h-8 rounded-full border flex items-center justify-center ${j === 1 ? "border-primary bg-primary/10" : "border-border"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${j === 1 ? "bg-primary" : "bg-border"}`} />
          </span>
        ))}
        <span className="text-[11px] text-muted-foreground">3 בנקים במקביל</span>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-1.5" aria-hidden>
      {["הצעות", "השוואה", "השלב הבא"].map((row) => (
        <span key={row} className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="w-3.5 h-3.5 rounded-full bg-primary/15 flex items-center justify-center"><Check size={9} strokeWidth={3} className="text-primary" /></span>
          {row}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const handleCTAClick = () => navigate("/mortgage-check");
  const handleBalanceClick = () => navigate("/balance-check");

  return (
    <div dir="rtl">

      {/* ═══════ Hero — emotional, editorial ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-0 bg-grain opacity-50" />
        <div className="container relative grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center py-12 md:py-20">
          {/* text side */}
          <div className="max-w-xl">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            >
              משכנתא בלי לעצור את החיים
            </motion.span>
            <motion.h1
              className="font-display text-4xl md:text-6xl font-extrabold leading-[1.08] text-foreground"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            >
              10 דקות באתר.<br />
              <span className="text-gradient-gold">ואנחנו נכנסים לעבודה.</span>
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground leading-relaxed mt-5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            >
              פותחים תיק, מעלים את הפרטים והמסמכים במקום אחד, ואנחנו מרכזים את העבודה המקצועית וההתקדמות מול הבנקים.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            >
              <Button
                variant="hero" size="xl"
                className="shadow-gold rounded-full min-h-14 px-9 text-base"
                onClick={handleCTAClick}
              >
                פתיחת תיק
                <ChevronLeft size={20} />
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full border-primary text-primary hover:bg-primary/10 min-h-14 px-7">
                <Link to="/balance-check">בדיקת המשכנתא שלי בחינם</Link>
              </Button>
            </motion.div>
            <motion.p
              className="text-xs text-muted-foreground mt-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            >
              לוקח 2 דקות בלבד, ללא התחייבות
            </motion.p>
          </div>

          {/* image side: cropped lifestyle photo + floating product chip */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          >
            <span aria-hidden className="absolute -top-6 -left-6 w-56 h-56 rounded-full bg-primary/8 blur-2xl" />
            <div className="relative rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-card-hover border border-border">
              <img
                src={heroLifestyle}
                alt="זוג צעיר בדירה מוארת עם מפתחות לבית החדש"
                width={1024} height={1280}
                className="w-full h-full object-cover aspect-[4/5] max-h-[560px]"
              />
            </div>
            {/* floating mini product chip */}
            <motion.div
              className="absolute -bottom-6 right-4 md:-right-6 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3.5 flex items-center gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            >
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">החזר חודשי להמחשה</p>
                <p className="font-ticker font-bold text-foreground tabular-nums leading-none mt-0.5" dir="ltr">₪4,980</p>
              </div>
              <div className="flex items-end gap-1 h-8" aria-hidden>
                <span className="w-1.5 h-4 rounded-sm bg-primary/20" />
                <span className="w-1.5 h-5 rounded-sm bg-primary/35" />
                <span className="w-1.5 h-6 rounded-sm bg-primary/60" />
                <span className="w-1.5 h-8 rounded-sm bg-gold-gradient" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ KPI strip — approved, unchanged ═══════ */}
      <StatsSection />

      {/* ═══════ How it works — editorial story ═══════ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-extrabold text-foreground max-w-xl">
            מהרגע שהחלטתם להתקדם, <span className="text-gradient-gold">אנחנו מסדרים את הדרך.</span>
          </motion.h2>

          <div className="mt-12 md:mt-16 space-y-12 md:space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="grid md:grid-cols-2 gap-4 md:gap-10 items-center relative"
              >
                {/* giant number */}
                <div className={`flex items-baseline gap-5 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <span className="font-ticker text-7xl md:text-8xl font-bold text-primary/15 leading-none select-none" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 h-px bg-border/70 hidden md:block" aria-hidden />
                </div>
                {/* text */}
                <div className={i % 2 === 1 ? "md:order-1 md:text-left" : ""}>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground mt-1.5">{step.desc}</p>
                  <StepVisual i={i} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ The home is the goal — emotional, image-led ═══════ */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <div className="container grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
          <motion.div {...fadeUp} className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              המשכנתא היא רק הדרך.<br />
              <span className="text-gradient-gold">הבית הוא המטרה.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mt-6 max-w-md">
              פחות טלפונים, פחות התרוצציות, פחות סימני שאלה.
            </p>
            <p className="text-lg font-medium text-foreground mt-2 max-w-md">
              יותר זמן לדירה, למשפחה ולחיים שמסביב.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="relative">
            <div className="rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden shadow-card-hover border border-border lg:-mt-8">
              <img
                src={homeBalcony}
                alt="מרפסת שקטה עם נוף שכונה שקיעה"
                width={1400} height={900}
                loading="lazy"
                className="w-full object-cover aspect-[3/2]"
              />
            </div>
            <div className="absolute -bottom-5 right-6 lg:right-10 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3">
              <p className="text-sm font-medium text-foreground">פחות סימני שאלה. יותר שקט נפשי.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Command center — product-led ═══════ */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container max-w-6xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              כל המשכנתא שלכם <span className="text-gradient-gold">במקום אחד.</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              מרכז השליטה שלכם: איפה התיק עומד, מה ההחזר, ואילו הצעות על השולחן.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[0.85fr_2fr_0.85fr] gap-8 lg:gap-10 items-center">
            {/* annotations right */}
            <motion.div {...fadeUp} className="hidden lg:flex flex-col gap-12 text-right order-1">
              {[
                { n: "01", t: "מסמכים פעם אחת", d: "מעלים פעם אחת, בלי לחזור על זה בכל בנק." },
              ].map((a) => (
                <div key={a.n}>
                  <p className="font-ticker text-sm text-primary/60 tabular-nums" dir="ltr">{a.n}</p>
                  <p className="font-bold text-foreground mt-1">{a.t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.d}</p>
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeUp} className="order-2 min-w-0">
              <CommandCenterMockup />
              <p className="text-center text-xs text-muted-foreground mt-4">* הנתונים בתמונה להמחשה בלבד.</p>
            </motion.div>

            {/* annotations left */}
            <motion.div {...fadeUp} className="hidden lg:flex flex-col gap-12 text-left order-3">
              {[
                { n: "02", t: "איפה התיק עומד", d: "סטטוס חי בכל רגע, בלי לחכות לטלפון." },
                { n: "03", t: "הצעות בהשוואה", d: "מהבנקים הרלוונטיים — במקום אחד." },
              ].map((a) => (
                <div key={a.n}>
                  <p className="font-ticker text-sm text-primary/60 tabular-nums" dir="ltr">{a.n}</p>
                  <p className="font-bold text-foreground mt-1">{a.t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.d}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* mobile annotations */}
          <div className="grid sm:grid-cols-3 gap-6 mt-10 lg:hidden">
            {[
              { t: "איפה התיק עומד", d: "סטטוס חי בכל רגע." },
              { t: "מסמכים פעם אחת", d: "בלי לחזור על זה בכל בנק." },
              { t: "הצעות בהשוואה", d: "מהבנקים הרלוונטיים, במקום אחד." },
            ].map((a) => (
              <div key={a.t}>
                <p className="font-bold text-foreground">{a.t}</p>
                <p className="text-sm text-muted-foreground mt-1">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Bank logos — real trust ═══════ */}
      <BankLogosSection />

      {/* ═══════ Free check / calculators — playful tools ═══════ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              רוצים להתחיל <span className="text-gradient-gold">בלי להתחייב?</span>
            </h2>
            <p className="text-muted-foreground mt-3">שתי דרכים להתחיל — שתיהן חינם, ושתיהן לוקחות דקות.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* tool 1: existing mortgage */}
            <motion.button
              {...fadeUp}
              onClick={handleBalanceClick}
              className="group text-right rounded-3xl border border-border bg-card p-7 md:p-9 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="inline-flex rounded-full bg-muted px-3.5 py-1 text-xs font-medium text-muted-foreground">למשכנתא קיימת או מיחזור</span>
              <h3 className="text-2xl font-extrabold text-foreground mt-4">בדיקת המשכנתא שלי</h3>
              <p className="text-muted-foreground text-sm mt-2">מה המשכנתא הנוכחית עולה לכם — ומה אפשר לחסוך.</p>
              {/* fake interactive field */}
              <div className="mt-6 rounded-2xl border border-border bg-background/70 p-4" aria-hidden>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">יתרת המשכנתא שלכם</span>
                  <span className="font-ticker font-bold text-foreground tabular-nums" dir="ltr">₪712,000</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-border mt-4">
                  <div className="h-full rounded-full bg-primary/50" style={{ width: "62%" }} />
                  <span className="absolute top-1/2 -translate-y-1/2 right-[62%] w-4 h-4 rounded-full bg-card border-2 border-primary shadow" />
                </div>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-primary font-bold text-sm">
                לבדיקה חינם
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </span>
            </motion.button>

            {/* tool 2: new purchase */}
            <motion.button
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              onClick={handleCTAClick}
              className="group text-right rounded-3xl border border-primary/25 bg-primary/5 p-7 md:p-9 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="inline-flex rounded-full bg-card px-3.5 py-1 text-xs font-medium text-primary border border-primary/20">לרכישה חדשה</span>
              <h3 className="text-2xl font-extrabold text-foreground mt-4">כמה משכנתא אני יכול לקחת?</h3>
              <p className="text-muted-foreground text-sm mt-2">תמונת מצב מהירה לפי ההכנסות וההון העצמי שלכם.</p>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-4" aria-hidden>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">מחיר הנכס</span>
                  <span className="font-ticker font-bold text-foreground tabular-nums" dir="ltr">₪1,850,000</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-border mt-4">
                  <div className="h-full rounded-full bg-gold-gradient" style={{ width: "74%" }} />
                  <span className="absolute top-1/2 -translate-y-1/2 right-[74%] w-4 h-4 rounded-full bg-card border-2 border-primary shadow" />
                </div>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-primary font-bold text-sm">
                לבדיקה חינם
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* ═══════ Pricing — transparent, typographic ═══════ */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container max-w-3xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">מחיר אחד. יודעים מראש.</h2>
            <p className="font-ticker text-6xl md:text-8xl font-black text-foreground tabular-nums mt-6" dir="ltr">₪3,450</p>
            <p className="text-muted-foreground mt-3">שירות מקצועי במחיר קבוע. תשלום אחד, בלי הפתעות.</p>
          </motion.div>

          <motion.ul {...fadeUp} className="grid sm:grid-cols-2 gap-x-12 gap-y-3 mt-10 text-right max-w-xl mx-auto">
            {["ניתוח הנתונים", "בניית חלופות", "טיפול מול בנקים רלוונטיים", "השוואת הצעות", "סטטוס דיגיטלי לאורך הדרך"].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} className="text-primary" />
                </span>
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.p {...fadeUp} className="text-xs text-muted-foreground mt-8">
            חלון טיפול של עד 72 שעות מרגע שהתיק מלא ושולם. זמני האישור של הבנקים אינם בשליטתנו.
          </motion.p>
          <motion.div {...fadeUp} className="mt-8">
            <Button variant="hero" size="xl" className="shadow-gold rounded-full px-10" onClick={handleCTAClick}>
              פתיחת תיק
              <ChevronLeft size={20} />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Founder — personal, editorial ═══════ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-center">
          <motion.div {...fadeUp} className="order-2 lg:order-1">
            <div className="max-w-xs mx-auto lg:mx-0">
              <div className="rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-card border border-border">
                <img
                  src={founderImage}
                  alt="שי אליס, מייסד EASY MORTE"
                  loading="lazy"
                  className="w-full object-cover aspect-[4/5]"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center lg:text-right">שי אליס, מייסד EASY MORTE</p>
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              יש גם בן אדם <span className="text-gradient-gold">מאחורי המערכת.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mt-5 max-w-lg">
              שי אליס הגיע מהחיבור שבין פיננסים, טכנולוגיה ועסקים — והקים את EasyMorte מתוך מטרה פשוטה: להפוך תהליך מסורבל לתהליך ברור.
            </p>
            <p className="text-foreground font-medium leading-relaxed mt-4 max-w-lg">
              בלי שיחות מכירה ובלי סודות. אתם יודעים איפה הדברים עומדים, בכל שלב.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Trust without badges ═══════ */}
      <section className="py-16 md:py-24 bg-secondary/40">
        <div className="container max-w-3xl">
          <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">בלי אותיות קטנות.</motion.h2>
          <div>
            {["EasyMorte אינה בנק.", "הבנקים הם שמאשרים את המשכנתא.", "EasyMorte אינה מקבלת עמלות מהבנקים."].map((line, i) => (
              <motion.p
                key={line}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="text-xl md:text-2xl font-semibold text-foreground py-6 border-b border-border/60 last:border-0"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ — light ═══════ */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-2xl">
          <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-extrabold text-center text-foreground mb-10">שאלות נפוצות</motion.h2>
          <motion.div {...fadeUp}>
            <Accordion type="single" collapsible className="divide-y divide-border/60">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-0">
                  <AccordionTrigger className="text-sm font-semibold text-right hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Final CTA — emotional ═══════ */}
      <section className="relative overflow-hidden">
        <img
          src={ctaLight}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-background/20" />
        <div className="container relative py-20 md:py-28">
          <motion.div {...fadeUp} className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              יש בית שאתם רוצים להגיע אליו.<br />
              <span className="text-gradient-gold">בואו נסדר את הדרך לשם.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
              <Button variant="hero" size="xl" className="shadow-gold rounded-full min-h-14 px-9 text-base" onClick={handleCTAClick}>
                פתיחת תיק
                <ChevronLeft size={20} />
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full border-primary text-primary hover:bg-primary/10 min-h-14 px-7 bg-card/60">
                <Link to="/balance-check">בדיקת המשכנתא שלי בחינם</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
