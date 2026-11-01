import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Check, CheckCircle, X, ChevronLeft, ShieldCheck, Landmark,
  FileText, Upload, Handshake, Home, BadgeCheck, Laptop, ListChecks, PieChart,
} from "lucide-react";
import StatsSection from "@/components/home/StatsSection";
import BankLogosSection from "@/components/home/BankLogosSection";
import SmartAssessment from "@/components/home/SmartAssessment";
import { QuizData } from "@/types/quiz";
import heroHouse from "@/assets/hero-house.webp";

// ─── Hero facts (all verified: fixed price, digital EasyMorte process, no unnecessary meetings) ───
const heroFacts = [
  { icon: Laptop, text: "תהליך EasyMorte מתנהל דיגיטלית" },
  { icon: Handshake, text: "בלי פגישות מיותרות" },
  { icon: BadgeCheck, text: "3,450 ₪ מחיר קבוע" },
];

// ─── How it works (4 steps). 72h = our handling window after a complete file + payment. ───
const steps = [
  { icon: FileText, title: "פותחים תיק", desc: "כ-10 דקות לפתיחת התיק והשלמת הפרטים הראשוניים." },
  { icon: Upload, title: "מעלים מסמכים", desc: "במקום אחד, מהטלפון או מהמחשב. פותחים תיק ומעלים מסמכים מכל מקום ובכל זמן." },
  { icon: ShieldCheck, title: "אנחנו מטפלים בתיק", desc: "בדיקה מקצועית ובניית תמהילים, בתוך עד 72 שעות מרגע שהתיק מלא והתשלום התקבל." },
  { icon: Landmark, title: "פנייה לבנקים והשוואה", desc: "פונים לעד 3 בנקים רלוונטיים ומציגים לכם באזור האישי השוואה ברורה בין ההצעות." },
];

// ─── What EasyMorte does / does not do ───
const weDo = [
  "מרכזים את הפרטים והמסמכים של התיק במקום אחד",
  "בודקים את כושר ההחזר ובונים תמהילים",
  "פונים לעד 3 בנקים רלוונטיים ומשווים בין ההצעות",
  "מציגים באזור האישי איפה התיק עומד ומה השלב הבא",
];
const weDont = [
  "אנחנו לא בנק ולא מאשרים משכנתאות",
  "אנחנו לא מקבלים עמלות מהבנקים",
  "אנחנו לא מבטיחים אישור, ריבית או תנאים מסוימים",
];

// ─── Ways of working, qualitative only (no market numbers without a source) ───
const oldWay = ["פגישות", "שיחות", "איסוף מסמכים לכל בנק בנפרד", "מעקב עצמאי מול הבנקים"];
const newWay = ["תהליך דיגיטלי", "תיק אחד", "סטטוס במקום אחד", "טיפול מרוכז"];

// ─── Personal area features (all implemented in the client dashboard) ───
const commandCenter = [
  { icon: ListChecks, title: "סטטוס והשלב הבא", desc: "בכל רגע רואים איפה התיק עומד ומה נדרש מכם, אם בכלל." },
  { icon: FileText, title: "מרכז מסמכים", desc: "מה התקבל, מה בבדיקה ומה חסר. מעלים ומחליפים מסמך בלחיצה." },
  { icon: PieChart, title: "תמונת המשכנתא", desc: "החזר חודשי, אחוז מימון, מבנה המסלולים ותחזית היתרה, כהערכה." },
  { icon: Landmark, title: "השוואת הצעות", desc: "כשמגיעות הצעות מהבנקים, משווים ביניהן בשפה פשוטה." },
];

// ─── Free tools ───
const tools = [
  { q: "כמה משכנתא אני יכול לקחת?", cta: "לחישוב", href: "/calculators/affordability" },
  { q: "כמה תעלה לי משכנתא חדשה?", cta: "לחישוב", href: "/mortgage-calculator" },
  { q: "האם מחזור יכול להשתלם לי?", cta: "בדיקת אפשרות למחזור", href: "/refinance-calculator" },
  { q: "יש לכם דוח יתרות לסילוק?", cta: "העלאת דוח יתרות", href: "/balance-check" },
];

// ─── Security & privacy: only what the product actually does ───
const security = [
  { title: "אחסון פרטי", desc: "המסמכים נשמרים באחסון פרטי עם הרשאות גישה, ולא בתיבת דואר." },
  { title: "חיבור מוצפן", desc: "האתר והאזור האישי עובדים בחיבור מוצפן (HTTPS)." },
  { title: "יומן צפייה", desc: "צפייה במסמכים נרשמת ביומן ביקורת." },
  { title: "שליטה בפרטיות", desc: "מדיניות פרטיות גלויה, הסכמה לפני שמירת נתונים, ואפשרות לבקש מחיקת מידע מהאזור האישי." },
];

// ─── FAQ ───
const faqItems = [
  { q: "כמה זה עולה?", a: "הבדיקה הראשונית והמחשבונים בחינם. התהליך המלא עולה 3,450 ₪, מחיר קבוע. אנחנו לא מקבלים עמלות מהבנקים." },
  { q: "מה קורה בתוך 72 השעות?", a: "חלון ה-72 שעות הוא זמן הטיפול המקצועי שלנו, והוא מתחיל רק אחרי שהתשלום התקבל והתיק מלא ותקין. זמני האישור והמענה של הבנקים אינם בשליטת EasyMorte." },
  { q: "האם צריך להגיע לפגישה?", a: "רוב התהליך מול EasyMorte מתנהל אונליין. בהתאם לבנק ולעסקה, ייתכן שבהמשך תידרשו לזיהוי, חתימה או פעולה מול הבנק." },
  { q: "האם המסמכים שלי מאובטחים?", a: "המסמכים נשמרים באחסון פרטי עם הרשאות גישה, ונגישים רק לכם ולמי שמטפל בתיק לפי הצורך. צפייה במסמכים נרשמת ביומן ביקורת." },
  { q: "האם אתם מבטיחים אישור או ריבית מסוימת?", a: "לא. אישור המשכנתא, הריבית והתנאים נקבעים על ידי הבנק. אנחנו מכינים את התיק, פונים לבנקים ומשווים בין ההצעות." },
  { q: "האם אני חייב לבחור באחת ההצעות?", a: "לא. הבחירה שלכם." },
];

// ─── Main Component ───
export default function HomePage() {
  const navigate = useNavigate();

  const [showAssessment, setShowAssessment] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [completedData, setCompletedData] = useState<QuizData>({});

  const assessmentRef = useRef<HTMLDivElement>(null);


  const handleAssessmentComplete = useCallback((score: number, data: QuizData) => {
    setCompletedScore(score);
    setCompletedData(data);
    localStorage.setItem("easymort_quiz", JSON.stringify(data));
    supabase.auth.getSession().then(({ data: { session } }) => {
      window.location.href = session ? "/intake" : "/auth?next=/intake";
    });
  }, []);

  const handleRegistration = async () => {
    if (!regForm.name.trim() || !regForm.phone.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-lead", {
        body: {
          name: regForm.name.trim(),
          phone: regForm.phone.trim(),
          email: regForm.email.trim() || null,
          quiz_answers: completedData,
          property_price: completedData.property_price,
          monthly_income: completedData.salary_net,
          purpose: completedData.purpose,
          score: completedScore,
        },
      });
      if (error) throw error;
      if (data?.lead_id) localStorage.setItem("easymort_lead_id", data.lead_id);
      localStorage.setItem("easymort_score", String(completedScore));
      localStorage.setItem("easymort_reg_time", new Date().toISOString());
      navigate("/results?fresh=1");
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl">

      {/* ═══════ Hero ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-0 bg-grain opacity-60" />

        {/* House as a soft full-bleed atmospheric background */}
        <motion.div
          className="absolute inset-0 pointer-events-none select-none"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <img src={heroHouse} alt="" aria-hidden className="w-full h-full object-cover object-left" />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/85 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        </motion.div>

        <div className="container relative py-14 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          {/* Text side */}
          <div className="max-w-xl">
            <motion.h1
              className="font-display text-4xl md:text-6xl font-extrabold leading-[1.08] mb-5 text-foreground"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              10 דקות באתר. <span className="text-gradient-gold">ואנחנו נכנסים לעבודה.</span>
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              פותחים תיק, מעלים את הפרטים והמסמכים במקום אחד, ואנחנו מרכזים את העבודה המקצועית וההתקדמות מול הבנקים.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col items-start gap-3"
            >
              <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-5 mb-2" aria-label="עובדות על השירות">
                {heroFacts.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <f.icon size={16} className="text-primary shrink-0" aria-hidden /> {f.text}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full sm:w-auto">
                <Button asChild variant="hero" size="xl" className="shadow-gold rounded-full h-auto min-h-14 px-8 sm:px-10 py-2 text-base sm:text-lg">
                  <Link to="/intake">פתיחת תיק<ChevronLeft size={20} className="hidden sm:block" /></Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="rounded-full border-primary text-primary hover:bg-primary/10 h-auto min-h-14 px-6 sm:px-7 py-2 text-base">
                  <Link to="/mortgage-check">בדיקת המשכנתא שלי בחינם</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">הבדיקה חינם וללא התחייבות · אנחנו לא מקבלים עמלות מהבנקים</p>
            </motion.div>

          </div>

          {/* Image side (mobile / tablet) */}
          <motion.div
            className="relative lg:hidden"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="rounded-3xl overflow-hidden shadow-card-hover border border-border rotate-[-1.5deg]">
              <img
                src={heroHouse}
                alt="בית מודרני"
                width={1024}
                height={768}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-5 right-6 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3 flex flex-col items-center text-center gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <BadgeCheck size={20} strokeWidth={2.2} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">מחיר קבוע ושקוף</p>
                <p className="text-xs text-muted-foreground">₪3,450 לשירות המלא</p>
              </div>
            </motion.div>
          </motion.div>
          {/* Desktop: floating badge over the background house */}
          <motion.div
            className="hidden lg:flex absolute bottom-10 left-16 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3 flex-col items-center text-center gap-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <BadgeCheck size={20} strokeWidth={2.2} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">מחיר קבוע ושקוף</p>
              <p className="text-xs text-muted-foreground">₪3,450 לשירות המלא</p>
            </div>
          </motion.div>
        </div>

      </section>

      {/* ═══════ Trust points (verified facts only) ═══════ */}
      <StatsSection />

      {/* ═══════ How it works ═══════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">איך זה עובד?</h2>
          <p className="text-center text-muted-foreground mb-12">ארבעה שלבים, ואתם רואים באזור האישי בכל רגע איפה התיק עומד</p>

          <div className="relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-7 right-[12%] left-[12%] h-0.5 bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex md:flex-col items-center gap-4 md:gap-3 md:text-center relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="relative z-10 w-14 h-14 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shadow-card shrink-0">
                    <step.icon size={22} className="text-primary" />
                    <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Bank Logos (identification only) ═══════ */}
      <BankLogosSection />

      {/* ═══════ Why EasyMorte (qualitative, no market numbers) ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3 text-foreground">למה EasyMorte</h2>
          <p className="text-center text-muted-foreground mb-8">במקום להתרוצץ לבד בין בנקים, מנהלים את הכל במקום אחד</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl bg-muted/40">
              <CardContent className="p-6 space-y-3">
                <p className="font-bold text-foreground">לבד מול הבנקים</p>
                {oldWay.map((t) => <p key={t} className="flex items-center gap-2 text-sm text-muted-foreground"><X size={16} className="shrink-0" aria-hidden />{t}</p>)}
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-primary/5 border-primary/30 border-2">
              <CardContent className="p-6 space-y-3">
                <p className="font-bold text-foreground">עם EasyMorte</p>
                {newWay.map((t) => <p key={t} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle size={16} className="text-primary shrink-0" aria-hidden />{t}</p>)}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════ Digital experience (features that exist in the personal area) ═══════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">כל המשכנתא במסך אחד</h2>
          <p className="text-center text-muted-foreground mb-10">אחרי שפותחים תיק, האזור האישי מראה איפה הדברים עומדים ומה השלב הבא</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {commandCenter.map((x) => (
              <Card key={x.title} className="rounded-2xl">
                <CardContent className="p-5">
                  <x.icon size={22} className="text-primary mb-3" aria-hidden />
                  <p className="font-bold text-sm text-foreground">{x.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{x.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">גישה לאזור האישי דורשת התחברות. החישובים באזור האישי הם הערכה ואינם הצעה של בנק.</p>
        </div>
      </section>

      {/* ═══════ Calculators & free check ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">רוצים לבדוק לבד קודם?</h2>
          <p className="text-center text-muted-foreground mb-10">מחשבונים ובדיקה מהירה, בחינם. התוצאות הן הערכה כללית בלבד.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tools.map((t) => (
              <Link key={t.href} to={t.href} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors min-h-24">
                <p className="font-bold text-sm text-foreground">{t.q}</p>
                <p className="text-sm text-primary mt-2 font-semibold">{t.cta} ←</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Pricing ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-3 text-foreground">מחיר קבוע: 3,450 ₪</h2>
          <p className="text-muted-foreground mb-6">משלמים פעם אחת על השירות המלא. הבדיקה הראשונית והמחשבונים בחינם.</p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm text-right max-w-xl mx-auto mb-6">
            {["בדיקה מקצועית של התיק ובניית תמהילים", "פנייה לעד 3 בנקים רלוונטיים", "השוואה בין ההצעות בשפה פשוטה", "אזור אישי עם סטטוס והשלב הבא"].map((t) => (
              <li key={t} className="flex items-start gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" aria-hidden />{t}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mb-5">התשלום אינו הבטחה לאישור או לריבית מסוימת. אפשר לבטל עסקה לפי <Link to="/cancel" className="underline">מדיניות הביטול</Link>.</p>
          <Button asChild variant="outline" className="rounded-full"><Link to="/pricing">מה כלול במחיר</Link></Button>
        </div>
      </section>

      {/* ═══════ Founder (verified background only) ═══════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container max-w-3xl">
          <Card className="rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <p className="text-sm text-muted-foreground mb-1">מי עומד מאחורי EasyMorte</p>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground">שי אליס, מייסד</h2>
              <p className="text-sm text-foreground/90 mt-3 leading-relaxed">
                בעל תואר ראשון במנהל עסקים, עם רקע בפיננסים, שוק ההון, ייעוץ עסקי וטכנולוגיה, וניסיון במערכות פיננסיות ובתהליכים דיגיטליים.
                את EasyMorte הקים כדי להפוך את תהליך המשכנתא לברור, מסודר ושקוף יותר.
              </p>
              <p className="text-xs text-muted-foreground mt-4">אליס שירותי ייעוץ · ע.מ 049025836 · טרומפלדור 11, כפר סבא</p>
              <Link to="/about" className="inline-block mt-4 text-sm font-semibold text-primary">עוד עלינו</Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════ What we do / don't ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">מה אנחנו עושים, ומה לא</h2>
          <p className="text-center text-muted-foreground mb-10">EasyMorte מרכזת את התהליך מולכם ומול הגורמים הרלוונטיים</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-primary/30">
              <CardContent className="p-6 space-y-3">
                <p className="font-bold text-foreground">מה אנחנו עושים</p>
                {weDo.map((t) => <p key={t} className="flex items-start gap-2 text-sm text-foreground"><Check size={16} className="text-primary shrink-0 mt-0.5" aria-hidden />{t}</p>)}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-3">
                <p className="font-bold text-foreground">מה אנחנו לא</p>
                {weDont.map((t) => <p key={t} className="flex items-start gap-2 text-sm text-muted-foreground"><X size={16} className="shrink-0 mt-0.5" aria-hidden />{t}</p>)}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════ Security & privacy ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8 text-foreground">פרטיות ואבטחה</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {security.map((x) => (
              <Card key={x.title} className="rounded-2xl">
                <CardContent className="p-5 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" aria-hidden />
                  <div><p className="font-bold text-sm text-foreground">{x.title}</p><p className="text-sm text-muted-foreground mt-1">{x.desc}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm mt-6"><Link to="/privacy" className="text-primary underline">מדיניות הפרטיות</Link></p>
        </div>
      </section>

      {/* ═══════ Smart Assessment ═══════ */}
      <AnimatePresence>
        {showAssessment && (
          <motion.section
            ref={assessmentRef}
            id="assessment"
            className="py-16 md:py-24 bg-background scroll-mt-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="container max-w-2xl mx-auto">
              <SmartAssessment onComplete={handleAssessmentComplete} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════ FAQ Section ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8 text-foreground">שאלות נפוצות</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4 bg-card">
                <AccordionTrigger className="text-sm font-semibold text-right">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════ Final CTA ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Home size={30} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">10 דקות באתר. ואנחנו נכנסים לעבודה.</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="hero" size="xl" className="shadow-gold text-lg px-10 rounded-full">
              <Link to="/intake">פתיחת תיק<ArrowLeft size={18} /></Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="rounded-full border-primary text-primary">
              <Link to="/mortgage-check">בדיקת המשכנתא שלי בחינם</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">מחיר קבוע 3,450 ₪ · הבדיקה הראשונית חינם</p>
        </div>
      </section>

      {/* ═══════ Registration Modal ═══════ */}
      <AnimatePresence>
        {showRegModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-2xl border border-border w-full max-w-md p-6 md:p-8 space-y-5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              dir="rtl"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-foreground">הציון שלך: {completedScore}, הניתוח מוכן!</h2>
                <p className="text-sm text-muted-foreground">רק שם וטלפון כדי לשלוח לך את הדוח</p>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="שם פרטי"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="text-right"
                />
                <Input
                  placeholder="טלפון"
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="text-right"
                  dir="ltr"
                />
                <Input
                  placeholder="מייל (לא חובה)"
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="text-right"
                  dir="ltr"
                />
              </div>

              <Button
                className="w-full font-bold text-base rounded-full"
                size="lg"
                onClick={handleRegistration}
                disabled={submitting || !regForm.name.trim() || !regForm.phone.trim()}
              >
                {submitting ? "שולח..." : "קבל ניתוח חינם ←"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                ללא ספאם &nbsp; לא נמכור את הפרטים שלך
              </p>

              <button
                onClick={() => setShowRegModal(false)}
                className="block mx-auto text-xs text-muted-foreground underline hover:text-foreground"
              >
                חזור
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
