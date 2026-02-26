import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  TrendingDown,
  Shield,
  Clock,
  Users,
  Star,
  Target,
  Check,
  X,
  Timer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

// Animated counter hook
function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (!start || target === 0) { setValue(0); return; }
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target, start, duration]);

  return value;
}

// Session-persistent timer hook (15 min)
function useSessionTimer(start: boolean) {
  const TIMER_KEY = "easymorte_timer_end";
  const TIMER_DURATION = 15 * 60; // 15 minutes in seconds

  const getRemaining = useCallback(() => {
    const stored = sessionStorage.getItem(TIMER_KEY);
    if (stored) {
      const remaining = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
      return remaining;
    }
    return TIMER_DURATION;
  }, []);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!start) return;
    if (!sessionStorage.getItem(TIMER_KEY)) {
      sessionStorage.setItem(TIMER_KEY, String(Date.now() + TIMER_DURATION * 1000));
    }
    const interval = setInterval(() => {
      setRemaining(getRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [start, getRemaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { minutes, seconds, expired: remaining <= 0 };
}

const DEFAULT_RATE = 4.8;

export default function SavingsCalculator() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [yearsLeft, setYearsLeft] = useState("");
  const [rate, setRate] = useState("");
  const [goal, setGoal] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{
    currentMonthly: number;
    improvedMonthly: number;
    stressMonthly: number;
    displaySavingsMain: number;
    displaySavingsLow: number;
    displaySavingsHigh: number;
    wasteScore: number;
    usedRate: number;
    improvedRate: number;
    stressRate: number;
    urgencyRateSensitive: boolean;
    stressDelta: number;
    monthlyLoss: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  const animatedSavings = useCountUp(result?.displaySavingsMain || 0, 2000, showResult);
  const animatedScore = useCountUp(result?.wasteScore || 0, 1500, showResult);
  const timer = useSessionTimer(showResult);

  // Webhook: result_viewed
  useEffect(() => {
    if (showResult && result && !webhookSent) {
      setWebhookSent(true);
      supabase.functions.invoke("webhook-handler", {
        body: {
          event_name: "result_viewed",
          case_id: "calculator-session",
          payload: {
            risk_score: result.wasteScore,
            display_savings_main: result.displaySavingsMain,
            monthly_loss: result.monthlyLoss,
            source: "savings_calculator",
          },
        },
      }).catch(console.error);
    }
  }, [showResult, result, webhookSent]);

  const handleCheckoutClick = () => {
    // Webhook: checkout_started
    supabase.functions.invoke("webhook-handler", {
      body: {
        event_name: "checkout_started",
        case_id: "calculator-session",
        payload: {
          risk_score: result?.wasteScore,
          display_savings_main: result?.displaySavingsMain,
          source: "savings_calculator",
        },
      },
    }).catch(console.error);
    setShowModal(true);
  };

  const handleConfirmCheckout = () => {
    setShowModal(false);
    navigate("/intake");
  };

  const calculate = () => {
    const bal = parseFloat(balance);
    const mp = parseFloat(monthlyPayment);
    const yl = parseFloat(yearsLeft);
    const r = parseFloat(rate) || DEFAULT_RATE;

    if (!bal || !mp || !yl) return;

    const monthsLeft = yl * 12;
    const currentMonthly = mp;

    const rateReduction = r < 4 ? 0.7 : 1.1;
    const improvedRate = Math.max(r - rateReduction, 0.5);
    const improvedMonthlyRate = improvedRate / 100 / 12;
    const improvedMonthly = bal * (improvedMonthlyRate * Math.pow(1 + improvedMonthlyRate, monthsLeft)) / (Math.pow(1 + improvedMonthlyRate, monthsLeft) - 1);

    const stressRate = r + 1;
    const stressMonthlyRate = stressRate / 100 / 12;
    const stressMonthly = bal * (stressMonthlyRate * Math.pow(1 + stressMonthlyRate, monthsLeft)) / (Math.pow(1 + stressMonthlyRate, monthsLeft) - 1);

    const yearsProjection = Math.min(10, yl);
    const monthsProjection = yearsProjection * 12;
    const potentialSavings10 = (currentMonthly - improvedMonthly) * monthsProjection;

    const displaySavingsLow = Math.round(potentialSavings10 * 0.9);
    const displaySavingsHigh = Math.round(potentialSavings10 * 1.25);
    const displaySavingsMain = Math.round(potentialSavings10 * 1.15);

    const wasteRatio = potentialSavings10 / bal;
    let riskScore = Math.round(wasteRatio * 140);
    if (riskScore > 100) riskScore = 100;
    if (riskScore < 20) riskScore = 22;

    const stressDelta = Math.round(stressMonthly - currentMonthly);
    const urgencyRateSensitive = riskScore > 70;
    const monthlyLoss = Math.round(displaySavingsMain / 120);

    const resultData = {
      currentMonthly, improvedMonthly: Math.round(improvedMonthly), stressMonthly: Math.round(stressMonthly),
      displaySavingsMain, displaySavingsLow, displaySavingsHigh,
      wasteScore: riskScore, usedRate: r, improvedRate, stressRate,
      urgencyRateSensitive, stressDelta, monthlyLoss,
    };
    setResult(resultData);
    setShowResult(true);
    setWebhookSent(false);
    // Persist for pricing page dynamic ROI
    sessionStorage.setItem("calc_savings", JSON.stringify(resultData));
  };

  const getScoreColor = (score: number) => {
    if (score >= 65) return "text-gold";
    if (score >= 40) return "text-warning";
    return "text-success";
  };
  const getScoreBg = (score: number) => {
    if (score >= 65) return "from-gold/20 to-gold-dark/20 border-gold/30";
    if (score >= 40) return "from-amber-500/20 to-orange-500/20 border-amber-500/30";
    return "from-emerald-500/20 to-teal-500/20 border-emerald-500/30";
  };
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "בזבוז קריטי";
    if (score >= 65) return "בזבוז משמעותי";
    if (score >= 40) return "יש פוטנציאל לשיפור";
    return "המשכנתא שלך סבירה";
  };

  const chartData = result ? [
    { name: "המצב שלך", value: Math.round(result.currentMonthly), fill: "hsl(0, 72%, 55%)" },
    { name: "תמהיל משופר", value: result.improvedMonthly, fill: "hsl(185, 70%, 50%)" },
    { name: "ריבית עולה", value: result.stressMonthly, fill: "hsl(38, 92%, 50%)" },
  ] : [];

  const goals = [
    { value: "savings", label: "חיסכון כולל", icon: TrendingDown },
    { value: "lower_payment", label: "הורדת החזר", icon: Target },
    { value: "stability", label: "יציבות", icon: Shield },
  ];

  return (
    <section className="py-12 md:py-20 bg-background" id="savings-calculator">
      <div className="container max-w-3xl">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-warning/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-destructive" size={28} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-3">
            כמה כסף אתה עלול לשלם יותר
            <br />
            <span className="text-gradient-gold">בעשור הקרוב?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            הזן את פרטי המשכנתא שלך וגלה מיד
          </p>
        </motion.div>

        <motion.div
          className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <Label className="mb-2 block">יתרת משכנתא נוכחית (₪)</Label>
              <Input type="number" placeholder="800,000" value={balance} onChange={(e) => setBalance(e.target.value)} className="text-lg h-12" />
            </div>
            <div>
              <Label className="mb-2 block">החזר חודשי נוכחי (₪)</Label>
              <Input type="number" placeholder="4,500" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="text-lg h-12" />
            </div>
            <div>
              <Label className="mb-2 block">שנים שנותרו</Label>
              <Input type="number" placeholder="20" value={yearsLeft} onChange={(e) => setYearsLeft(e.target.value)} className="text-lg h-12" />
            </div>
            <div>
              <Label className="mb-2 block">ריבית ממוצעת משוערת (%)</Label>
              <Input type="number" step="0.1" placeholder={`${DEFAULT_RATE}`} value={rate} onChange={(e) => setRate(e.target.value)} className="text-lg h-12" />
              <p className="text-xs text-muted-foreground mt-1">השאר ריק — נחשב לפי ממוצע שוק {DEFAULT_RATE}%</p>
            </div>
          </div>

          <div className="mb-6">
            <Label className="mb-3 block">מה היעד שלך?</Label>
            <div className="grid grid-cols-3 gap-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                    goal === g.value ? "border-gold bg-gold/10 text-gold" : "border-border bg-muted/30 text-muted-foreground hover:border-gold/30"
                  }`}
                >
                  <g.icon size={20} />
                  <span className="text-sm font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button variant="cta" className="w-full" size="lg" onClick={calculate}>
            <Calculator size={18} />
            חשב עכשיו
          </Button>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && showResult && (
            <motion.div
              className="mt-8 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Main alert box */}
              <div className="bg-gradient-to-br from-destructive/10 to-warning/10 rounded-2xl p-6 md:p-8 border border-destructive/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <AlertTriangle className="text-destructive" size={24} />
                  <span className="text-sm font-semibold text-destructive">⚠️ תוצאת הסימולציה</span>
                </div>
                <p className="text-lg md:text-xl text-foreground mb-2">
                  לפי הנתונים שלך, אתה עלול לשלם כ-
                </p>
                <div className="font-display text-4xl md:text-6xl font-black text-destructive mb-2">
                  ₪{animatedSavings.toLocaleString()}
                </div>
                <p className="text-lg text-foreground mb-3">יותר בעשור הקרוב</p>
                <p className="text-sm text-muted-foreground">
                  טווח: בין{" "}
                  <span className="font-bold text-foreground">₪{result.displaySavingsLow.toLocaleString()}</span>
                  {" "}ל-
                  <span className="font-bold text-foreground">₪{result.displaySavingsHigh.toLocaleString()}</span>
                </p>
              </div>

              {/* 1️⃣ Monthly loss - real-time psychological pain */}
              <motion.div
                className="bg-card rounded-xl p-4 border border-border text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-foreground">
                  💸 כל חודש שאתה מחכה אתה עלול לשלם כ-
                  <span className="font-display font-black text-xl text-destructive mx-1">
                    ₪{result.monthlyLoss.toLocaleString()}
                  </span>
                  מיותרים
                </p>
              </motion.div>

              {/* 8️⃣ Risk banner */}
              {result.wasteScore > 75 && (
                <motion.div
                  className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl p-4 border border-destructive/20 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm font-semibold text-destructive">
                    🔴 זוהתה רמת חשיפה גבוהה מהממוצע בשוק
                  </p>
                </motion.div>
              )}
              {result.wasteScore >= 55 && result.wasteScore <= 75 && (
                <motion.div
                  className="bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-xl p-4 border border-gold/20 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm font-semibold text-gold">
                    💡 זוהתה הזדמנות חיסכון משמעותית
                  </p>
                </motion.div>
              )}

              {/* Urgency bonuses */}
              {result.urgencyRateSensitive && (
                <motion.div className="bg-gradient-to-br from-destructive/10 to-warning/10 rounded-xl p-4 border border-destructive/20 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <p className="text-sm font-semibold text-destructive">🔴 זוהתה רגישות גבוהה לשינויי ריבית</p>
                </motion.div>
              )}
              {result.stressDelta > 800 && (
                <motion.div className="bg-gradient-to-br from-warning/10 to-destructive/10 rounded-xl p-4 border border-warning/20 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <p className="text-sm font-semibold text-warning">⚠️ עלייה של 1% בריבית עלולה להעלות לך את ההחזר ביותר מ-₪{result.stressDelta.toLocaleString()} לחודש</p>
                </motion.div>
              )}

              {/* 3-column details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ החזר בתמהיל משופר</div>
                  <div className="font-display font-black text-2xl text-gold">₪{result.improvedMonthly.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {result.improvedRate.toFixed(1)}%</div>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ ההחזר הנוכחי שלך</div>
                  <div className="font-display font-black text-2xl text-foreground">₪{result.currentMonthly.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {result.usedRate}%</div>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ אם הריבית תעלה ב-1%</div>
                  <div className="font-display font-black text-2xl text-warning">₪{result.stressMonthly.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {result.stressRate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Waste score */}
              <div className={`bg-gradient-to-br ${getScoreBg(result.wasteScore)} rounded-2xl p-6 border text-center`}>
                <div className="text-sm text-muted-foreground mb-2">מדד בזבוז</div>
                <div className={`font-display text-5xl md:text-6xl font-black ${getScoreColor(result.wasteScore)}`}>
                  {animatedScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <div className={`text-sm font-semibold mt-2 ${getScoreColor(result.wasteScore)}`}>
                  {getScoreLabel(result.wasteScore)}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-display font-bold text-lg text-foreground mb-4 text-center">
                  השוואת החזר חודשי — 3 תרחישים
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={60}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 25%, 22%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(200, 10%, 55%)", fontSize: 13 }} />
                      <YAxis tick={{ fill: "hsl(200, 10%, 55%)", fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [`₪${value.toLocaleString()}`, "החזר חודשי"]}
                        contentStyle={{ background: "hsl(210, 35%, 15%)", border: "1px solid hsl(210, 25%, 22%)", borderRadius: "12px", color: "hsl(200, 15%, 92%)" }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4️⃣ Comparison table */}
              <div className="bg-card rounded-2xl p-6 border border-border overflow-x-auto">
                <h3 className="font-display font-bold text-lg text-foreground mb-4 text-center">
                  מה ההבדל?
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right p-3 text-muted-foreground font-medium"></th>
                      <th className="p-3 text-muted-foreground font-medium text-center">בדיקה חינמית</th>
                      <th className="p-3 text-gold font-bold text-center bg-gold/5 rounded-t-lg">בדיקה מלאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["ניתוח", "הערכה כללית", "סימולציה ל-10 שנים"],
                      ["גרפים", "ללא", "גרפים ורגישות ריבית"],
                      ["תמהילים", "ללא", "3 כיוונים אסטרטגיים"],
                      ["ליווי", "ללא", "שליחה לבנקים + ליווי"],
                    ].map(([label, free, full], i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3 text-foreground font-medium">{label}</td>
                        <td className="p-3 text-center text-muted-foreground">{free}</td>
                        <td className="p-3 text-center text-gold font-semibold bg-gold/5">{full}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2️⃣ Dynamic timer */}
              {!timer.expired && (
                <motion.div
                  className="bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-xl p-5 border border-gold/20 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Timer className="text-gold" size={18} />
                    <span className="text-sm font-semibold text-gold">חלון עדיפות לניתוח מהיר</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">בדיקה מלאה ב-48 שעות — המחיר המוזל נשמר עבורך ל-</p>
                  <div className="font-display text-3xl font-black text-gold">
                    {String(timer.minutes).padStart(2, "0")}:{String(timer.seconds).padStart(2, "0")}
                  </div>
                </motion.div>
              )}

              {/* 3️⃣ Price anchoring + CTA */}
              <div className="bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-2xl p-8 border border-gold/20 text-center">
                <h3 className="font-display text-2xl md:text-3xl font-black text-foreground mb-3">
                  רוצה בדיקה מלאה ומדויקת תוך 48 שעות?
                </h3>
                <p className="text-muted-foreground mb-4">
                  דוח מקצועי עם 3 תמהילים מותאמים אישית — שמרני, מאוזן ואגרסיבי
                </p>

                {/* Price anchoring */}
                <div className="mb-6 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    שווי ניתוח מלא אצל יועץ פרטי:{" "}
                    <span className="line-through text-muted-foreground/60">2,500–4,000 ₪</span>
                  </p>
                  <p className="text-2xl font-display font-black text-gold">
                    היום: 590 ₪ בלבד
                  </p>
                  <p className="text-xs text-muted-foreground">מתקזז בשירות המלא</p>
                </div>

                <Button variant="cta" size="lg" className="text-lg px-8" onClick={handleCheckoutClick}>
                  פתח בדיקה מלאה — 590 ₪
                  <ArrowLeft size={18} />
                </Button>
              </div>

              {/* 5️⃣ Trust badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Users, value: "4,200+", label: "לקוחות" },
                  { icon: TrendingDown, value: "₪84,000", label: "חיסכון ממוצע" },
                  { icon: Clock, value: "48 שעות", label: "זמן טיפול" },
                  { icon: Star, value: "98%", label: "שביעות רצון" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-xl p-4 border border-border text-center">
                    <stat.icon className="mx-auto mb-2 text-gold" size={20} />
                    <div className="font-display font-black text-lg text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Legal disclaimer */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed px-4">
                * החישוב מבוסס סימולציה והערכות שוק, אינו מהווה התחייבות להצעה בנקאית.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6️⃣ Micro-commitment modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative bg-card rounded-2xl p-8 max-w-md w-full shadow-card border border-border text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
              <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
                <Check className="text-gold" size={28} />
              </div>
              <h3 className="font-display text-xl font-black text-foreground mb-3">
                האם תרצה שנבדוק לעומק את הנתונים שלך ונזהה חיסכון פוטנציאלי אמיתי?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                הצוות שלנו ינתח את המשכנתא שלך ויציע 3 תמהילים מותאמים אישית
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="cta" size="lg" onClick={handleConfirmCheckout} className="w-full">
                  <Check size={18} />
                  כן, המשך לבדיקה מלאה
                </Button>
                <Button variant="outline" size="lg" onClick={() => setShowModal(false)} className="w-full">
                  חזור לתוצאה
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
