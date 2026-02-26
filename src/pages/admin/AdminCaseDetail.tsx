import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { MOCK_CASES, MockCase } from "@/data/mockCases";
import { CASE_STATUSES, CaseStatus, STATUS_OPTIONS, BANK_EMAIL_TEMPLATE } from "@/types/admin";
import { Button } from "@/components/ui/button";
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
  Shield,
  Clock,
  Upload,
  MessageSquare,
} from "lucide-react";

export default function AdminCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const foundCase = MOCK_CASES.find((c) => c.id === id);
  const [caseData, setCaseData] = useState<MockCase | undefined>(foundCase);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [bankEmailTo, setBankEmailTo] = useState("mortgage@bank.co.il");

  if (!caseData) {
    return (
      <div className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">תיק לא נמצא</h1>
        <Link to="/admin/cases" className="text-gold hover:underline">חזרה לרשימה</Link>
      </div>
    );
  }

  const status = CASE_STATUSES[caseData.status];

  const handleStatusChange = (newStatus: CaseStatus) => {
    setCaseData((prev) => prev ? { ...prev, status: newStatus } : prev);
    toast({
      title: "סטטוס עודכן",
      description: `הסטטוס שונה ל: ${CASE_STATUSES[newStatus].label}`,
    });
  };

  const handleGenerateMixes = () => {
    setCaseData((prev) => prev ? { ...prev, mixesGenerated: true, status: "mixes_ready" as CaseStatus } : prev);
    toast({
      title: "תמהילים נוצרו בהצלחה! ✅",
      description: "3 תמהילים (שמרני, מאוזן, אגרסיבי) נוצרו עבור הלקוח.",
    });
  };

  const handleGenerateReport = () => {
    setCaseData((prev) => prev ? { ...prev, reportGenerated: true } : prev);
    toast({
      title: "דוח PDF הופק בהצלחה! 📄",
      description: "הדוח מוכן להורדה ולשליחה.",
    });
  };

  const handleSendToBank = () => {
    setShowEmailModal(true);
  };

  const confirmSendToBank = () => {
    setCaseData((prev) =>
      prev ? { ...prev, sentToBank: true, status: "sent_to_banks" as CaseStatus, bankName: bankEmailTo } : prev
    );
    setShowEmailModal(false);
    toast({
      title: "נשלח לבנק בהצלחה! 📧",
      description: `המייל נשלח ל-${bankEmailTo}`,
    });
  };

  const emailContent = BANK_EMAIL_TEMPLATE
    .replace("{{clientName}}", caseData.clientName)
    .replace("{{mortgageAmount}}", caseData.mortgageAmount.toLocaleString())
    .replace("{{income}}", caseData.income.toLocaleString())
    .replace("{{goal}}", caseData.goal)
    .replace("{{riskLevel}}", caseData.riskLevel);

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
            <h1 className="font-display text-3xl font-black text-foreground">{caseData.clientName}</h1>
            <p className="text-sm text-muted-foreground font-mono">{caseData.id}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${status.color}`}>
            {status.label}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={18} className="text-gold" />
              פרטי לקוח
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={User} label="שם" value={caseData.clientName} />
              <InfoRow icon={Phone} label="טלפון" value={caseData.phone} />
              <InfoRow icon={Mail} label="אימייל" value={caseData.email} />
              <InfoRow icon={Banknote} label="סכום משכנתא" value={`₪${caseData.mortgageAmount.toLocaleString()}`} />
              <InfoRow icon={Target} label="יעד" value={caseData.goal} />
              <InfoRow icon={Shield} label="רמת סיכון" value={caseData.riskLevel} />
              <InfoRow icon={Banknote} label="הכנסה נטו" value={`₪${caseData.income.toLocaleString()}`} />
              <InfoRow icon={Clock} label="נוצר" value={new Date(caseData.createdAt).toLocaleDateString("he-IL")} />
            </div>
            {caseData.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                  <MessageSquare size={14} />
                  הערות
                </div>
                <p className="text-sm text-muted-foreground">{caseData.notes}</p>
              </div>
            )}
          </motion.div>

          {/* Documents */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={18} className="text-gold" />
              מסמכים
            </h2>
            <div className="space-y-2">
              {caseData.documents.map((doc) => (
                <div
                  key={doc.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    doc.uploaded ? "bg-success/5" : "bg-warning/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {doc.uploaded ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : (
                      <XCircle size={18} className="text-warning" />
                    )}
                    <span className="text-sm text-foreground">{doc.name}</span>
                  </div>
                  {doc.uploaded ? (
                    <button className="text-xs text-gold font-semibold hover:underline flex items-center gap-1">
                      <Download size={14} />
                      הורדה
                    </button>
                  ) : (
                    <span className="text-xs text-warning font-semibold">חסר</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bank Offer */}
          {caseData.bankOffer && (
            <motion.div
              className="bg-success/5 rounded-xl p-6 shadow-card border border-success/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="font-display text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <Banknote size={18} className="text-success" />
                הצעת בנק שהתקבלה
              </h2>
              <p className="text-sm text-foreground mb-1">{caseData.bankName}</p>
              <p className="text-sm text-muted-foreground">{caseData.bankOffer}</p>
            </motion.div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Status Change */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
            <p className="text-xs text-muted-foreground">
              שינוי סטטוס ישלח Webhook ל-CRM אוטומטית.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-card border border-border space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground mb-2">פעולות</h2>

            <Button
              variant="cta"
              className="w-full justify-start gap-3"
              onClick={handleGenerateMixes}
              disabled={caseData.mixesGenerated}
            >
              <Target size={18} />
              {caseData.mixesGenerated ? "תמהילים נוצרו ✅" : "צור תמהילים"}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleGenerateReport}
              disabled={!caseData.mixesGenerated || caseData.reportGenerated}
            >
              <FileText size={18} />
              {caseData.reportGenerated ? "דוח הופק ✅" : "הפק דוח PDF"}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleSendToBank}
              disabled={!caseData.reportGenerated || caseData.sentToBank}
            >
              <Send size={18} />
              {caseData.sentToBank ? `נשלח ל: ${caseData.bankName} ✅` : "שלח לבנק"}
            </Button>

            {caseData.reportGenerated && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-gold"
              >
                <Download size={18} />
                הורד דוח PDF
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Upload size={18} />
              העלה הצעת בנק
            </Button>
          </motion.div>

          {/* SLA */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock size={18} />
              SLA
            </h2>
            <SLAIndicator createdAt={caseData.createdAt} status={caseData.status} />
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

function SLAIndicator({ createdAt, status }: { createdAt: string; status: CaseStatus }) {
  const hours = Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  const isCompleted = status === "completed" || status === "offer_received";
  const pct = isCompleted ? 100 : Math.min(100, (hours / 48) * 100);

  const barColor = isCompleted
    ? "bg-success"
    : pct > 90
    ? "bg-destructive"
    : pct > 75
    ? "bg-warning"
    : "bg-gold";

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted-foreground">{isCompleted ? "הושלם" : `${hours} שעות`}</span>
        <span className="text-muted-foreground">48 שעות</span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {!isCompleted && pct > 75 && (
        <p className="text-xs text-destructive mt-2 font-semibold">⚠️ חריגה מ-SLA!</p>
      )}
    </div>
  );
}
