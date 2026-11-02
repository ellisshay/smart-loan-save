import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Check, ChevronLeft } from "lucide-react";
import StatsSection from "@/components/home/StatsSection";
import BankLogosSection from "@/components/home/BankLogosSection";
import heroLifestyle from "@/assets/home-modern-couple.webp";
import architecturalCrop from "@/assets/luxury-building.webp";
import ctaLight from "@/assets/cta-light.webp";
import founderImage from "@/assets/shay-ellis-founder.webp";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ─── The journey: 4 moments along one path ───
const steps = [
  { title: "פותחים תיק", desc: "כמה דקות של פרטים ראשוניים." },
  { title: "מעלים פעם אחת", desc: "המסמכים והמידע במקום אחד." },
  { title: "אנחנו נכנסים לעבודה", desc: "בודקים, בונים חלופות ופונים לבנקים הרלוונטיים." },
  { title: "רואים הכול ברור", desc: "הצעות, השוואה והשלב הבא במקום אחד." },
];

const faqItems = [
  { q: "כמה זמן זה לוקח?", a: "פתיחת התיק והעלאת המסמכים לוקחות בערך 10 דקות. מרגע שהתיק מלא ושולם, אנחנו מטפלים בו בחלון של עד 72 שעות. זמני האישור והמענה של הבנקים אינם בשליטת EasyMorte." },
  { q: "האם צריך להגיע לפגישה?", a: "רוב התהליך מול EasyMorte מתנהל אונליין. בהתאם לבנק ולעסקה, ייתכן שבהמשך תידרשו לזיהוי, חתימה או פעולה מול הבנק." },
  { q: "מתי משלמים?", a: "הבדיקה הראשונית חינם. תשלום אחד של ₪3,450 משלמים אחרי שמילאתם את השאלון, לפני שהטיפול המקצועי מתחיל. אפשר להשלים מסמכים גם אחרי התשלום." },
  { q: "האם אתם מבטיחים אישור?", a: "לא, ואף אחד לא יכול. את המשכנתא מאשרים הבנקים. אנחנו מבטיחים תהליך מסודר, שקוף ומקצועי — ושתדעו בדיוק איפה הדברים עומדים." },
  { q: "מה כולל המחיר?", a: "ניתוח הנתונים, בניית חלופות, טיפול מול בנקים רלוונטיים, השוואת הצעות וסטטוס דיגיטלי לאורך כל הדרך." },
  { q: "מה אם עדיין חסרים לי מסמכים?", a: "פותחים תיק וממשיכים. אפשר להשלים מסמכים בהמשך — המערכת מסמנת בדיוק מה חסר, ואנחנו עוזרים לסדר את זה." },
];

// ─── Product mockup: the case command center (illustrative) ───
function CommandCenterMockup() {
  const stages = ["פתיחת תיק", "מסמכים", "בנקים", "חתימה"];
  const activeStage = 2;
  // Generic illustration only: no amounts, no rates, no "winning" bank.
  const kpis = ["החזר חודשי", "סכום המשכנתא", "אחוז מימון"];
  const offers = ["הצעה 1", "הצעה 2", "הצעה 3"];
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
            {kpis.map((label) => (
              <div key={label} className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <span className="block mt-2 h-2.5 w-3/4 rounded-full bg-primary/20" aria-hidden />
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
              <div key={offer} className="rounded-xl border border-border p-3">
                <p className="text-[11px] text-muted-foreground">{offer}</p>
                <span className="block mt-2 h-2 w-2/3 rounded-full bg-primary/25" aria-hidden />
                <span className="block mt-1.5 h-1.5 w-1/2 rounded-full bg-muted" aria-hidden />
              </div>
            ))}
          </div>
          {/* next action */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
            <p className="text-xs font-medium text-foreground">השלב הבא: השלמת מסמך אחד</p>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tiny product snippets woven into the journey ───
function StepSnippet({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div className="w-44" aria-hidden>
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
      <div className="space-y-1.5" aria-hidden>
        <span className="block w-40 h-2 rounded-full bg-primary/25" />
        <span className="block w-32 h-2 rounded-full bg-border" />
        <span className="block w-36 h-2 rounded-full bg-border/70" />
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((j) => (
          <span key={j} className={`w-8 h-8 rounded-full border flex items-center justify-center ${j === 1 ? "border-primary bg-primary/10" : "border-border"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${j === 1 ? "bg-primary" : "bg-border"}`} />
          </span>
        ))}
        <span className="text-[11px] text-muted-foreground">עד 3 בנקים רלוונטיים</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5" aria-hidden>
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
  const handleBalanceClick = () => navigate("/balance-check");
  const handleAffordabilityClick = () => navigate("/calculators/affordability");

  return (
    <div dir="rtl">

      {/* ═══════ A · Hero — one composition: image + editorial type ═══════ */}
      <section className="home-editorial-hero relative overflow-hidden bg-card" aria-labelledby="home-headline">
        <img
          src={heroLifestyle}
          alt="זוג צעיר בסלון של דירה חדשה ומודרנית, מול מרפסת עם פינת ישיבה ועציצים, באור יום טבעי"
          width={1920} height={1376}
          fetchPriority="high"
          className="home-editorial-photo dark:brightness-50"
        />
        <div aria-hidden className="home-editorial-scrim hidden lg:block absolute inset-0 pointer-events-none" />
        <div className="container relative home-editorial-content">
          <div className="home-editorial-copy">
            <p className="text-sm md:text-base font-medium tracking-wide text-muted-foreground mb-4 md:mb-6">
              משכנתא בלי לעצור את החיים.
            </p>
            <h1 id="home-headline" className="font-display text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.16] text-foreground">
              10 דקות באתר.<br />
              ואנחנו נכנסים <span className="decoration-primary/60 underline underline-offset-8 decoration-2">לעבודה.</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed mt-6 max-w-md">
              פותחים תיק, מעלים את הפרטים והמסמכים במקום אחד, ואנחנו מרכזים את העבודה המקצועית וההתקדמות מול הבנקים.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7 md:mt-9">
              <Button asChild variant="default" size="default" className="rounded-lg h-12 min-h-12 px-6 text-base">
                <Link to="/intake">פתיחת תיק<ChevronLeft size={20} /></Link>
              </Button>
              <Button asChild variant="outline" size="default" className="rounded-lg border-foreground/25 bg-transparent text-foreground hover:bg-card/70 hover:text-foreground h-12 min-h-12 px-5 text-base">
                <Link to="/mortgage-check">בדיקת המשכנתא שלי בחינם</Link>
              </Button>
            </div>
            <p className="text-xs text-foreground/70 mt-4">
              הבדיקה חינם וללא התחייבות · אנחנו לא מקבלים עמלות מהבנקים
            </p>
          </div>
        </div>
      </section>

      {/* ═══════ KPI strip — approved, unchanged ═══════ */}
      <StatsSection />

      {/* ═══════ B · Emotional transition — a breathing moment ═══════ */}
      <section className="relative overflow-hidden" aria-label="פחות בירוקרטיה, יותר התקדמות">
        <img
          src={architecturalCrop}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/85 to-background/30" aria-hidden />
        <div className="container relative py-20 md:py-32">
          <motion.div {...fadeUp} className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              פחות להתעסק במשכנתא.<br />
              <span className="text-gradient-gold">יותר להתקדם לבית.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mt-6 max-w-md">
              בלי לרדוף אחרי מסמכים, בלי לזכור למי התקשרתם ובלי לנחש מה השלב הבא.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ C · The journey — one path, four moments ═══════ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-5xl">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-extrabold text-foreground max-w-xl">
            מהרגע שהחלטתם להתקדם, <span className="text-gradient-gold">אנחנו מסדרים את הדרך.</span>
          </motion.h2>

          <div className="relative mt-14 md:mt-20">
            {/* the thread connecting the four moments */}
            <span aria-hidden className="absolute top-0 bottom-0 right-[7px] md:right-1/2 md:translate-x-1/2 w-px bg-border" />
            <div className="space-y-16 md:space-y-24">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                  className="relative grid md:grid-cols-2 gap-6 md:gap-16 items-center"
                >
                  {/* node on the thread */}
                  <span aria-hidden className="absolute right-0 md:right-1/2 md:translate-x-1/2 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-primary bg-background" />
                  {/* text block — alternating sides */}
                  <div className={`pr-8 md:pr-0 ${i % 2 === 1 ? "md:order-2 md:pr-16" : "md:pl-16 md:text-left"}`}>
                    <p className="font-ticker text-xs text-primary/70 tabular-nums" dir="ltr">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mt-2">{step.title}</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs md:max-w-none md:inline-block">{step.desc}</p>
                  </div>
                  {/* snippet block */}
                  <div className={`pr-8 md:pr-0 ${i % 2 === 1 ? "md:order-1 md:pl-16 md:flex md:justify-start" : "md:pr-16 md:flex md:justify-end"}`}>
                    <StepSnippet i={i} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ D · Product reveal — "סוף סוף אני מבין מה קורה" ═══════ */}
      <section className="py-20 md:py-28 bg-secondary/40">
        <div className="container max-w-6xl">
          <motion.div {...fadeUp} className="mb-10 md:mb-14 max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              כל המשכנתא שלכם <span className="text-gradient-gold">במקום אחד.</span>
            </h2>
            <p className="text-muted-foreground mt-3">
              מרכז השליטה שלכם — בלי לחכות לטלפון, בלי לנחש.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-10 lg:gap-14 items-center">
            {/* the product, large and off-center */}
            <motion.div {...fadeUp} className="min-w-0">
              <CommandCenterMockup />
              <p className="text-xs text-muted-foreground mt-4">דוגמה להמחשה בלבד</p>
            </motion.div>

            {/* only 3 annotations */}
            <motion.div {...fadeUp} className="flex flex-col gap-10">
              {[
                { n: "01", t: "איפה התיק עומד", d: "סטטוס מעודכן והשלב הבא." },
                { n: "02", t: "מה קורה עם ההחזר", d: "המספרים שלכם, תמיד מול העיניים." },
                { n: "03", t: "מה הפעולה הבאה", d: "צעד אחד ברור, בלי סימני שאלה." },
              ].map((a) => (
                <div key={a.n} className="border-r-2 border-primary/30 pr-5">
                  <p className="font-ticker text-xs text-primary/70 tabular-nums" dir="ltr">{a.n}</p>
                  <p className="font-bold text-lg text-foreground mt-1">{a.t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.d}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ Bank logos — real trust ═══════ */}
      <BankLogosSection />

      {/* ═══════ E · Free tools — split, interactive ═══════ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-5xl">
          <motion.div {...fadeUp} className="mb-12 max-w-xl">
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
              <p className="text-muted-foreground text-sm mt-2">מה המשכנתא הנוכחית עולה לכם, והאם יש פוטנציאל לחיסכון.</p>
              {/* fake interactive field */}
              <div className="mt-6 rounded-2xl border border-border bg-background/70 p-4" aria-hidden>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">יתרת המשכנתא שלכם</span>
                  <span className="text-xs text-muted-foreground/70" dir="ltr">₪ ———</span>
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
              onClick={handleAffordabilityClick}
              className="group text-right rounded-3xl border border-primary/25 bg-primary/5 p-7 md:p-9 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span className="inline-flex rounded-full bg-card px-3.5 py-1 text-xs font-medium text-primary border border-primary/20">לרכישה חדשה</span>
              <h3 className="text-2xl font-extrabold text-foreground mt-4">כמה משכנתא אני יכול לקחת?</h3>
              <p className="text-muted-foreground text-sm mt-2">תמונת מצב מהירה לפי ההכנסות וההון העצמי שלכם.</p>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-4" aria-hidden>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">הכנסה והון עצמי</span>
                  <span className="text-xs text-muted-foreground/70" dir="ltr">₪ ———</span>
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

      {/* ═══════ F · Pricing — large typography, no card ═══════ */}
      <section className="py-20 md:py-28 bg-secondary/40">
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
            <br />התשלום אינו הבטחה לאישור או לריבית מסוימת. <Link to="/pricing" className="underline">מה כלול במחיר</Link> · <Link to="/cancel" className="underline">מדיניות ביטול</Link>
          </motion.p>
          <motion.div {...fadeUp} className="mt-8">
            <Button asChild variant="hero" size="xl" className="shadow-gold rounded-full px-10">
              <Link to="/intake">פתיחת תיק<ChevronLeft size={20} /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Founder — personal, editorial ═══════ */}
      <section className="py-20 md:py-28 bg-background">
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
              בעל תואר ראשון במנהל עסקים, עם רקע בפיננסים, שוק ההון, ייעוץ עסקי וטכנולוגיה, וניסיון במערכות פיננסיות ובתהליכים דיגיטליים. את EasyMorte הקים כדי להפוך את תהליך המשכנתא לברור, מסודר ושקוף יותר.
            </p>
            <p className="text-foreground font-medium leading-relaxed mt-4 max-w-lg">
              בלי שיחות מכירה ובלי סודות. אתם יודעים איפה הדברים עומדים, בכל שלב.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Trust without badges ═══════ */}
      <section className="py-20 md:py-28 bg-secondary/40">
        <div className="container max-w-3xl">
          <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">בלי אותיות קטנות.</motion.h2>
          <div>
            {["EasyMorte אינה בנק.", "הבנקים הם שמאשרים את המשכנתא.", "EasyMorte אינה מקבלת עמלות מהבנקים.", "גישה לתיק דורשת התחברות, והמסמכים נשמרים באחסון פרטי.", "אפשר לנהל בקשות פרטיות, כולל מחיקת מידע, דרך האזור האישי."].map((line, i) => (
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
          <p className="text-sm text-muted-foreground mt-6">אליס שירותי ייעוץ · ע.מ 049025836 · טרומפלדור 11, כפר סבא · <Link to="/privacy" className="text-primary underline">מדיניות הפרטיות</Link></p>
        </div>
      </section>

      {/* ═══════ FAQ — light ═══════ */}
      <section className="py-20 md:py-28 bg-background">
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

      {/* ═══════ Final CTA — the home is the reward ═══════ */}
      <section className="relative overflow-hidden">
        <img
          src={ctaLight}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-background/20" />
        <div className="container relative py-24 md:py-36">
          <motion.div {...fadeUp} className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
              הבית הוא המטרה.<br />
              <span className="text-gradient-gold">אנחנו מסדרים את הדרך.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
              <Button asChild variant="hero" size="xl" className="shadow-gold rounded-full min-h-14 px-9 text-base">
                <Link to="/intake">פתיחת תיק<ChevronLeft size={20} /></Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full border-primary text-primary hover:bg-primary/10 min-h-14 px-7 bg-card/60">
                <Link to="/mortgage-check">בדיקת המשכנתא שלי בחינם</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
