import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Home, DollarSign, CreditCard, FileText, Shield, Upload, CreditCard as PayIcon,
  CheckCircle2, Clock, Lock, ArrowLeft, AlertTriangle, Loader2, Flame, TrendingDown,
  Trophy, Zap, Target, Sparkles
} from "lucide-react";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";

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
  { key: "personal", label: "פרטים אישיים", icon: User, href: "/dashboard/personal", group: 1 },
  { key: "property", label: "נכס ועסקה", icon: Home, href: "/dashboard/property", group: 1 },
  { key: "income", label: "הכנסות", icon: DollarSign, href: "/dashboard/income", group: 1 },
  { key: "liabilities", label: "התחייבויות", icon: CreditCard, href: "/dashboard/liabilities", group: 1 },
  { key: "mortgage_request", label: "משכנתא מבוקשת", icon: FileText, href: "/dashboard/mortgage", group: 1 },
  { key: "declarations", label: "הצהרות", icon: Shield, href: "/dashboard/declarations", group: 2 },
  { key: "documents", label: "מסמכים", icon: Upload, href: "/dashboard/documents", group: 2 },
  { key: "payment", label: "תשלום", icon: PayIcon, href: "/dashboard/payment", group: 2 },
];

const REWARD_MILESTONES = [
  { threshold: 25, icon: Sparkles, label: "תצוגת חיסכון משופרת", color: "text-primary" },
  { threshold: 50, icon: TrendingDown, label: 'סימולציה "אם ריבית עולה 1%"', color: "text-warning" },
  { threshold: 85, icon: Zap, label: "תשלום + תיק נכנס ל-48 שעות", color: "text-success" },
];

export default function DashboardHome() {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedDocTypes, setUploadedDocTypes] = useState<string[]>([]);

  useEffect(() => { loadCase(); }, []);

  const loadCase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("cases").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
    if (data) {
      setCaseData(data as unknown as CaseData);
      const { data: docs } = await supabase.from("case_documents").select("doc_type").eq("case_id", data.id);
      if (docs) setUploadedDocTypes(docs.map(d => d.doc_type));
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-2xl font-bold text-foreground mb-4">אין תיק פעיל</h2>
        <p className="text-muted-foreground mb-6">פתח תיק חדש כדי להתחיל</p>
        <Link to="/intake"><Button variant="cta" size="lg">פתח תיק חדש</Button></Link>
      </div>
    );
  }

  const intakeData = (caseData.intake_data || {}) as Record<string, any>;
  const stepKeys = DASHBOARD_STEPS.map(s => s.key).filter(k => k !== "payment");
  const completedSteps = stepKeys.filter(key => {
    const d = intakeData[key];
    return d && Object.keys(d).length > 0;
  });
  const progress = Math.round((completedSteps.length / stepKeys.length) * 100);
  const remainingSteps = stepKeys.length - completedSteps.length;

  // Monthly loss calc
  const savingsMain = Number(intakeData.calculator?.display_savings_main || intakeData.property?.requestedMortgage * 0.08 || 80000);
  const monthlyLoss = Math.round(savingsMain / 120);

  // Risk score
  const riskScore = Number(intakeData.calculator?.risk_score || 50);

  // First 5 steps must be done to unlock 6-8
  const firstGroupDone = DASHBOARD_STEPS.filter(s => s.group === 1).every(s => {
    const d = intakeData[s.key];
    return d && Object.keys(d).length > 0;
  });

  const requiredDocTypes = ["id_card", "payslips", "bank_statements", "purchase_contract"];
  const allRequiredDocsUploaded = requiredDocTypes.every(t => uploadedDocTypes.includes(t));
  const canPay = progress >= 85 && allRequiredDocsUploaded;

  const getStepStatus = (step: typeof DASHBOARD_STEPS[0]): "done" | "current" | "locked" => {
    if (step.key === "payment") return canPay ? "current" : "locked";
    const d = intakeData[step.key];
    if (d && Object.keys(d).length > 0) return "done";
    // Group 2 locked until group 1 done
    if (step.group === 2 && !firstGroupDone) return "locked";
    // Find first incomplete in same group
    const groupSteps = DASHBOARD_STEPS.filter(s => s.group === step.group);
    const firstIncomplete = groupSteps.find(s => {
      const sd = intakeData[s.key];
      return !sd || Object.keys(sd).length === 0;
    });
    if (step.key === firstIncomplete?.key) return "current";
    const si = groupSteps.indexOf(step);
    const fi = firstIncomplete ? groupSteps.indexOf(firstIncomplete) : groupSteps.length;
    return si <= fi ? "current" : "locked";
  };

  // Missing items
  const missingItems: string[] = [];
  if (!intakeData.personal || Object.keys(intakeData.personal).length === 0) missingItems.push("פרטים אישיים");
  if (!intakeData.property || Object.keys(intakeData.property).length === 0) missingItems.push("פרטי נכס");
  if (!intakeData.income || Object.keys(intakeData.income).length === 0) missingItems.push("הכנסות");
  if (!intakeData.liabilities || Object.keys(intakeData.liabilities).length === 0) missingItems.push("התחייבויות");
  if (!intakeData.mortgage_request || Object.keys(intakeData.mortgage_request).length === 0) missingItems.push("פרטי משכנתא");
  if (!intakeData.declarations || Object.keys(intakeData.declarations).length === 0) missingItems.push("הצהרות");
  const missingDocs = requiredDocTypes.filter(t => !uploadedDocTypes.includes(t));
  const docLabels: Record<string, string> = { id_card: "ת\"ז + ספח", payslips: "תלושי שכר", bank_statements: "דפי עו\"ש", purchase_contract: "חוזה רכישה" };
  missingDocs.forEach(d => missingItems.push(docLabels[d] || d));

  const currentStatusOrder = CASE_STATUSES[caseData.status]?.order ?? 0;
  const estMinutes = Math.max(3, Math.ceil((100 - progress) / 12.5));

  return (
    <div className="space-y-6">
      {/* Risk-based urgency banner */}
      {riskScore > 75 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <Flame size={20} className="text-destructive shrink-0" />
          <div>
            <p className="text-sm font-bold text-destructive">זוהתה רמת חשיפה גבוהה מהממוצע</p>
            <p className="text-xs text-destructive/80">מומלץ להשלים את התיק היום</p>
          </div>
        </motion.div>
      )}
      {riskScore >= 55 && riskScore <= 75 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-xl p-4">
          <TrendingDown size={20} className="text-warning shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">זוהתה הזדמנות חיסכון משמעותית</p>
            <p className="text-xs text-warning/80">כדאי להשלים כדי לקבל מספרים מדויקים</p>
          </div>
        </motion.div>
      )}

      {/* Cost of waiting card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-destructive/20 bg-gradient-to-l from-destructive/5 to-card overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flame size={22} className="text-destructive" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">המתנה עולה כסף</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              כל חודש שאתה מחכה אתה עלול לשלם כ-<span className="text-destructive font-bold text-base">₪{monthlyLoss.toLocaleString()}</span> מיותר
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock size={12} />
              זמן ניתוח מובטח: <span className="text-primary font-semibold">48 שעות</span> מרגע שהתיק מלא
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced progress */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">השלמת תיק: {progress}%</span>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{caseData.case_number}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              נשארו עוד <span className="text-foreground font-semibold">{remainingSteps} צעדים קצרים</span>
              {" · "}כ-{estMinutes} דקות
            </p>
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                יעד לפתיחת ניתוח: 85%
              </Badge>
              {progress < 50 && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle size={12} /> השלם את התיק כדי שנוכל להתחיל
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reward Strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {REWARD_MILESTONES.map((m) => {
            const reached = progress >= m.threshold;
            const Icon = m.icon;
            return (
              <div key={m.threshold} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium whitespace-nowrap transition-all ${
                reached ? "bg-card border-primary/30 shadow-[var(--shadow-gold)]" : "bg-muted/30 border-border opacity-50"
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${reached ? "bg-primary/10" : "bg-muted"}`}>
                  {reached ? <Icon size={16} className={m.color} /> : <Lock size={14} className="text-muted-foreground" />}
                </div>
                <div>
                  <span className={`block font-bold ${reached ? "text-foreground" : "text-muted-foreground"}`}>{m.threshold}%</span>
                  <span className="text-muted-foreground text-[10px]">{m.label}</span>
                </div>
                {reached && <CheckCircle2 size={14} className="text-primary ml-1" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DASHBOARD_STEPS.map((step, i) => {
          const status = getStepStatus(step);
          const Icon = step.icon;
          const isLockedGroup2 = step.group === 2 && !firstGroupDone;
          // Find the blocking step name
          const blockingStep = isLockedGroup2 ? DASHBOARD_STEPS.filter(s => s.group === 1).find(s => {
            const d = intakeData[s.key]; return !d || Object.keys(d).length === 0;
          }) : null;

          return (
            <motion.div key={step.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={status === "locked" ? "#" : step.href} className={status === "locked" ? "pointer-events-none" : ""}>
                <Card className={`transition-all hover:shadow-card-hover ${
                  status === "done" ? "border-primary/30" :
                  status === "current" ? "border-[hsl(var(--gold))]/30 shadow-[var(--shadow-gold)]" :
                  "opacity-40"
                }`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      status === "done" ? "bg-primary/10" : status === "current" ? "bg-[hsl(var(--gold))]/10" : "bg-muted"
                    }`}>
                      {status === "done" ? <CheckCircle2 size={18} className="text-primary" /> :
                       status === "current" ? <Icon size={18} className="text-[hsl(var(--gold))]" /> :
                       <Lock size={16} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground text-sm">{step.label}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {status === "done" ? "✔ הושלם" :
                         status === "current" ? "⏳ בתהליך" :
                         blockingStep ? `נפתח אחרי ${blockingStep.label}` : "🔒 נעול"}
                      </p>
                    </div>
                    {status !== "locked" && <ArrowLeft size={14} className="text-muted-foreground shrink-0" />}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Missing items checklist */}
      {missingItems.length > 0 && progress > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-warning/20">
            <CardContent className="p-5">
              <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <Target size={16} className="text-warning" />
                מה חסר כדי לפתוח ניתוח:
              </h3>
              <div className="space-y-2">
                {missingItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              {missingItems.length <= 3 && (
                <p className="text-xs text-primary font-medium mt-3">🎯 כמעט שם! עוד מעט מסיימים</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment CTA */}
      {canPay && !caseData.payment_succeeded && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/30 shadow-[var(--shadow-gold)] bg-gradient-to-l from-card to-primary/5">
            <CardContent className="p-6 text-center">
              <Trophy size={28} className="text-primary mx-auto mb-2" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">התיק מוכן לניתוח! 🎉</h3>
              <p className="text-muted-foreground mb-4 text-sm">פתח ניתוח תוך 48 שעות</p>
              <Link to="/dashboard/payment">
                <Button variant="cta" size="lg" className="text-base">
                  <Zap size={18} /> פתח ניתוח תוך 48 שעות – ₪3,800
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Draft resume banner */}
      {caseData.status === "Draft" && progress > 0 && progress < 100 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock size={20} className="text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">יש לך תיק פתוח שהושלם ב-{progress}%</p>
              <p className="text-xs text-muted-foreground">המשך מאיפה שעצרת · כ-{estMinutes} דקות</p>
            </div>
            {(() => {
              const firstIncomplete = DASHBOARD_STEPS.find(s => s.key !== "payment" && getStepStatus(s) === "current");
              return (
                <Link to={firstIncomplete?.href || "/dashboard/personal"}>
                  <Button variant="cta" size="sm">המשך השלמה <ArrowLeft size={14} /></Button>
                </Link>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
