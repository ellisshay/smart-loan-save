import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

interface MixTrack {
  name: string;
  pct: number;
  rate: number;
  type: string;
}

interface MixResult {
  name: string;
  emoji: string;
  tracks: MixTrack[];
  initialPayment: number;
  totalCost: number;
  riskScore: number;
  pros: string[];
  cons: string[];
}

function generateMixes(data: {
  amount: number;
  years: number;
  income: number;
  riskLevel: string;
}): MixResult[] {
  const { amount, years } = data;
  const months = years * 12;

  const calcPayment = (principal: number, rate: number) => {
    const r = rate / 100 / 12;
    if (r === 0) return principal / months;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  const mixes: MixResult[] = [
    {
      name: "שמרני",
      emoji: "🛡️",
      tracks: [
        { name: "קבועה לא צמודה", pct: 60, rate: 5.2, type: "fixed" },
        { name: "פריים", pct: 20, rate: 4.75, type: "prime" },
        { name: "משתנה כל 5 לא צמודה", pct: 20, rate: 4.4, type: "variable" },
      ],
      riskScore: 25,
      pros: ["יציבות מקסימלית", "החזר צפוי ללא הפתעות", "מתאים לתכנון ארוך טווח"],
      cons: ["עלות כוללת גבוהה יותר", "פחות גמישות"],
      initialPayment: 0,
      totalCost: 0,
    },
    {
      name: "מאוזן",
      emoji: "⚖️",
      tracks: [
        { name: "קבועה לא צמודה", pct: 34, rate: 5.2, type: "fixed" },
        { name: "פריים", pct: 33, rate: 4.75, type: "prime" },
        { name: "משתנה כל 5 לא צמודה", pct: 33, rate: 4.4, type: "variable" },
      ],
      riskScore: 50,
      pros: ["איזון בין יציבות לחיסכון", "גמישות סבירה", "פיזור סיכונים"],
      cons: ["חשיפה מסוימת לשינויי ריבית"],
      initialPayment: 0,
      totalCost: 0,
    },
    {
      name: "אגרסיבי",
      emoji: "🚀",
      tracks: [
        { name: "פריים", pct: 50, rate: 4.75, type: "prime" },
        { name: "משתנה כל 5 לא צמודה", pct: 30, rate: 4.4, type: "variable" },
        { name: "קבועה לא צמודה", pct: 20, rate: 5.2, type: "fixed" },
      ],
      riskScore: 75,
      pros: ["החזר התחלתי הנמוך ביותר", "עלות כוללת נמוכה אם הריבית יורדת", "גמישות מקסימלית"],
      cons: ["חשיפה גבוהה לעליית ריבית", "פחות צפיות"],
      initialPayment: 0,
      totalCost: 0,
    },
  ];

  // Calculate payments and costs
  for (const mix of mixes) {
    let totalPayment = 0;
    for (const track of mix.tracks) {
      const principal = amount * (track.pct / 100);
      totalPayment += calcPayment(principal, track.rate);
    }
    mix.initialPayment = Math.round(totalPayment);
    mix.totalCost = Math.round(totalPayment * months);
  }

  return mixes;
}

export default function MixCalculator() {
  const [results, setResults] = useState<MixResult[] | null>(null);
  const [form, setForm] = useState({
    amount: "",
    years: "",
    income: "",
    riskLevel: "balanced",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(
      generateMixes({
        amount: Number(form.amount),
        years: Number(form.years),
        income: Number(form.income),
        riskLevel: form.riskLevel,
      })
    );
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const recommended =
    form.riskLevel === "conservative" ? 0 : form.riskLevel === "aggressive" ? 2 : 1;

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/calculators" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={16} />
            חזרה למחשבונים
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-2">
            ⚖️ השוואת תמהילים
          </h1>
          <p className="text-muted-foreground mb-8">
            קבל 3 תמהילים — שמרני, מאוזן ואגרסיבי — מותאמים אישית.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <Field label="סכום משכנתא (₪)" value={form.amount} onChange={(v) => update("amount", v)} placeholder="1000000" />
            <Field label="תקופה (שנים)" value={form.years} onChange={(v) => update("years", v)} placeholder="25" />
            <Field label="הכנסה נטו חודשית (₪)" value={form.income} onChange={(v) => update("income", v)} placeholder="18000" />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">רמת סיכון</label>
              <select
                value={form.riskLevel}
                onChange={(e) => update("riskLevel", e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
              >
                <option value="conservative">שמרני — אני רוצה שקט</option>
                <option value="balanced">מאוזן — מוכן לקצת סיכון</option>
                <option value="aggressive">אגרסיבי — מוכן לסכן לחיסכון</option>
              </select>
            </div>

            <Button variant="cta" size="lg" className="w-full" type="submit">
              צור 3 תמהילים
            </Button>
          </form>
        </motion.div>

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {results.map((mix, i) => (
                  <motion.div
                    key={mix.name}
                    className={`relative bg-card rounded-2xl p-6 shadow-card border-2 transition-all ${
                      i === recommended ? "border-gold shadow-gold" : "border-transparent"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {i === recommended && (
                      <div className="absolute -top-3 right-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                        מומלץ עבורך
                      </div>
                    )}

                    <div className="text-3xl mb-2">{mix.emoji}</div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-4">{mix.name}</h3>

                    {/* Tracks */}
                    <div className="space-y-2 mb-5">
                      {mix.tracks.map((t) => (
                        <div key={t.name} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t.name}</span>
                          <span className="font-semibold text-foreground">{t.pct}% | {t.rate}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted rounded-xl p-3 mb-4 text-center">
                      <div className="font-display text-xl font-black text-foreground">₪{mix.initialPayment.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">החזר חודשי התחלתי</div>
                    </div>

                    <div className="text-center mb-4">
                      <span className="text-xs text-muted-foreground">עלות כוללת: </span>
                      <span className="text-sm font-semibold text-foreground">₪{mix.totalCost.toLocaleString()}</span>
                    </div>

                    {/* Risk */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted-foreground">סיכון:</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full"
                          style={{ width: `${mix.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{mix.riskScore}%</span>
                    </div>

                    {/* Pros/Cons */}
                    <div className="space-y-1.5 mb-2">
                      {mix.pros.map((p) => (
                        <div key={p} className="flex items-start gap-2 text-xs text-success">
                          <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                          {p}
                        </div>
                      ))}
                      {mix.cons.map((c) => (
                        <div key={c} className="flex items-start gap-2 text-xs text-destructive">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          {c}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link to="/pricing">
                  <Button variant="cta" size="xl">
                    פתח תיק פרימיום תוך 48 שעות — ₪3,500
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-2">
                  דוח מקצועי מלא + שליחה לבנקים + ליווי עד חתימה
                </p>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
