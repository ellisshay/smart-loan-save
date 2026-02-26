import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

interface RefinanceResult {
  monthlySaving: number;
  totalSaving: number;
  breakEvenMonths: number;
  worthIt: boolean;
}

function calculateRefinance(data: {
  balance: number;
  yearsLeft: number;
  currentRate: number;
  newRate: number;
  costs: number;
  exitPenalty: number;
}): RefinanceResult {
  const { balance, yearsLeft, currentRate, newRate, costs, exitPenalty } = data;
  const months = yearsLeft * 12;

  const calcPayment = (rate: number) => {
    const r = rate / 100 / 12;
    return (balance * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const currentPayment = calcPayment(currentRate);
  const newPayment = calcPayment(newRate);
  const monthlySaving = Math.round(currentPayment - newPayment);
  const totalCosts = costs + exitPenalty;
  const totalSaving = Math.round(monthlySaving * months - totalCosts);
  const breakEvenMonths = monthlySaving > 0 ? Math.ceil(totalCosts / monthlySaving) : 999;
  const worthIt = totalSaving > 0 && breakEvenMonths < months;

  return { monthlySaving, totalSaving, breakEvenMonths, worthIt };
}

export default function RefinanceCalculator() {
  const [result, setResult] = useState<RefinanceResult | null>(null);
  const [form, setForm] = useState({
    balance: "",
    yearsLeft: "",
    currentRate: "",
    newRate: "",
    costs: "",
    exitPenalty: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(
      calculateRefinance({
        balance: Number(form.balance),
        yearsLeft: Number(form.yearsLeft),
        currentRate: Number(form.currentRate),
        newRate: Number(form.newRate),
        costs: Number(form.costs) || 0,
        exitPenalty: Number(form.exitPenalty) || 0,
      })
    );
  };

  const update = (field: string, value: string) =>
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
            💰 סימולטור מיחזור וחיסכון
          </h1>
          <p className="text-muted-foreground mb-8">
            בדוק אם מיחזור משכנתא ישתלם לך — ותוך כמה חודשים תחזיר את ההשקעה.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <Field label="יתרת משכנתא (₪)" value={form.balance} onChange={(v) => update("balance", v)} placeholder="500000" />
            <Field label="שנים שנותרו" value={form.yearsLeft} onChange={(v) => update("yearsLeft", v)} placeholder="20" />
            <Field label="ריבית נוכחית (%)" value={form.currentRate} onChange={(v) => update("currentRate", v)} placeholder="5.0" step="0.1" />
            <Field label="ריבית חדשה משוערת (%)" value={form.newRate} onChange={(v) => update("newRate", v)} placeholder="3.5" step="0.1" />
            <Field label="עלויות מיחזור (₪)" value={form.costs} onChange={(v) => update("costs", v)} placeholder="8000" />
            <Field label="קנס יציאה (₪, אם קיים)" value={form.exitPenalty} onChange={(v) => update("exitPenalty", v)} placeholder="0" />

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
              className="mt-8 bg-card rounded-2xl p-6 md:p-8 shadow-card space-y-6"
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-3 ${result.worthIt ? "bg-success/10" : "bg-destructive/10"}`}>
                  {result.worthIt ? (
                    <CheckCircle2 size={40} className="text-success" />
                  ) : (
                    <XCircle size={40} className="text-destructive" />
                  )}
                </div>
                <h2 className="font-display text-2xl font-black text-foreground">
                  {result.worthIt ? "כדאי לבצע מיחזור!" : "לא כדאי כרגע"}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Stat label="חיסכון חודשי" value={`₪${result.monthlySaving.toLocaleString()}`} />
                <Stat label="חיסכון כולל" value={`₪${result.totalSaving.toLocaleString()}`} />
                <Stat label="נקודת איזון" value={`${result.breakEvenMonths} חודשים`} />
              </div>

              <div className="pt-2">
                <Link to="/pricing">
                  <Button variant="cta" size="lg" className="w-full">
                    פתח תיק פרימיום תוך 48 שעות — ₪3,500
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Field({
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl p-3 text-center">
      <div className="font-display text-lg font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
