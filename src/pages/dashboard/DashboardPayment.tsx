import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { supabase } from "@/integrations/supabase/client";
import { countMissingDocs } from "@/lib/docsComplete";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, CheckCircle2, Loader2, Lock, FileUp, ClipboardList, XCircle, Hourglass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Tranzila terminal name — provided by Tranzila when the merchant account is approved.
// It appears in the public payment URL, so it is not a secret.
const TRANZILA_TERMINAL = "ttxellisshay";

export default function DashboardPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { caseId, caseType, intakeData, intakeComplete, loading } = useDashboardCase();
  const [docsComplete, setDocsComplete] = useState(false);
  const [missingDocs, setMissingDocs] = useState(0);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  // Tranzila redirects back with ?paid=1 (success) or ?paid=0 (failure)
  const paidParam = searchParams.get("paid");
  const [showPayFrame, setShowPayFrame] = useState(false);

  // Billing details for the invoice — prefillable from the borrower questionnaire
  const personal = (intakeData as any)?.personal ?? {};
  const borrower = personal.borrower1 ?? {};
  const [sameAsBorrower, setSameAsBorrower] = useState(true);
  const [billing, setBilling] = useState({ firstName: "", lastName: "", invoiceName: "", email: "" });

  useEffect(() => {
    if (!sameAsBorrower) return;
    setBilling({
      firstName: borrower.firstName ?? "",
      lastName: borrower.lastName ?? "",
      invoiceName: [borrower.firstName, borrower.lastName].filter(Boolean).join(" "),
      email: borrower.email ?? "",
    });
  }, [sameAsBorrower, borrower.firstName, borrower.lastName, borrower.email]);

  const billingValid =
    billing.firstName.trim().length > 0 &&
    billing.lastName.trim().length > 0 &&
    billing.invoiceName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email.trim());

  const payUrl = `https://secure.tranzila.com/${TRANZILA_TERMINAL}/iframenew.php?sum=3450&currency=1&cred_type=1&lang=il&u1=${caseId}&contact=${encodeURIComponent(billing.invoiceName.trim())}&email=${encodeURIComponent(billing.email.trim())}&company=${encodeURIComponent(billing.invoiceName.trim())}&success_url_address=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=1")}&fail_url_address=${encodeURIComponent(window.location.origin + "/dashboard/payment?paid=0")}`;

  // When Tranzila redirects back inside the embedded frame, move the whole page to the result.
  useEffect(() => {
    if (paidParam && window.self !== window.top) {
      try { window.top!.location.href = window.location.href; } catch { /* cross-origin guard */ }
    }
  }, [paidParam]);

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
      const missing = await countMissingDocs(caseId, caseType, { deferredCountsAsComplete: false });
      setMissingDocs(missing);
      setDocsComplete(missing === 0);
    };
    checkDocs();
  }, [caseId, caseType]);

  // Payment is intentionally allowed once the questionnaire is complete, even if documents are still missing.
  // This reduces abandonment. The 72-hour professional SLA starts only after payment AND required documents are complete.
  const paymentReady = intakeComplete;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
            {docsComplete
              ? "התיק שלך מלא והתשלום התקבל. חלון הטיפול של עד 72 שעות מתחיל עכשיו."
              : `התשלום התקבל ונשמר. נשאר להשלים ${missingDocs || "את"} מסמכי החובה, ורק כשהתיק מלא מתחיל חלון הטיפול של עד 72 שעות.`}
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
              <Badge variant="default">{docsComplete ? "מוכן לניתוח" : "שולם · ממתין למסמכים"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">אישור תשלום</span>
              <span className="text-primary font-medium">נשלח אליך במייל</span>
            </div>
          </CardContent>
        </Card>
        {!docsComplete && (
          <Button variant="cta" size="lg" className="w-full" onClick={() => navigate("/dashboard/documents")}>
            <FileUp size={18} />
            השלמת מסמכים והפעלת 72 השעות
          </Button>
        )}
        <Button variant={docsComplete ? "cta" : "outline"} size="lg" className="w-full" onClick={() => navigate("/dashboard")}>
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
            disabled={!paymentReady}
            onClick={() => { setShowPayFrame(true); navigate("/dashboard/payment"); }}
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

      {!docsComplete && intakeComplete && (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="p-4 text-right">
            <p className="text-sm font-bold text-foreground">אפשר לשלם עכשיו ולא לאבד את התהליך</p>
            <p className="text-xs text-muted-foreground mt-1">
              חסרים כרגע {missingDocs} מסמכי חובה. התשלום ישמור את פתיחת התיק, ואפשר לחזור ולהעלות אותם מהאזור האישי. ה־72 שעות יתחילו רק לאחר השלמת המסמכים.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Price + CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-primary/30 shadow-[var(--shadow-gold)]">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <span className="text-3xl font-display font-black text-foreground">₪3,450</span>
              <span className="text-xs text-muted-foreground block mt-1">כולל מע"מ · תשלום חד פעמי</span>
            </div>
            {paymentReady ? (
              <>
                {showPayFrame ? (
                  <div className="space-y-3">
                    <iframe
                      title="טופס תשלום מאובטח"
                      src={payUrl}
                      className="w-full h-[640px] rounded-xl border border-border bg-background"
                      allow="payment"
                    />
                    <a
                      href={payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary underline underline-offset-4"
                    >
                      הטופס לא נטען? פתחו את דף התשלום בחלון חדש
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4 text-right">
                    {/* Billing details for the invoice */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <p className="text-sm font-bold text-foreground">פרטי חיוב לחשבונית</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={sameAsBorrower}
                          onCheckedChange={(v) => setSameAsBorrower(v === true)}
                        />
                        <span className="text-sm text-muted-foreground">הפרטים זהים לפרטי הלווה מהשאלון</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="bill-first" className="text-xs">שם פרטי</Label>
                          <Input
                            id="bill-first"
                            value={billing.firstName}
                            disabled={sameAsBorrower}
                            onChange={(e) => setBilling((b) => ({ ...b, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="bill-last" className="text-xs">שם משפחה</Label>
                          <Input
                            id="bill-last"
                            value={billing.lastName}
                            disabled={sameAsBorrower}
                            onChange={(e) => setBilling((b) => ({ ...b, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bill-invoice" className="text-xs">שם לחשבונית</Label>
                        <Input
                          id="bill-invoice"
                          value={billing.invoiceName}
                          disabled={sameAsBorrower}
                          onChange={(e) => setBilling((b) => ({ ...b, invoiceName: e.target.value }))}
                          placeholder="שם מלא או שם חברה"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bill-email" className="text-xs">כתובת מייל לחשבונית</Label>
                        <Input
                          id="bill-email"
                          type="email"
                          dir="ltr"
                          className="text-left"
                          value={billing.email}
                          disabled={sameAsBorrower}
                          onChange={(e) => setBilling((b) => ({ ...b, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button
                      variant="cta"
                      size="lg"
                      className="w-full text-base"
                      disabled={!billingValid}
                      onClick={() => setShowPayFrame(true)}
                    >
                      <Zap size={18} />
                      שמור את התיק והמשך לתשלום
                    </Button>
                    {!billingValid && (
                      <p className="text-xs text-warning text-center">יש למלא את כל פרטי החיוב לפני המעבר לתשלום</p>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-3">תשלום מאובטח · פרטי הכרטיס אינם נשמרים ב-EasyMorte</p>
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

                </div>
                <p className="text-[10px] text-muted-foreground mt-3">התשלום נפתח לאחר השלמת השאלון. אפשר להשלים מסמכים גם אחרי התשלום, אבל חלון ה־72 שעות מתחיל רק כשהתיק מלא.</p>
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
