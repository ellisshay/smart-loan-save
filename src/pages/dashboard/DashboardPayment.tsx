import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Shield, CheckCircle2, Loader2, Lock, FileUp, ClipboardList } from "lucide-react";

export default function DashboardPayment() {
  const navigate = useNavigate();
  const { caseId, caseType, intakeData, intakeComplete, loading } = useDashboardCase();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [docsComplete, setDocsComplete] = useState(false);
  const [missingDocs, setMissingDocs] = useState(0);

  // Check required documents status
  useEffect(() => {
    if (!caseId) return;
    const checkDocs = async () => {
      const { data } = await supabase
        .from("case_documents")
        .select("doc_type, ai_extracted_data")
        .eq("case_id", caseId);
      // Only verified documents count toward a complete file
      const uploadedTypes = (data || [])
        .filter((d) => (d.ai_extracted_data as any)?.overall === "verified")
        .map((d) => d.doc_type);
      const requiredDocs = (caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required);
      const missing = requiredDocs.filter((d) => !uploadedTypes.includes(d.type)).length;
      setMissingDocs(missing);
      setDocsComplete(missing === 0);
    };
    checkDocs();
  }, [caseId, caseType]);

  const fileComplete = intakeComplete && docsComplete;

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
        <h2 className="font-display text-2xl font-bold text-foreground">פתיחת תיק לניתוח תוך 72 שעות</h2>
        <p className="text-sm text-muted-foreground mt-2">
          צוות המומחים שלנו יבנה עבורך תמהיל אופטימלי
        </p>
      </motion.div>

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground text-center font-medium">
        שימו לב: עד לקבלת התשלום הבקשה לא תאובחן ולא תועבר לניתוח.
      </div>

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
              {timerExpired ? "עדיין ניתן לשלם, הניתוח יתחיל בתור הרגיל" : "נשמר לך מקום בראש התור"}
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
              <span className="text-3xl font-display font-black text-foreground">₪3,450</span>
              <span className="text-xs text-muted-foreground block mt-1">כולל מע"מ · תשלום חד פעמי</span>
            </div>
            {fileComplete ? (
              <>
                <Button variant="cta" size="lg" className="w-full text-base" onClick={() => window.open("https://secure.tranzila.com/YOUR_TERMINAL/iframed.php?sum=3800&currency=1&cred_type=1&success_url=https://smart-loan-save.lovable.app/dashboard", "_blank")}>
                  <Zap size={18} />
                  פתח ניתוח תוך 72 שעות
                </Button>
                <p className="text-[10px] text-muted-foreground mt-3">תשלום מאובטח · SSL 256-bit</p>
              </>
            ) : (
              <>
                <Button variant="cta" size="lg" className="w-full text-base" disabled>
                  <Lock size={18} />
                  התשלום ייפתח לאחר השלמת התיק
                </Button>
                <div className="mt-4 space-y-2 text-right">
                  {!intakeComplete && (
                    <button
                      onClick={() => navigate("/dashboard/mortgage")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
                    >
                      <ClipboardList size={16} className="text-warning shrink-0" />
                      <span className="text-sm text-foreground">השלם את שאלון הפרטים האישיים</span>
                    </button>
                  )}
                  {!docsComplete && (
                    <button
                      onClick={() => navigate("/dashboard/documents")}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-colors"
                    >
                      <FileUp size={16} className="text-warning shrink-0" />
                      <span className="text-sm text-foreground">
                        העלה את המסמכים הנדרשים{missingDocs > 0 ? ` (חסרים ${missingDocs})` : ""}
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">הצעת המשכנתא נפתחת רק כשהתיק מלא, כדי שהניתוח יהיה מדויק</p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
        ← חזרה לדשבורד
      </Button>
    </div>
  );
}
