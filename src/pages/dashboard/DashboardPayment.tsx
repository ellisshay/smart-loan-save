import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Shield, CheckCircle2, Loader2 } from "lucide-react";

export default function DashboardPayment() {
  const navigate = useNavigate();
  const { caseId, intakeData, loading } = useDashboardCase();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerExpired = timeLeft <= 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Zap size={32} className="text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">פתיחת תיק לניתוח תוך 48 שעות</h2>
        <p className="text-sm text-muted-foreground mt-2">
          צוות המומחים שלנו יבנה עבורך תמהיל אופטימלי
        </p>
      </motion.div>

      {/* Priority timer */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className={`border-2 ${timerExpired ? "border-border" : "border-warning/30"}`}>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock size={16} className={timerExpired ? "text-muted-foreground" : "text-warning"} />
              <span className="text-sm font-medium text-foreground">
                {timerExpired ? "חלון העדיפות הסתיים" : "חלון עדיפות לניתוח מהיר"}
              </span>
            </div>
            {!timerExpired && (
              <div className="font-display text-4xl font-black text-warning tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {timerExpired ? "עדיין ניתן לשלם – הניתוח יתחיל בתור הרגיל" : "נשמר לך מקום בראש התור"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features */}
      <div className="space-y-3">
        {[
          { icon: CheckCircle2, text: "ניתוח מלא של כל מסלולי המשכנתא" },
          { icon: CheckCircle2, text: "בניית 3 תמהילים מותאמים אישית" },
          { icon: CheckCircle2, text: "דוח מפורט עם השוואה לשוק" },
          { icon: Shield, text: "ליווי עד לחתימה בבנק" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <f.icon size={16} className="text-primary shrink-0" />
            <span className="text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Price + CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-primary/30 shadow-[var(--shadow-gold)]">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <span className="text-3xl font-display font-black text-foreground">₪3,800</span>
              <span className="text-xs text-muted-foreground block mt-1">כולל מע"מ · תשלום חד פעמי</span>
            </div>
            <Button variant="cta" size="lg" className="w-full text-base">
              <Zap size={18} />
              פתח ניתוח תוך 48 שעות
            </Button>
            <p className="text-[10px] text-muted-foreground mt-3">תשלום מאובטח · SSL 256-bit</p>
          </CardContent>
        </Card>
      </motion.div>

      <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
        ← חזרה לדשבורד
      </Button>
    </div>
  );
}
