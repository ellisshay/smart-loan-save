import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, TrendingUp, ArrowLeft } from "lucide-react";

interface WasteResult {
  score: number;
  waste5: number;
  waste10: number;
  sources: string[];
  recommendation: string;
  newPaymentIfPrimeUp: number;
}

function calculateWaste(data: {
  balance: number;
  avgRate: number;
  yearsLeft: number;
  monthlyPayment: number;
  isIndexLinked: boolean;
  primePct: number;
  goal: string;
}): WasteResult {
  const { balance, avgRate, yearsLeft, monthlyPayment, isIndexLinked, primePct } = data;

  // Calculate theoretical optimal payment
  const optimalRate = 3.5; // benchmark
  const monthlyOptRate = optimalRate / 100 / 12;
  const months = yearsLeft * 12;
  const optimalPayment =
    (balance * monthlyOptRate * Math.pow(1 + monthlyOptRate, months)) /
    (Math.pow(1 + monthlyOptRate, months) - 1);

  const excessMonthly = Math.max(0, monthlyPayment - optimalPayment);
  const waste5 = Math.round(excessMonthly * 60);
  const waste10 = Math.round(excessMonthly * 120);

  // Score
  const rateScore = Math.min(40, Math.round(((avgRate - 3.0) / 3.0) * 40));
  const indexScore = isIndexLinked ? 20 : 0;
  const primeScore = primePct > 50 ? Math.round((primePct - 50) / 50 * 20) : 0;
  const paymentRatio = monthlyPayment / (balance / months);
  const paymentScore = Math.min(20, Math.round((paymentRatio - 1) * 20));
  const score = Math.min(100, Math.max(1, rateScore + indexScore + primeScore + paymentScore));

  const sources: string[] = [];
  if (avgRate > 4.5) sources.push("ריבית גבוהה מהממוצע בשוק");
  if (isIndexLinked) sources.push("חשיפה למדד — עלויות עולות עם האינפלציה");
  if (primePct > 50) sources.push("חשיפת יתר לפריים — סיכון בעליית ריבית");
  if (excessMonthly > 200) sources.push("החזר חודשי גבוה ביחס ליתרה");
  if (sources.length === 0) sources.push("המשכנתא שלך בטווח סביר, אך ייתכן שיש מקום לשיפור");

  const recommendation =
    score > 60
      ? "מומלץ מאוד לבצע מיחזור. יש פוטנציאל חיסכון משמעותי."
      : score > 30
      ? "כדאי לבדוק אפשרויות מיחזור. ייתכן חיסכון."
      : "המשכנתא שלך במצב סביר. בדוק שוב בעוד שנה.";

  // If prime goes up 1%
  const primeAmount = balance * (primePct / 100);
  const extraMonthly = Math.round((primeAmount * 0.01) / 12);
  const newPaymentIfPrimeUp = monthlyPayment + extraMonthly;

  return { score, waste5, waste10, sources, recommendation, newPaymentIfPrimeUp };
}

export default function WasteCalculator() {
  const [result, setResult] = useState<WasteResult | null>(null);
  const [form, setForm] = useState({
    balance: "",
    avgRate: "",
    yearsLeft: "",
    monthlyPayment: "",
    isIndexLinked: false,
    primePct: "",
    goal: "lower_payment",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = calculateWaste({
      balance: Number(form.balance),
      avgRate: Number(form.avgRate),
      yearsLeft: Number(form.yearsLeft),
      monthlyPayment: Number(form.monthlyPayment),
      isIndexLinked: form.isIndexLinked,
      primePct: Number(form.primePct) || 0,
      goal: form.goal,
    });
    setResult(r);
  };

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/calculators" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} />
            חזרה למחשבונים
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-2">
            📊 מדד בזבוז משכנתא
          </h1>
          <p className="text-muted-foreground mb-8">
            גלה כמה כסף אתה מבזבז כל חודש — וקבל ציון + המלצה.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <InputField label="יתרת משכנתא (₪)" value={form.balance} onChange={(v) => update("balance", v)} placeholder="500000" />
            <InputField label="ריבית ממוצעת (%)" value={form.avgRate} onChange={(v) => update("avgRate", v)} placeholder="4.5" step="0.1" />
            <InputField label="שנים שנותרו" value={form.yearsLeft} onChange={(v) => update("yearsLeft", v)} placeholder="20" />
            <InputField label="החזר חודשי (₪)" value={form.monthlyPayment} onChange={(v) => update("monthlyPayment", v)} placeholder="3500" />
            <InputField label="אחוז פריים מהמשכנתא (%)" value={form.primePct} onChange={(v) => update("primePct", v)} placeholder="33" />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isIndexLinked}
                onChange={(e) => update("isIndexLinked", e.target.checked)}
                className="w-5 h-5 rounded border-border text-gold accent-gold"
              />
              <span className="text-sm text-foreground">חלק מהמשכנתא צמוד למדד</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">יעד</label>
              <select
                value={form.goal}
                onChange={(e) => update("goal", e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
              >
                <option value="lower_payment">להוריד החזר חודשי</option>
                <option value="shorten">לקצר תקופה</option>
              </select>
            </div>

            <Button variant="cta" size="lg" className="w-full" type="submit">
              חשב עכשיו
            </Button>
          </form>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <ResultCard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        required
        className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function ResultCard({ result }: { result: WasteResult }) {
  const scoreColor =
    result.score > 60 ? "text-destructive" : result.score > 30 ? "text-warning" : "text-success";
  const scoreBg =
    result.score > 60 ? "bg-destructive/10" : result.score > 30 ? "bg-warning/10" : "bg-success/10";

  return (
    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${scoreBg} mb-3`}>
          <span className={`font-display text-4xl font-black ${scoreColor}`}>{result.score}</span>
        </div>
        <p className="text-sm text-muted-foreground">ציון בזבוז (1 = מצוין, 100 = בזבוז גבוה)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted rounded-xl p-4 text-center">
          <div className="font-display text-2xl font-black text-foreground">₪{result.waste5.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">בזבוז צפוי ב-5 שנים</div>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <div className="font-display text-2xl font-black text-foreground">₪{result.waste10.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">בזבוז צפוי ב-10 שנים</div>
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle size={18} className="text-warning" />
          מקורות הבזבוז
        </h3>
        <ul className="space-y-1.5">
          {result.sources.map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-gold mt-0.5">•</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-muted rounded-xl p-4">
        <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-gold" />
          אם פריים עולה ב-1%
        </h3>
        <p className="text-sm text-muted-foreground">
          ההחזר החודשי החדש יהיה: <span className="font-bold text-foreground">₪{result.newPaymentIfPrimeUp.toLocaleString()}</span>
        </p>
      </div>

      <div className="bg-primary/5 rounded-xl p-4">
        <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-success" />
          המלצה
        </h3>
        <p className="text-sm text-muted-foreground">{result.recommendation}</p>
      </div>

      <div className="pt-2">
        <Link to="/pricing">
          <Button variant="cta" size="lg" className="w-full">
            פתח תיק פרימיום תוך 48 שעות — ₪3,500
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground text-center mt-2">
          דוח מקצועי + 3 תמהילים + שליחה לבנקים
        </p>
      </div>
    </div>
  );
}
