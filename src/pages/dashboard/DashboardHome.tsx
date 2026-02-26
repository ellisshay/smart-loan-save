import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Home, DollarSign, CreditCard, FileText, Shield, Upload, CreditCard as PayIcon,
  CheckCircle2, Clock, Lock, ArrowLeft, AlertTriangle, Loader2
} from "lucide-react";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";
import { NEW_CASE_STEPS, REFI_CASE_STEPS } from "@/types/intake";

interface CaseData {
  id: string;
  case_number: string;
  case_type: "new" | "refi";
  status: CaseStatus;
  intake_data: Record<string, any>;
  intake_complete: boolean;
  payment_succeeded: boolean;
  current_step: number;
  goal: string | null;
  created_at: string;
}

const DASHBOARD_STEPS = [
  { key: "personal", label: "פרטים אישיים", icon: User, href: "/dashboard/personal" },
  { key: "property", label: "נכס ועסקה", icon: Home, href: "/dashboard/property" },
  { key: "income", label: "הכנסות", icon: DollarSign, href: "/dashboard/income" },
  { key: "liabilities", label: "התחייבויות", icon: CreditCard, href: "/dashboard/liabilities" },
  { key: "mortgage_request", label: "משכנתא מבוקשת", icon: FileText, href: "/dashboard/mortgage" },
  { key: "declarations", label: "הצהרות", icon: Shield, href: "/dashboard/declarations" },
  { key: "documents", label: "מסמכים", icon: Upload, href: "/dashboard/documents" },
  { key: "payment", label: "תשלום", icon: PayIcon, href: "/dashboard/payment" },
];

const STATUS_TIMELINE: { status: CaseStatus; label: string }[] = [
  { status: "Draft", label: "טיוטה" },
  { status: "WaitingForPayment", label: "ממתין לתשלום" },
  { status: "PaymentSucceeded", label: "תשלום התקבל" },
  { status: "WaitingForDocs", label: "ממתין למסמכים" },
  { status: "InAnalysis", label: "בניתוח" },
  { status: "ReportGenerated", label: "דוח הופק" },
  { status: "SentToBank", label: "נשלח לבנקים" },
  { status: "BankOfferReceived", label: "הצעות התקבלו" },
  { status: "ClosedWon", label: "הסתיים בהצלחה" },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedDocTypes, setUploadedDocTypes] = useState<string[]>([]);

  useEffect(() => {
    loadCase();
  }, []);

  const loadCase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get latest case
    const { data } = await supabase
      .from("cases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCaseData(data as unknown as CaseData);

      // Get uploaded docs
      const { data: docs } = await supabase
        .from("case_documents")
        .select("doc_type")
        .eq("case_id", data.id);

      if (docs) setUploadedDocTypes(docs.map(d => d.doc_type));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">אין תיק פעיל</h2>
        <p className="text-muted-foreground mb-6">פתח תיק חדש כדי להתחיל</p>
        <Link to="/intake">
          <Button variant="cta" size="lg">פתח תיק חדש</Button>
        </Link>
      </div>
    );
  }

  const intakeData = (caseData.intake_data || {}) as Record<string, any>;

  // Calculate progress
  const stepKeys = DASHBOARD_STEPS.map(s => s.key).filter(k => k !== "payment");
  const completedSteps = stepKeys.filter(key => {
    const d = intakeData[key];
    return d && Object.keys(d).length > 0;
  });
  const progress = Math.round((completedSteps.length / stepKeys.length) * 100);

  // Check required docs
  const requiredDocTypes = ["id_card", "payslips", "bank_statements", "purchase_contract"];
  const allRequiredDocsUploaded = requiredDocTypes.every(t => uploadedDocTypes.includes(t));

  const canPay = progress >= 85 && allRequiredDocsUploaded;

  const getStepStatus = (key: string): "done" | "current" | "locked" => {
    if (key === "payment") return canPay ? "current" : "locked";
    const d = intakeData[key];
    if (d && Object.keys(d).length > 0) return "done";
    // Find first incomplete step
    const firstIncomplete = stepKeys.find(k => {
      const sd = intakeData[k];
      return !sd || Object.keys(sd).length === 0;
    });
    if (key === firstIncomplete) return "current";
    const keyIndex = stepKeys.indexOf(key);
    const firstIncompleteIndex = firstIncomplete ? stepKeys.indexOf(firstIncomplete) : stepKeys.length;
    return keyIndex <= firstIncompleteIndex ? "current" : "locked";
  };

  // Current status order
  const currentStatusOrder = CASE_STATUSES[caseData.status]?.order ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome + progress */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-2xl font-bold text-foreground">התיק שלך</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {caseData.case_number}
          </Badge>
        </div>

        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">השלמת התיק</span>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 mb-4" />
            {progress < 50 && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle size={14} />
                השלם את התיק כדי שנוכל להתחיל בניתוח
              </div>
            )}
            {progress >= 85 && !allRequiredDocsUploaded && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle size={14} />
                העלה את כל המסמכים הנדרשים כדי לפתוח תשלום
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DASHBOARD_STEPS.map((step, i) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={status === "locked" ? "#" : step.href}
                className={status === "locked" ? "pointer-events-none" : ""}
              >
                <Card className={`transition-all hover:shadow-card-hover ${
                  status === "done" ? "border-primary/30" :
                  status === "current" ? "border-gold/30 shadow-gold" :
                  "opacity-50"
                }`}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      status === "done" ? "bg-primary/10" :
                      status === "current" ? "bg-gold/10" :
                      "bg-muted"
                    }`}>
                      {status === "done" ? (
                        <CheckCircle2 size={20} className="text-primary" />
                      ) : status === "current" ? (
                        <Icon size={20} className="text-gold" />
                      ) : (
                        <Lock size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-foreground text-sm">{step.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {status === "done" ? "✔ הושלם" : status === "current" ? "⏳ בתהליך" : "🔒 נעול"}
                      </p>
                    </div>
                    {status !== "locked" && (
                      <ArrowLeft size={16} className="text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Payment CTA */}
      {canPay && !caseData.payment_succeeded && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-gold/30 shadow-gold bg-gradient-to-l from-card to-primary/5">
            <CardContent className="p-6 text-center">
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                התיק מוכן לניתוח! 🎉
              </h3>
              <p className="text-muted-foreground mb-4">
                פתח תיק לניתוח תוך 48 שעות
              </p>
              <Button variant="cta" size="lg">
                פתח תיק לניתוח – ₪3,800
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Timeline */}
      {caseData.status !== "Draft" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">סטטוס התיק</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-0">
                {STATUS_TIMELINE.map((item, i) => {
                  const itemOrder = CASE_STATUSES[item.status]?.order ?? 0;
                  const isDone = currentStatusOrder > itemOrder;
                  const isCurrent = caseData.status === item.status;
                  return (
                    <div key={item.status} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isDone ? "bg-primary border-primary" :
                          isCurrent ? "bg-gold border-gold animate-pulse" :
                          "bg-muted border-border"
                        }`}>
                          {isDone && <CheckCircle2 size={12} className="text-primary-foreground m-auto" />}
                        </div>
                        {i < STATUS_TIMELINE.length - 1 && (
                          <div className={`w-0.5 h-8 ${isDone ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                      {/* Label */}
                      <span className={`text-sm pb-6 ${
                        isDone ? "text-primary font-medium" :
                        isCurrent ? "text-gold font-bold" :
                        "text-muted-foreground"
                      }`}>
                        {isDone ? "✔ " : isCurrent ? "⏳ " : ""}{item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Draft resume banner */}
      {caseData.status === "Draft" && progress > 0 && progress < 100 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock size={20} className="text-warning" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">
                יש לך תיק פתוח שהושלם ב-{progress}%
              </p>
              <p className="text-xs text-muted-foreground">המשך מאיפה שעצרת</p>
            </div>
            <Link to={`/intake?caseId=${caseData.id}`}>
              <Button variant="cta" size="sm">
                המשך מילוי
                <ArrowLeft size={14} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
