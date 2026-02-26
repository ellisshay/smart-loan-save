import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CASE_STATUSES, CaseStatus, STATUS_OPTIONS, BANK_EMAIL_TEMPLATE } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  ArrowRight,
  FileText,
  Send,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Phone,
  Banknote,
  Target,
  Clock,
  MessageSquare,
  FolderOpen,
} from "lucide-react";

interface CaseDetail {
  id: string;
  case_number: string;
  case_type: "new" | "refi";
  status: CaseStatus;
  goal: string | null;
  intake_complete: boolean;
  payment_succeeded: boolean;
  created_at: string;
  updated_at: string;
  selected_mix: string | null;
  sla_started_at: string | null;
  sla_due_at: string | null;
  intake_data: Record<string, any>;
  user_id: string;
}

interface DocRow {
  id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export default function AdminCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; email: string | null; phone: string | null } | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [bankEmailTo, setBankEmailTo] = useState("mortgage@bank.co.il");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) { navigate("/"); return; }

      const { data: c } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id!)
        .single();

      if (!c) { setLoading(false); return; }

      setCaseData({
        ...c,
        status: c.status as CaseStatus,
        intake_data: (c.intake_data as Record<string, any>) || {},
      });

      // Profile
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone")
        .eq("user_id", c.user_id)
        .single();
      setProfile(p);

      // Documents
      const { data: d } = await supabase
        .from("case_documents")
        .select("id, doc_type, file_name, file_path, uploaded_at")
        .eq("case_id", c.id);
      setDocs(d || []);

      setLoading(false);
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">תיק לא נמצא</h1>
        <Link to="/admin/cases" className="text-gold hover:underline">חזרה לרשימה</Link>
      </div>
    );
  }

  const clientName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "ללא שם"
    : "ללא שם";

  const status = CASE_STATUSES[caseData.status];
  const intake = caseData.intake_data;

  const handleStatusChange = async (newStatus: CaseStatus) => {
    const { error } = await supabase
      .from("cases")
      .update({ status: newStatus })
      .eq("id", caseData.id);

    if (!error) {
      setCaseData(prev => prev ? { ...prev, status: newStatus } : prev);
      toast({ title: "סטטוס עודכן", description: `הסטטוס שונה ל: ${CASE_STATUSES[newStatus].label}` });
    }
  };

  const handleDownloadDoc = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const confirmSendToBank = () => {
    handleStatusChange("SentToBank");
    setShowEmailModal(false);
    toast({ title: "נשלח לבנק בהצלחה! 📧", description: `המייל נשלח ל-${bankEmailTo}` });
  };

  const mortgageAmount = intake.mortgageAmount || intake.propertyValue || 0;
  const income = intake.monthlyIncome || 0;

  const emailContent = BANK_EMAIL_TEMPLATE
    .replace("{{clientName}}", clientName)
    .replace("{{mortgageAmount}}", Number(mortgageAmount).toLocaleString())
    .replace("{{income}}", Number(income).toLocaleString())
    .replace("{{goal}}", caseData.goal || "")
    .replace("{{riskLevel}}", intake.riskLevel || "מאוזן");

  const requiredDocs = ["דוח יתרות", "תלושי שכר", "תעודת זהות", "אישור הכנסות"];
  const uploadedDocTypes = new Set(docs.map(d => d.doc_type));

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/admin/cases" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowRight size={16} />
          חזרה לרשימת תיקים
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground">{clientName}</h1>
            <p className="text-sm text-muted-foreground font-mono">{caseData.case_number}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${status.color}`}>
            {status.label}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details */}
          <motion.div className="bg-card rounded-xl p-6 shadow-card border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={18} className="text-gold" />
              פרטי לקוח
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User} label="שם" value={clientName} />
              <InfoRow icon={Phone} label="טלפון" value={profile?.phone || "—"} />
              <InfoRow icon={Mail} label="אימייל" value={profile?.email || "—"} />
              <InfoRow icon={Target} label="יעד" value={caseData.goal || "—"} />
              <InfoRow icon={FolderOpen} label="סוג תיק" value={caseData.case_type === "refi" ? "מיחזור משכנתא" : "משכנתא חדשה"} />
              <InfoRow icon={Clock} label="נוצר" value={new Date(caseData.created_at).toLocaleDateString("he-IL")} />
              {mortgageAmount > 0 && (
                <InfoRow icon={Banknote} label="סכום משכנתא" value={`₪${Number(mortgageAmount).toLocaleString()}`} />
              )}
              {income > 0 && (
                <InfoRow icon={Banknote} label="הכנסה חודשית" value={`₪${Number(income).toLocaleString()}`} />
              )}
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div className="bg-card rounded-xl p-6 shadow-card border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={18} className="text-gold" />
              מסמכים ({docs.length})
            </h2>

            {/* Uploaded docs */}
            {docs.length > 0 && (
              <div className="space-y-2 mb-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-success" />
                      <div>
                        <span className="text-sm text-foreground">{doc.file_name}</span>
                        <span className="text-xs text-muted-foreground mr-2">({doc.doc_type})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDoc(doc.file_path)}
                      className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
                    >
                      <Download size={14} />
                      הורדה
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Missing required docs */}
            {requiredDocs.filter(d => !uploadedDocTypes.has(d)).map(docName => (
              <div key={docName} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 mb-2">
                <div className="flex items-center gap-3">
                  <XCircle size={18} className="text-warning" />
                  <span className="text-sm text-foreground">{docName}</span>
                </div>
                <span className="text-xs text-warning font-semibold">חסר</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Status Change */}
          <motion.div className="bg-card rounded-xl p-6 shadow-card border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display text-lg font-bold text-foreground mb-4">שינוי סטטוס</h2>
            <select
              value={caseData.status}
              onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
              className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm mb-3"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </motion.div>

          {/* Actions */}
          <motion.div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="font-display text-lg font-bold text-foreground mb-2">פעולות</h2>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => setShowEmailModal(true)}
              disabled={caseData.status === "SentToBank" || caseData.status === "ClosedWon"}
            >
              <Send size={18} />
              שלח לבנק
            </Button>
          </motion.div>

          {/* SLA */}
          <motion.div className="bg-card rounded-xl p-6 shadow-card border border-border" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock size={18} />
              SLA
            </h2>
            <SLAIndicator
              startedAt={caseData.sla_started_at}
              dueAt={caseData.sla_due_at}
              createdAt={caseData.created_at}
              status={caseData.status}
            />
          </motion.div>
        </div>
      </div>

      {/* Bank Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <motion.div
            className="bg-card rounded-2xl p-6 shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Mail size={20} className="text-gold" />
              שליחת מייל לבנק
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">כתובת אימייל בנק</label>
              <input
                type="email"
                value={bankEmailTo}
                onChange={(e) => setBankEmailTo(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">תוכן המייל</label>
              <div className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                {emailContent}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="cta" onClick={confirmSendToBank} className="flex-1">
                <Send size={16} />
                שלח מייל
              </Button>
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                ביטול
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground shrink-0" />
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function SLAIndicator({ startedAt, dueAt, createdAt, status }: { startedAt: string | null; dueAt: string | null; createdAt: string; status: CaseStatus }) {
  const isCompleted = status === "ClosedWon" || status === "ClosedLost";

  if (dueAt && startedAt) {
    const total = new Date(dueAt).getTime() - new Date(startedAt).getTime();
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const pct = isCompleted ? 100 : Math.min(100, (elapsed / total) * 100);
    const hoursLeft = Math.max(0, Math.round((new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60)));

    const barColor = isCompleted ? "bg-success" : pct > 90 ? "bg-destructive" : pct > 75 ? "bg-warning" : "bg-gold";

    return (
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">{isCompleted ? "הושלם" : `${hoursLeft} שעות נותרו`}</span>
          <span className="text-muted-foreground">48 שעות</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        {!isCompleted && pct > 90 && (
          <p className="text-xs text-destructive mt-2 font-semibold">⚠️ חריגה מ-SLA!</p>
        )}
      </div>
    );
  }

  // Fallback: no SLA started yet
  const hours = Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  return (
    <div className="text-sm text-muted-foreground">
      SLA טרם התחיל • תיק נפתח לפני {hours < 24 ? `${hours} שעות` : `${Math.floor(hours / 24)} ימים`}
    </div>
  );
}
