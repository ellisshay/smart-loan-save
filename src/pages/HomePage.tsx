import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Check, CheckCircle, X, ChevronLeft,
  Coins, Zap, Building2, ShieldCheck, Landmark,
  FileText, Upload, Handshake, TrendingDown, Home, Calendar, Hourglass,
} from "lucide-react";
import StatsSection from "@/components/home/StatsSection";
import EnhancedTestimonials from "@/components/home/EnhancedTestimonials";
import BankLogosSection from "@/components/home/BankLogosSection";
import SmartAssessment from "@/components/home/SmartAssessment";
import { QuizData } from "@/types/quiz";
import heroHouse from "@/assets/hero-house.jpg";

// ─── Trust strip ───
const trustItems = [
  { icon: Coins, title: "3,450 ₪ מחיר קבוע", desc: "לשירות מקצועי מקצה לקצה" },
  { icon: Zap, title: "עד 72 שעות", desc: "לקבלת הצעות ראשונות" },
  { icon: Building2, title: "מכרז בנקים", desc: "אנחנו משווים בשבילך" },
  { icon: ShieldCheck, title: "ללא פגישות מיותרות", desc: "הכל מתנהל אונליין" },
];

// ─── How it works steps ───
const steps = [
  { icon: FileText, title: "ממלאים פרטים", desc: "שאלון קצר אונליין" },
  { icon: Upload, title: "מעלים מסמכים", desc: "בקלות ובביטחה" },
  { icon: Handshake, title: "אנחנו משווים", desc: "ומנהלים משא ומתן" },
  { icon: Landmark, title: "מקבלים הצעות", desc: "מהבנקים המובילים" },
  { icon: CheckCircle, title: "חותמים ומשכנתא מאושרת", desc: "בלי כל הבלאגן" },
];

// ─── Sample offers preview ───
const sampleOffers = [
  { bank: "בנק א'", rate: "4.62%", monthly: "4,980", best: true },
  { bank: "בנק ב'", rate: "4.85%", monthly: "5,210", best: false },
  { bank: "בנק ג'", rate: "5.11%", monthly: "5,640", best: false },
];

// ─── Pain Cards Data ───
const painCards = [
  { icon: Calendar, title: "5-8 פגישות בבנקים", desc: "כל פגישה שונה, הצעות שלא ניתן להשוות" },
  { icon: FileText, title: "מסמכים שוב ושוב", desc: "כל בנק מבקש מהתחלה" },
  { icon: Coins, title: "₪5,000-8,000 ליועץ", desc: "לפני שיודעים אם ההצעה טובה" },
  { icon: Hourglass, title: "3-6 שבועות המתנה", desc: "בזמן שהעסקה מחכה" },
];

// ─── FAQ Data ───
const faqItems = [
  { q: "האם השירות באמת חינם?", a: "הבדיקה והניתוח הראשוני חינמים לחלוטין. השירות המלא עולה 3,450 ₪ קבועים, בלי הפתעות." },
  { q: "האם המסמכים שלי מאובטחים?", a: "כל המסמכים מוצפנים ומאוחסנים בשרת מאובטח. SSL 256-bit." },
  { q: "כמה זמן לוקח לקבל הצעה?", a: "לאחר השלמת הפרופיל, עד 72 שעות לקבלת הצעות ראשונות." },
  { q: "האם אני מחויב לבחור מהרשימה?", a: "לא. אתה חופשי לבחור כל הצעה או לא לבחור. ללא מחויבות." },
  { q: "מה ההבדל מיועץ משכנתאות רגיל?", a: "EasyMorte מנהלת מכרז בין בנקים ומביאה לך 3 הצעות תחרותיות במקום הצעה אחת." },
];

// ─── Main Component ───
export default function HomePage() {
  const navigate = useNavigate();

  const [urgencyCount] = useState(() => Math.floor(Math.random() * 12) + 8);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [completedData, setCompletedData] = useState<QuizData>({});

  const assessmentRef = useRef<HTMLDivElement>(null);

  const handleCTAClick = () => {
    setShowAssessment(true);
    setTimeout(() => {
      assessmentRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleAssessmentComplete = useCallback((score: number, data: QuizData) => {
    setCompletedScore(score);
    setCompletedData(data);
    setShowRegModal(true);
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
      <Helmet>
        <title>EasyMorte, משכנתא בלי כל הבלאגן | בדיקת תיק תוך 72 שעות</title>
        <meta name="description" content="אנחנו עושים את כל העבודה בשבילך, משווים הצעות מהבנקים, מנהלים משא ומתן וחוסכים לך זמן וכסף. מחיר קבוע 3,450 ₪." />
        <meta property="og:title" content="EasyMorte, משכנתא בלי כל הבלאגן" />
        <meta property="og:description" content="משווים הצעות מהבנקים ומנהלים משא ומתן בשבילך. עד 72 שעות להצעות ראשונות." />
      </Helmet>

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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs tracking-wide font-semibold mb-6 border border-primary/25">
                <Zap size={14} /> מחיר קבוע · בלי פגישות · עד 72 שעות
              </span>
            </motion.div>
            <motion.h1
              className="font-display text-4xl md:text-6xl font-extrabold leading-[1.08] mb-5 text-foreground"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              משכנתא בלי <span className="text-gradient-gold">כל הבלאגן.</span>
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              אנחנו עושים את כל העבודה בשבילך, משווים הצעות מהבנקים, מנהלים משא ומתן וחוסכים לך זמן וכסף.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col items-start gap-3"
            >
              <Button
                variant="hero" size="xl"
                className="shadow-gold text-lg rounded-full px-10"
                onClick={handleCTAClick}
              >
                בדיקת התאמה בחינם
                <ChevronLeft size={20} />
              </Button>
              <p className="text-xs text-muted-foreground">לוקח 2 דקות בלבד, ללא התחייבות</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card text-muted-foreground text-sm border border-border mt-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> היום נרשמו {urgencyCount} אנשים
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
              className="absolute -bottom-5 right-6 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3 flex items-center gap-3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingDown size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">חיסכון ממוצע</p>
                <p className="text-xs text-muted-foreground">₪120,000 לאורך חיי המשכנתא</p>
              </div>
            </motion.div>
          </motion.div>
          {/* Desktop: floating badge over the background house */}
          <motion.div
            className="hidden lg:flex absolute bottom-10 left-16 bg-card rounded-2xl shadow-card-hover border border-border px-5 py-3 items-center gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingDown size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">חיסכון ממוצע</p>
              <p className="text-xs text-muted-foreground">₪120,000 לאורך חיי המשכנתא</p>
            </div>
          </motion.div>
        </div>

        {/* Trust strip */}
        <div className="container relative pb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ How it works ═══════ */}
      <section className="py-14 md:py-20 bg-background">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">איך זה עובד?</h2>
          <p className="text-center text-muted-foreground mb-12">תהליך פשוט, שקוף ומהיר עד לקבלת המשכנתא הטובה ביותר עבורכם</p>

          <div className="relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-7 right-[10%] left-[10%] h-0.5 bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
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

      {/* ═══════ Offers preview ═══════ */}
      <section className="py-14 md:py-20 bg-secondary/50">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3 text-foreground">הצעות מהבנקים</h2>
          <p className="text-center text-muted-foreground mb-10">ככה נראות ההצעות שתקבלו, השוואה אמיתית, שקופה ופשוטה</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {sampleOffers.map((offer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`rounded-2xl shadow-card hover:shadow-card-hover transition-shadow ${offer.best ? "border-2 border-primary relative" : "border border-border"}`}>
                  {offer.best && (
                    <span className="absolute -top-3 right-5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      ההצעה הטובה ביותר
                    </span>
                  )}
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                      <Landmark size={22} className="text-primary" />
                    </div>
                    <p className="font-bold text-foreground">{offer.bank}</p>
                    <p className="text-3xl font-extrabold text-primary">{offer.rate}</p>
                    <p className="text-xs text-muted-foreground">ריבית ממוצעת</p>
                    <div className="border-t border-border pt-3">
                      <p className="text-lg font-bold text-foreground">₪{offer.monthly}</p>
                      <p className="text-xs text-muted-foreground">החזר חודשי משוער</p>
                    </div>
                    <Button
                      variant={offer.best ? "hero" : "outline"}
                      className="w-full rounded-full"
                      onClick={handleCTAClick}
                    >
                      {offer.best ? "בחירת הצעה" : "פרטים נוספים"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">* המספרים להמחשה בלבד. ההצעות שלך יתבססו על הפרופיל האישי שלך.</p>
        </div>
      </section>

      {/* ═══════ Stats Section ═══════ */}
      <StatsSection />

      {/* ═══════ Pain Section ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8 text-foreground">
            ככה נראה התהליך <span className="text-destructive">בלי</span> EasyMorte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {painCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-destructive/5 border-destructive/20 rounded-2xl">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <card.icon size={18} className="text-destructive" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{card.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Smart Assessment ═══════ */}
      <AnimatePresence>
        {showAssessment && (
          <motion.section
            ref={assessmentRef}
            className="py-16 md:py-24 bg-background"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="container max-w-2xl mx-auto">
              <SmartAssessment onComplete={handleAssessmentComplete} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════ Enhanced Testimonials ═══════ */}
      <EnhancedTestimonials />

      {/* ═══════ Bank Logos ═══════ */}
      <BankLogosSection />

      {/* ═══════ Comparison Section ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8 text-foreground">
            EasyMorte מול השיטה הישנה
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-destructive/5 border-destructive/20 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <Badge variant="destructive" className="mb-2">שיטה ישנה</Badge>
                {[
                  "5+ פגישות פיזיות",
                  "ניירת כפולה לכל בנק",
                  "₪5,000-8,000 ליועץ",
                  "3-6 שבועות המתנה",
                  "הצעה אחת בלבד",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X size={16} className="text-destructive shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/30 border-2 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <Badge className="mb-2 bg-primary text-primary-foreground">EasyMorte </Badge>
                {[
                  "פרופיל אחד, הכל דיגיטלי",
                  "מסמכים פעם אחת בלבד",
                  "מחיר קבוע 3,450 ₪",
                  "הצעות תוך 72 שעות",
                  "3 הצעות במקביל",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle size={16} className="text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">מוכנים לבדוק כמה אפשר לחסוך?</h2>
          <Button
            variant="hero" size="xl"
            className="shadow-gold text-lg px-10 rounded-full"
            onClick={handleCTAClick}
          >
            בדיקת התאמה בחינם
            <ArrowLeft size={18} />
          </Button>
          <p className="text-xs text-muted-foreground">לוקח 2 דקות בלבד, ללא התחייבות</p>
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
