import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Check, CheckCircle, AlertTriangle,
  Upload, Sparkles, MessageCircle, Clock,
} from "lucide-react";

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

const WHATSAPP_NUMBER = "972501234567";

// ─── Score Circle Component ───
function AnimatedScoreCircle({ score, size = 180 }: { score: number; size?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayed(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = score >= 70 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const r = size / 2 - 12;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (displayed / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="10"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black" style={{ color }}>{displayed}</span>
        <span className="text-xs text-muted-foreground">מתוך 100</span>
      </div>
    </div>
  );
}

// ─── Quiz question type ───
interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "age", question: "מה הגיל שלך?",
    options: [
      { label: "18–25", value: "18-25" },
      { label: "26–35", value: "26-35" },
      { label: "36–50", value: "36-50" },
      { label: "50+", value: "50+" },
    ],
  },
  {
    id: "marital", question: "מצב משפחתי?",
    options: [
      { label: "רווק/ה", value: "single" },
      { label: "נשוי/אה", value: "married" },
      { label: "גרוש/ה", value: "divorced" },
    ],
  },
  {
    id: "employment", question: "סוג תעסוקה?",
    options: [
      { label: "שכיר/ה", value: "employee" },
      { label: "עצמאי/ת", value: "self_employed" },
      { label: "שניהם", value: "both" },
    ],
  },
  {
    id: "equity", question: "הון עצמי זמין?",
    options: [
      { label: "עד ₪100,000", value: "0-100k" },
      { label: "₪100K–₪300K", value: "100k-300k" },
      { label: "₪300K–₪700K", value: "300k-700k" },
      { label: "₪700K+", value: "700k+" },
    ],
  },
  {
    id: "existing_offer", question: "האם כבר יש לך הצעה מבנק?",
    options: [
      { label: "כן", value: "yes" },
      { label: "לא", value: "no" },
    ],
  },
];

// ─── Main Component ───
export default function HomePage() {
  const navigate = useNavigate();

  // Stage 0 state
  const [propertyPrice, setPropertyPrice] = useState(1500000);
  const [monthlyIncome, setMonthlyIncome] = useState(18000);
  const [purpose, setPurpose] = useState<"first" | "upgrade" | "refi">("first");

  // Stage 1 state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [uploadedOffer, setUploadedOffer] = useState<File | null>(null);

  // Stage 2 state
  const [showScore, setShowScore] = useState(false);

  // Stage 3 state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const quizRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  // Derived calculations
  const ltvPct = purpose === "first" ? 75 : purpose === "upgrade" ? 70 : 50;
  const loanAmount = Math.round(propertyPrice * ltvPct / 100);
  const maxLoan = calcMaxLoan(monthlyIncome);
  const monthlyPayment = Math.round(calcMonthlyPayment(loanAmount, 4.8, 25));
  const approvalChance = calcApprovalChance(propertyPrice, monthlyIncome, purpose);

  // Fake score based on inputs
  const computedScore = useCallback(() => {
    let s = 55;
    if (approvalChance === "high") s += 20;
    else if (approvalChance === "medium") s += 10;
    if (quizAnswers.employment === "employee") s += 5;
    if (quizAnswers.equity === "300k-700k") s += 5;
    if (quizAnswers.equity === "700k+") s += 8;
    if (quizAnswers.age === "26-35" || quizAnswers.age === "36-50") s += 3;
    if (quizAnswers.marital === "married") s += 2;
    return Math.min(s, 95);
  }, [approvalChance, quizAnswers]);

  const score = computedScore();

  // Mortgage track suggestions
  const tracks = [
    { name: "פריים", rate: 4.6, pct: 33 },
    { name: "קבועה לא צמודה", rate: 5.1, pct: 34 },
    { name: "משתנה כל 5", rate: 4.8, pct: 33 },
  ];

  const handleCTAClick = () => {
    setShowQuiz(true);
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleQuizAnswer = (value: string) => {
    const currentQ = quizQuestions[quizStep];
    const updated = { ...quizAnswers, [currentQ.id]: value };
    setQuizAnswers(updated);
    localStorage.setItem("easymort_quiz", JSON.stringify(updated));

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Quiz complete → show score
      setShowScore(true);
      setTimeout(() => {
        scoreRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleRegistration = async () => {
    if (!regForm.name.trim() || !regForm.phone.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-lead", {
        body: {
          name: regForm.name.trim(),
          phone: regForm.phone.trim(),
          email: regForm.email.trim() || null,
          quiz_answers: quizAnswers,
          property_price: propertyPrice,
          monthly_income: monthlyIncome,
          purpose,
          score,
        },
      });
      if (error) throw error;
      // Store lead_id for dashboard
      if (data?.lead_id) localStorage.setItem("easymort_lead_id", data.lead_id);
      localStorage.setItem("easymort_score", String(score));
      localStorage.setItem("easymort_reg_time", new Date().toISOString());
      navigate("/results");
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // BOI rate decision date (14 days from now)
  const boiDate = new Date();
  boiDate.setDate(boiDate.getDate() + 14);
  const boiDateStr = boiDate.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const rateImpact = Math.round(loanAmount * 0.0025 / 12);

  return (
    <div dir="rtl">
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
              בדוק אם תקבל משכנתא — עכשיו
            </motion.h1>
            <motion.p
              className="text-lg text-white/60 mb-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              הזז את הסליידרים ותראה תוצאות מיידיות
            </motion.p>
          </div>

          {/* Calculator Card */}
          <motion.div
            className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 space-y-6"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
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

      {/* ═══════ STAGE 1 – Quick Quiz ═══════ */}
      <AnimatePresence>
        {showQuiz && !showScore && (
          <motion.section
            ref={quizRef}
            className="py-16 md:py-24 bg-background"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="container max-w-xl mx-auto space-y-8">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>שאלה {quizStep + 1} מתוך {quizQuestions.length}</span>
                  <span>{Math.round(((quizStep + 1) / quizQuestions.length) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Current Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={quizStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold text-foreground text-center">
                    {quizQuestions[quizStep].question}
                  </h2>
                  <div className="grid gap-3">
                    {quizQuestions[quizStep].options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleQuizAnswer(opt.value)}
                        className="w-full p-4 rounded-xl border-2 border-border bg-card text-foreground font-medium text-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Q5 upload option */}
                  {quizQuestions[quizStep].id === "existing_offer" && quizAnswers.existing_offer === "yes" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex flex-col items-center gap-3 pt-4"
                    >
                      <label className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                        <Upload size={18} />
                        צלם את ההצעה ←
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setUploadedOffer(e.target.files[0]);
                              handleQuizAnswer("yes");
                            }
                          }}
                        />
                      </label>
                      {uploadedOffer && (
                        <span className="text-sm text-muted-foreground">✓ {uploadedOffer.name}</span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════ STAGE 2 – Score Reveal ═══════ */}
      <AnimatePresence>
        {showScore && !showRegModal && (
          <motion.section
            ref={scoreRef}
            className="py-16 md:py-24 bg-background"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="container max-w-2xl mx-auto space-y-8">
              {/* Score */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">הסיכוי שלך לקבלת משכנתא</h2>
                <AnimatedScoreCircle score={score} />
                <p className="text-lg font-semibold" style={{
                  color: score >= 70 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))"
                }}>
                  {score >= 70 ? "גבוה" : score >= 50 ? "בינוני" : "נמוך"}
                </p>
              </div>

              {/* 3 Mortgage Tracks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tracks.map((track, i) => {
                  const trackPayment = Math.round(calcMonthlyPayment(loanAmount * track.pct / 100, track.rate, 25));
                  const isRecommended = i === 1;
                  return (
                    <Card key={track.name} className={`relative ${isRecommended ? "ring-2 ring-primary border-primary" : ""}`}>
                      {isRecommended && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full font-bold">
                          המומלץ עבורך
                        </span>
                      )}
                      <CardContent className="pt-5 pb-4 px-4 text-center space-y-1">
                        <p className="font-bold text-sm">{track.name}</p>
                        <p className="text-xs text-muted-foreground">{track.rate}%</p>
                        <p className="text-lg font-black text-primary">₪{trackPayment.toLocaleString()}/חודש</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Urgency Block */}
              <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">⚠️ ריבית בנק ישראל – החלטה ב-{boiDateStr}</p>
                      <p className="text-sm text-muted-foreground">
                        שינוי ריבית עלול להשפיע על ההחזר החודשי שלך ב-₪{rateImpact.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded offer comparison */}
              {uploadedOffer && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="py-4 px-5">
                    <p className="font-bold text-sm text-destructive mb-2">השוואת ההצעה שלך לשוק</p>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">ההצעה שלך</p>
                        <p className="font-bold text-destructive">5.4%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">ממוצע שוק</p>
                        <p className="font-bold text-[hsl(var(--success))]">4.8%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">הפרש</p>
                        <p className="font-bold text-destructive">₪347/חודש</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <div className="text-center">
                <Button
                  variant="hero" size="xl"
                  className="shadow-gold text-lg px-10"
                  onClick={() => setShowRegModal(true)}
                >
                  קבל את הניתוח המלא שלך חינם ←
                  <ArrowLeft size={18} />
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════ STAGE 3 – Registration Modal ═══════ */}
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
                <h2 className="text-xl font-bold text-foreground">הניתוח המלא שלך מוכן!</h2>
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
