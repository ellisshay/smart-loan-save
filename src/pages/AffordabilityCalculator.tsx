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
      iconBg: "bg-primary/10 text-primary",
    },
    {
      icon: Banknote,
      label: "משכורת חודשית נדרשת",
      value: salary,
      sub: "מחיר הדירה × 0.975%",
      iconBg: "bg-success/10 text-success",
    },
    {
      icon: Home,
      label: "החזר חודשי משוער",
      value: monthly,
      sub: "מחיר הדירה × 0.39%",
      iconBg: "bg-secondary text-primary",
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-hero py-12 md:py-20 relative overflow-hidden">
      <Helmet>
        <title>מחשבון יכולת רכישת דירה | EasyMorte</title>
        <meta name="description" content="גלה תוך שניות כמה הון עצמי, משכורת והחזר חודשי תצטרך כדי לקנות את הדירה שאתה רוצה." />
      </Helmet>

      <div className="absolute inset-0 bg-grain opacity-60 pointer-events-none" />

      <div className="container relative max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5 border border-primary/25">
            <Sparkles size={14} /> מחשבון חכם
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground mb-3">
            כמה דירה אתה באמת יכול לקנות?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            הכנס מחיר דירה — נחשב לך הון עצמי, משכורת והחזר חודשי
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl shadow-card border border-border mb-6">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calculator size={16} className="text-primary" />
                    מחיר הדירה
                  </span>
                  <span className="font-bold text-foreground text-lg">{fmt(price)}</span>
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="text-right text-lg font-bold"
                  dir="ltr"
                />
                <input
                  type="range"
                  min={500000}
                  max={8000000}
                  step={50000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
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
                <Card className="rounded-2xl shadow-card border border-border hover:shadow-card-hover transition-shadow h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                      <motion.p
                        key={c.value}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-2xl md:text-3xl font-extrabold text-foreground"
                      >
                        {fmt(c.value)}
                      </motion.p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{c.sub}</p>
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
            className="shadow-gold text-lg rounded-full px-10"
            onClick={() => navigate("/")}
          >
            קבל ניתוח מלא חינם
            <ArrowLeft size={18} />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            * החישוב מבוסס על מודל הערכה כללי. הניתוח המלא לוקח בחשבון את הפרופיל הפיננסי שלך.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
