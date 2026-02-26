import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NewMortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState("");
  const [equity, setEquity] = useState("");
  const [years, setYears] = useState("25");
  const [rate, setRate] = useState("4.5");
  const [result, setResult] = useState<{
    loanAmount: number;
    monthlyPayment: number;
    totalPayment: number;
    totalInterest: number;
    ltv: number;
  } | null>(null);

  const calculate = () => {
    const price = parseFloat(propertyPrice);
    const eq = parseFloat(equity);
    const y = parseFloat(years);
    const r = parseFloat(rate);
    if (!price || !eq || !y || !r || eq >= price) return;

    const loan = price - eq;
    const ltv = (loan / price) * 100;
    const monthlyRate = r / 100 / 12;
    const months = y * 12;
    const monthly = loan * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const total = monthly * months;

    setResult({
      loanAmount: loan,
      monthlyPayment: monthly,
      totalPayment: total,
      totalInterest: total - loan,
      ltv,
    });
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-2xl">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Home className="text-violet-400" size={28} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            מחשבון משכנתא חדשה
          </h1>
          <p className="text-muted-foreground">חשב את ההחזר החודשי למשכנתא חדשה לפי מחיר הנכס וההון העצמי שלך</p>
        </motion.div>

        <motion.div
          className="bg-card rounded-2xl p-8 shadow-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <Label>מחיר הנכס (₪)</Label>
              <Input
                type="number"
                placeholder="1,800,000"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
              />
            </div>
            <div>
              <Label>הון עצמי (₪)</Label>
              <Input
                type="number"
                placeholder="450,000"
                value={equity}
                onChange={(e) => setEquity(e.target.value)}
              />
            </div>
            <div>
              <Label>תקופת המשכנתא (שנים)</Label>
              <Input
                type="number"
                placeholder="25"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
            <div>
              <Label>ריבית שנתית ממוצעת (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="4.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>

          <Button variant="cta" className="w-full" size="lg" onClick={calculate}>
            <Calculator size={18} />
            חשב את המשכנתא שלי
          </Button>

          {result && (
            <motion.div
              className="mt-8 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-1">סכום המשכנתא</div>
                  <div className="font-display font-black text-2xl text-foreground">
                    ₪{result.loanAmount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
                  <div className="text-sm text-muted-foreground mb-1">החזר חודשי</div>
                  <div className="font-display font-black text-2xl text-emerald-400">
                    ₪{Math.round(result.monthlyPayment).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-1">סה״כ תשלום</div>
                  <div className="font-display font-bold text-lg text-foreground">
                    ₪{Math.round(result.totalPayment).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-1">סה״כ ריבית</div>
                  <div className="font-display font-bold text-lg text-foreground">
                    ₪{Math.round(result.totalInterest).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gold/5 rounded-xl border border-gold/10 text-center">
                <p className="text-sm text-muted-foreground">
                  שיעור מימון (LTV): <span className="font-bold text-gold">{result.ltv.toFixed(0)}%</span>
                  {result.ltv > 75 && (
                    <span className="text-amber-400 mr-2">· מימון גבוה — ייתכן שתצטרך ביטוח משכנתא</span>
                  )}
                </p>
              </div>

              <div className="text-center pt-2">
                <Link to="/intake">
                  <Button variant="cta" size="lg">
                    רוצה דוח מלא עם 3 תמהילים?
                    <ArrowLeft size={16} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
