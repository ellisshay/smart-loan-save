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
  ArrowLeft, Check, CheckCircle, AlertTriangle,
  Sparkles, X,
  Calendar, FileText, DollarSign, Timer,
} from "lucide-react";
import StatsSection from "@/components/home/StatsSection";
import EnhancedTestimonials from "@/components/home/EnhancedTestimonials";
import BankLogosSection from "@/components/home/BankLogosSection";
import SmartAssessment from "@/components/home/SmartAssessment";
import { QuizData } from "@/types/quiz";

// ─── Mortgage calculation helpers ───
function calcMonthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcMaxLoan(monthlyIncome: number) {
  return Math.round(monthlyIncome * 0.33 * 12 * 25);
}

function calcApprovalChance(propertyPrice: number, income: number, purpose: string) {
  const maxLoan = calcMaxLoan(income);
  const ltv = purpose === "first" ? 0.75 : purpose === "upgrade" ? 0.7 : 0.5;
  const neededLoan = propertyPrice * ltv;
  if (maxLoan >= neededLoan * 1.2) return "high";
  if (maxLoan >= neededLoan * 0.9) return "medium";
  return "low";
}

// ─── Pain Cards Data ───
const painCards = [
  { emoji: "📅", title: "5–8 פגישות בבנקים", desc: "כל פגישה שונה, הצעות שלא ניתן להשוות" },
  { emoji: "📄", title: "מסמכים שוב ושוב", desc: "כל בנק מבקש מהתחלה" },
  { emoji: "💸", title: "₪5,000–8,000 ליועץ", desc: "לפני שיודעים אם ההצעה טובה" },
  { emoji: "⏳", title: "3–6 שבועות המתנה", desc: "בזמן שהעסקה מחכה" },
];

// ─── FAQ Data ───
const faqItems = [
  { q: "האם השירות באמת חינם?", a: "כן, הניתוח AI חינמי לחלוטין. EasyMorte גובה מהיועצים בלבד." },
  { q: "האם המסמכים שלי מאובטחים?", a: "כל המסמכים מוצפנים ומאוחסנים בשרת מאובטח. SSL 256-bit." },
  { q: "כמה זמן לוקח לקבל הצעה?", a: "לאחר השלמת הפרופיל – בדרך כלל 48 שעות. בשיא עד 72 שעות." },
  { q: "האם אני מחויב לבחור מהרשימה?", a: "לא. אתה חופשי לבחור כל יועץ או לא לבחור. ללא מחויבות." },
  { q: "מה ההבדל מיועץ משכנתאות רגיל?", a: "EasyMorte היא פלטפורמת חיבור. אנחנו מביאים לך 3 הצעות תחרותיות במקום הצעה אחת." },
];

// ─── Main Component ───
export default function HomePage() {
  const navigate = useNavigate();

  // Urgency counter (random 8-19 on mount)
  const [urgencyCount] = useState(() => Math.floor(Math.random() * 12) + 8);

  // Hero calculator state
  const [propertyPrice, setPropertyPrice] = useState(1500000);
  const [monthlyIncome, setMonthlyIncome] = useState(18000);
  const [purpose, setPurpose] = useState<"first" | "upgrade" | "refi">("first");

  // Assessment visibility
  const [showAssessment, setShowAssessment] = useState(false);

  // Registration modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [completedData, setCompletedData] = useState<QuizData>({});

  const assessmentRef = useRef<HTMLDivElement>(null);

  // Derived calculations
  const ltvPct = purpose === "first" ? 75 : purpose === "upgrade" ? 70 : 50;
  const loanAmount = Math.round(propertyPrice * ltvPct / 100);
  const maxLoan = calcMaxLoan(monthlyIncome);
  const monthlyPayment = Math.round(calcMonthlyPayment(loanAmount, 4.8, 25));
  const approvalChance = calcApprovalChance(propertyPrice, monthlyIncome, purpose);

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
          property_price: completedData.property_price || propertyPrice,
          monthly_income: completedData.salary_net || monthlyIncome,
          purpose: completedData.purpose || purpose,
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
        <title>EasyMorte – ניתוח משכנתא AI חינמי | 3 הצעות תוך 48 שעות</title>
        <meta name="description" content="פלטפורמת AI לניתוח משכנתאות. מקבלים ציון זכאות, מסלולים מותאמים ו-3 הצעות אמיתיות מבנקים תוך 48 שעות. חינם לחלוטין." />
        <meta property="og:title" content="EasyMorte – 3 הצעות משכנתא תוך 48 שעות" />
        <meta property="og:description" content="AI מנתח את הפרופיל שלך ומביא הצעות תחרותיות מ-3 בנקים. חינם." />
      </Helmet>

      {/* ═══════ STAGE 0 – Hero Calculator ═══════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] animate-pulse" />

        <div className="container relative py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto mb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 text-gold text-sm font-semibold mb-6 border border-gold/20">
                <Sparkles size={14} /> בדוק את הסיכוי שלך תוך 30 שניות
              </span>
            </motion.div>
            <motion.h1
              className="font-display text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 text-white"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              קבל 3 הצעות משכנתא אמיתיות תוך 48 שעות
            </motion.h1>
            <motion.p
              className="text-lg text-white/60 mb-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              AI מנתח את הפרופיל שלך, יועצים מתחרים על הלקוח שלך — אתה בוחר וחוסך.
            </motion.p>

            {/* Urgency counter pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm border border-white/10"
            >
              🔴 היום נרשמו {urgencyCount} אנשים
            </motion.div>
          </div>

          {/* Calculator Card */}
          <motion.div
            className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 space-y-6"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            {/* Property Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>מחיר הנכס</span>
                <span className="font-bold text-white">₪{propertyPrice.toLocaleString()}</span>
              </div>
              <input
                type="range" min={500000} max={5000000} step={50000}
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/20 accent-[hsl(var(--gold))]"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>₪500K</span><span>₪5M</span>
              </div>
            </div>

            {/* Income Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>הכנסה חודשית נטו</span>
                <span className="font-bold text-white">₪{monthlyIncome.toLocaleString()}</span>
              </div>
              <input
                type="range" min={5000} max={50000} step={1000}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/20 accent-[hsl(var(--gold))]"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>₪5K</span><span>₪50K</span>
              </div>
            </div>

            {/* Purpose Pills */}
            <div className="space-y-2">
              <span className="text-sm text-white/70">מטרה</span>
              <div className="flex gap-2">
                {([
                  { label: "דירה ראשונה", value: "first" as const },
                  { label: "שדרוג", value: "upgrade" as const },
                  { label: "מיחזור", value: "refi" as const },
                ]).map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPurpose(p.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      purpose === p.value
                        ? "bg-gold text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/15"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Results */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-white/50 mb-1">סיכוי ראשוני</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  approvalChance === "high" ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]" :
                  approvalChance === "medium" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]" :
                  "bg-destructive/20 text-destructive"
                }`}>
                  {approvalChance === "high" ? "גבוה ✓" : approvalChance === "medium" ? "בינוני" : "נמוך"}
                </span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-white/50 mb-1">החזר חודשי משוער</p>
                <p className="text-lg font-bold text-white">₪{monthlyPayment.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-white/50 mb-1">מקסימום הלוואה</p>
                <p className="text-lg font-bold text-white">₪{maxLoan.toLocaleString()}</p>
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="hero" size="xl"
              className="w-full shadow-gold text-lg"
              onClick={handleCTAClick}
            >
              קבל ניתוח מלא חינם ←
              <ArrowLeft size={18} />
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1"><Check size={12} className="text-gold" /> ללא הרשמה</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-gold" /> 30 שניות</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-gold" /> חינם לגמרי</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,30 L1440,60 L0,60 Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ═══════ Stats Section ═══════ */}
      <StatsSection />

      {/* ═══════ Pain Section ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
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
                <Card className="bg-red-950/30 border-red-800/30">
                  <CardContent className="p-5 flex items-start gap-4">
                    <span className="text-2xl">{card.emoji}</span>
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

      {/* ═══════ Smart Assessment (replaces old quiz + score) ═══════ */}
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
            EasyMorte מול השיטה הישנה
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old way */}
            <Card className="bg-red-950/20 border-red-800/30">
              <CardContent className="p-6 space-y-4">
                <Badge variant="destructive" className="mb-2">שיטה ישנה</Badge>
                {[
                  "5+ פגישות פיזיות",
                  "ניירת כפולה לכל בנק",
                  "₪5,000–8,000 ליועץ",
                  "3–6 שבועות המתנה",
                  "הצעה אחת בלבד",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X size={16} className="text-destructive shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* EasyMorte way */}
            <Card className="bg-green-950/20 border-green-700/30 border-2">
              <CardContent className="p-6 space-y-4">
                <Badge className="mb-2 bg-[hsl(var(--success))] text-white">EasyMorte ✦</Badge>
                {[
                  "פרופיל אחד, הכל דיגיטלי",
                  "מסמכים פעם אחת בלבד",
                  "חינם לחלוטין ללקוח",
                  "הצעות תוך 48 שעות",
                  "3 הצעות במקביל",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle size={16} className="text-[hsl(var(--success))] shrink-0" />
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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">שאלות נפוצות</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-semibold text-right">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════ Final CTA ═══════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container text-center">
          <Button
            variant="hero" size="xl"
            className="shadow-gold text-lg px-10"
            onClick={handleCTAClick}
          >
            בדוק את הסיכוי שלך עכשיו ←
            <ArrowLeft size={18} />
          </Button>
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
                <h2 className="text-xl font-bold text-foreground">הציון שלך: {completedScore} – הניתוח מוכן!</h2>
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
                className="w-full font-bold text-base"
                size="lg"
                onClick={handleRegistration}
                disabled={submitting || !regForm.name.trim() || !regForm.phone.trim()}
              >
                {submitting ? "שולח..." : "קבל ניתוח חינם ←"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                ✓ ללא ספאם &nbsp; ✓ לא נמכור את הפרטים שלך
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
