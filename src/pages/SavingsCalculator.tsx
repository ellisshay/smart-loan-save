import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
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

const DEFAULT_RATE = 4.8;

export default function SavingsCalculator() {
  const [balance, setBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [yearsLeft, setYearsLeft] = useState("");
  const [rate, setRate] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<{
    currentTotalCost: number;
    optimisticTotalCost: number;
    pessimisticTotalCost: number;
    savings10y: number;
    savingsLow: number;
    savingsHigh: number;
    currentMonthly: number;
    optimisticMonthly: number;
    pessimisticMonthly: number;
    wasteScore: number;
    usedRate: number;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const animatedSavings = useCountUp(result?.savings10y || 0, 2000, showResult);
  const animatedScore = useCountUp(result?.wasteScore || 0, 1500, showResult);

  const calculate = () => {
    const bal = parseFloat(balance);
    const mp = parseFloat(monthlyPayment);
    const yl = parseFloat(yearsLeft);
    const r = parseFloat(rate) || DEFAULT_RATE;

    if (!bal || !mp || !yl) return;

    const months = yl * 12;
    const months10y = Math.min(months, 120);

    // Current scenario
    const currentTotalCost = mp * months;

    // Optimistic: rate - 0.9%
    const optRate = Math.max(r - 0.9, 0.5);
    const optMonthlyRate = optRate / 100 / 12;
    const optMonthly = bal * (optMonthlyRate * Math.pow(1 + optMonthlyRate, months)) / (Math.pow(1 + optMonthlyRate, months) - 1);
    const optimisticTotalCost = optMonthly * months;

    // Pessimistic: rate + 1%
    const pessRate = r + 1;
    const pessMonthlyRate = pessRate / 100 / 12;
    const pessMonthly = bal * (pessMonthlyRate * Math.pow(1 + pessMonthlyRate, months)) / (Math.pow(1 + pessMonthlyRate, months) - 1);
    const pessimisticTotalCost = pessMonthly * months;

    // 10-year gap between current and optimistic
    const gap10y = (mp - optMonthly) * months10y;
    const gapLow = gap10y * 0.7;
    const gapHigh = gap10y * 1.2;

    // Waste score: min(100, (gap / balance) * 120)
    const wasteScore = Math.min(100, Math.round((gap10y / bal) * 120));

    setResult({
      currentTotalCost,
      optimisticTotalCost,
      pessimisticTotalCost,
      savings10y: Math.round(gap10y),
      savingsLow: Math.round(gapLow),
      savingsHigh: Math.round(gapHigh),
      currentMonthly: mp,
      optimisticMonthly: Math.round(optMonthly),
      pessimisticMonthly: Math.round(pessMonthly),
      wasteScore: Math.max(0, wasteScore),
      usedRate: r,
    });
    setShowResult(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-warning";
    return "text-success";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "from-red-500/20 to-red-600/20 border-red-500/30";
    if (score >= 40) return "from-amber-500/20 to-orange-500/20 border-amber-500/30";
    return "from-emerald-500/20 to-teal-500/20 border-emerald-500/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "בזבוז קריטי";
    if (score >= 60) return "בזבוז משמעותי";
    if (score >= 40) return "יש פוטנציאל לשיפור";
    return "המשכנתא שלך סבירה";
  };

  const chartData = result ? [
    { name: "המצב שלך", value: Math.round(result.currentMonthly), fill: "hsl(0, 72%, 55%)" },
    { name: "תמהיל משופר", value: result.optimisticMonthly, fill: "hsl(185, 70%, 50%)" },
    { name: "ריבית עולה", value: result.pessimisticMonthly, fill: "hsl(38, 92%, 50%)" },
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-400" size={28} />
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
              <Input
                type="number"
                placeholder="800,000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div>
              <Label className="mb-2 block">החזר חודשי נוכחי (₪)</Label>
              <Input
                type="number"
                placeholder="4,500"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div>
              <Label className="mb-2 block">שנים שנותרו</Label>
              <Input
                type="number"
                placeholder="20"
                value={yearsLeft}
                onChange={(e) => setYearsLeft(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div>
              <Label className="mb-2 block">ריבית ממוצעת משוערת (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={`${DEFAULT_RATE}`}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">השאר ריק — נחשב לפי ממוצע שוק {DEFAULT_RATE}%</p>
            </div>
          </div>

          {/* Goal selection */}
          <div className="mb-6">
            <Label className="mb-3 block">מה היעד שלך?</Label>
            <div className="grid grid-cols-3 gap-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
                    goal === g.value
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-gold/30"
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
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-6 md:p-8 border border-red-500/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <AlertTriangle className="text-red-400" size={24} />
                  <span className="text-sm font-semibold text-red-400">⚠️ תוצאת הסימולציה</span>
                </div>
                <p className="text-lg md:text-xl text-foreground mb-2">
                  לפי הנתונים שלך, אתה עלול לשלם כ-
                </p>
                <div className="font-display text-4xl md:text-6xl font-black text-red-400 mb-2">
                  ₪{animatedSavings.toLocaleString()}
                </div>
                <p className="text-lg text-foreground mb-3">יותר בעשור הקרוב</p>
                <p className="text-sm text-muted-foreground">
                  טווח: בין{" "}
                  <span className="font-bold text-foreground">₪{result.savingsLow.toLocaleString()}</span>
                  {" "}ל-
                  <span className="font-bold text-foreground">₪{result.savingsHigh.toLocaleString()}</span>
                </p>
              </div>

              {/* 3-column details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ החזר בתמהיל משופר</div>
                  <div className="font-display font-black text-2xl text-gold">
                    ₪{result.optimisticMonthly.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {(result.usedRate - 0.9).toFixed(1)}%</div>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ ההחזר הנוכחי שלך</div>
                  <div className="font-display font-black text-2xl text-foreground">
                    ₪{result.currentMonthly.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {result.usedRate}%</div>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <div className="text-sm text-muted-foreground mb-2">✔ אם הריבית תעלה ב-1%</div>
                  <div className="font-display font-black text-2xl text-warning">
                    ₪{result.pessimisticMonthly.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">ריבית {(result.usedRate + 1).toFixed(1)}%</div>
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
                        contentStyle={{
                          background: "hsl(210, 35%, 15%)",
                          border: "1px solid hsl(210, 25%, 22%)",
                          borderRadius: "12px",
                          color: "hsl(200, 15%, 92%)",
                        }}
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

              {/* CTA */}
              <div className="bg-gradient-to-br from-gold/10 to-gold-dark/10 rounded-2xl p-8 border border-gold/20 text-center">
                <h3 className="font-display text-2xl md:text-3xl font-black text-foreground mb-3">
                  רוצה בדיקה מלאה ומדויקת תוך 48 שעות?
                </h3>
                <p className="text-muted-foreground mb-6">
                  דוח מקצועי עם 3 תמהילים מותאמים אישית — שמרני, מאוזן ואגרסיבי
                </p>
                <Link to="/intake">
                  <Button variant="cta" size="lg" className="text-lg px-8">
                    פתח בדיקה מלאה — 590 ₪
                    <ArrowLeft size={18} />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">(מתקזז בשירות המלא)</p>
              </div>

              {/* Trust badges */}
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
    </section>
  );
}
