import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Shield, CheckCircle2, Loader2, Lock, FileUp, ClipboardList, XCircle, Hourglass } from "lucide-react";

// Tranzila terminal name — provided by Tranzila when the merchant account is approved.
// It appears in the public payment URL, so it is not a secret.
const TRANZILA_TERMINAL = "ttxellisshay";

export default function DashboardPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { caseId, caseType, intakeData, intakeComplete, loading } = useDashboardCase();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [docsComplete, setDocsComplete] = useState(false);
  const [missingDocs, setMissingDocs] = useState(0);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  // Tranzila redirects back with ?paid=1 (success) or ?paid=0 (failure)
  const paidParam = searchParams.get("paid");

  // Fetch the case's payment status
  useEffect(() => {
    if (!caseId) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("cases")
        .select("status, payment_succeeded")
        .eq("id", caseId)
        .single();
      if (data) {
        setCaseStatus(data.status);
        setPaymentSucceeded(!!data.payment_succeeded);
      }
    };
    fetchStatus();
    // Poll briefly after returning from Tranzila so the notify webhook can land
    if (paidParam === "1") {
      const poll = setInterval(fetchStatus, 3000);
      const stop = setTimeout(() => clearInterval(poll), 30000);
      return () => { clearInterval(poll); clearTimeout(stop); };
    }
  }, [caseId, paidParam]);

  // Check required documents status (verified, in expert review, or deferred by the client)
  useEffect(() => {
    if (!caseId) return;
    const checkDocs = async () => {
      const missing = await countMissingDocs(caseId, caseType);
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

  // Payment status: confirmed (webhook landed), failed (Tranzila returned paid=0), pending (paid=1 but not yet confirmed)
  const paymentState: "confirmed" | "failed" | "pending" | null = paymentSucceeded
    ? "confirmed"
    : paidParam === "0"
      ? "failed"
      : paidParam === "1"
        ? "pending"
        : null;

  // Confirmed payment screen
  if (paymentState === "confirmed") {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={44} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">התשלום אושר בהצלחה</h2>
          <p className="text-sm text-muted-foreground mt-2">
            התיק שלך נפתח לניתוח. צוות המומחים יטפל בו תוך עד 72 שעות, ונעדכן אותך בכל שלב.
          </p>
        </motion.div>
        <Card className="border-primary/30">
          <CardContent className="p-5 space-y-3 text-right">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">סכום ששולם</span>
              <span className="font-bold text-foreground">₪3,450</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">סטטוס תיק</span>
              <Badge variant="default">בניתוח</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">אישור תשלום</span>
              <span className="text-primary font-medium">נשלח אליך במייל</span>
            </div>
          </CardContent>
        </Card>
        <Button variant="cta" size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
          מעבר לאזור האישי
        </Button>
      </div>
    );
  }

  // Failed payment screen
  if (paymentState === "failed") {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle size={44} className="text-destructive" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">התשלום לא הושלם</h2>
          <p className="text-sm text-muted-foreground mt-2">
            העסקה לא אושרה או בוטלה. לא חויבת, וניתן לנסות שוב בכל עת.
          </p>
        </motion.div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          שימו לב: עד לקבלת התשלום הבקשה לא תאובחן ולא תועבר לניתוח.
        </div>
        <div className="flex flex-col gap-3">
          <Button
            variant="cta"
            size="lg"
            className="w-full"
            disabled={!fileComplete}
            onClick={() => window.open(`https://secure.tranzila.com/${TRANZILA_TERMINAL}/iframed.php?sum=3450&currency=1&cred_type=1&u1=${caseId}&success_url=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=1")}&fail_url=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=0")}`, "_blank")}
          >
            <Zap size={18} />
            נסה שוב לשלם ₪3,450
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
            ← חזרה לדשבורד
          </Button>
        </div>
      </div>
    );
  }

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

      {/* Pending confirmation banner — Tranzila returned success, waiting for webhook */}
      {paymentState === "pending" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Hourglass size={22} className="text-primary shrink-0 animate-pulse" />
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">התשלום התקבל — ממתין לאישור סופי</p>
                <p className="text-xs text-muted-foreground">
                  אנחנו מאמתים את העסקה מול חברת האשראי. העמוד יתעדכן אוטומטית תוך מספר שניות.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                <Button variant="cta" size="lg" className="w-full text-base" onClick={() => window.open(`https://secure.tranzila.com/${TRANZILA_TERMINAL}/iframed.php?sum=3450&currency=1&cred_type=1&u1=${caseId}&success_url=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=1")}&fail_url=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=0")}`, "_blank")}>
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
