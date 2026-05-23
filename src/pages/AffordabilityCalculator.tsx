import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Banknote, Calculator, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmt = (n: number) =>
  "₪" + Math.round(n).toLocaleString("he-IL");

export default function AffordabilityCalculator() {
  const navigate = useNavigate();
  const [price, setPrice] = useState<number>(1800000);

  const { equity, salary, monthly } = useMemo(() => {
    const p = Math.max(0, price || 0);
    return {
      equity: p * 0.2795 + 15000,
      salary: p * 0.00975,
      monthly: p * 0.0039,
    };
  }, [price]);

  const cards = [
    {
      icon: Wallet,
      label: "הון עצמי דרוש",
      value: equity,
      sub: "מחיר הדירה × 27.95% + ₪15,000",
      gradient: "from-[hsl(var(--gold))]/20 to-[hsl(var(--gold))]/5",
      iconBg: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]",
    },
    {
      icon: Banknote,
      label: "משכורת חודשית נדרשת",
      value: salary,
      sub: "מחיר הדירה × 0.975%",
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconBg: "bg-emerald-500/15 text-emerald-400",
    },
    {
      icon: Home,
      label: "החזר חודשי משוער",
      value: monthly,
      sub: "מחיר הדירה × 0.39%",
      gradient: "from-sky-500/20 to-sky-500/5",
      iconBg: "bg-sky-500/15 text-sky-400",
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)] py-12 md:py-20 relative overflow-hidden">
      <Helmet>
        <title>מחשבון יכולת רכישת דירה | EasyMorte</title>
        <meta name="description" content="גלה תוך שניות כמה הון עצמי, משכורת והחזר חודשי תצטרך כדי לקנות את הדירה שאתה רוצה." />
      </Helmet>

      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[hsl(var(--gold))]/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      <div className="container relative max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] text-sm font-semibold mb-5 border border-[hsl(var(--gold))]/20">
            <Sparkles size={14} /> מחשבון חכם
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black text-white mb-3">
            כמה דירה אתה באמת יכול לקנות?
          </h1>
          <p className="text-white/60 text-base md:text-lg">
            הכנס מחיר דירה — נחשב לך הון עצמי, משכורת והחזר חודשי
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm text-white/70">
                  <span className="flex items-center gap-2">
                    <Calculator size={16} className="text-[hsl(var(--gold))]" />
                    מחיר הדירה
                  </span>
                  <span className="font-bold text-white text-lg">{fmt(price)}</span>
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="text-right text-lg font-bold bg-white/10 border-white/20 text-white"
                  dir="ltr"
                />
                <input
                  type="range"
                  min={500000}
                  max={8000000}
                  step={50000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/20 accent-[hsl(var(--gold))]"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>₪500K</span>
                  <span>₪8M</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className={`bg-gradient-to-br ${c.gradient} border-white/10 backdrop-blur-xl h-full`}>
                  <CardContent className="p-5 space-y-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">{c.label}</p>
                      <motion.p
                        key={c.value}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-2xl md:text-3xl font-black text-white"
                      >
                        {fmt(c.value)}
                      </motion.p>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">{c.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            variant="hero"
            size="xl"
            className="shadow-gold text-lg"
            onClick={() => navigate("/")}
          >
            קבל ניתוח מלא חינם
            <ArrowLeft size={18} />
          </Button>
          <p className="text-xs text-white/40 mt-4">
            * החישוב מבוסס על מודל הערכה כללי. הניתוח המלא לוקח בחשבון את הפרופיל הפיננסי שלך.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
