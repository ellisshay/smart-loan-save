import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAdminCases } from "@/hooks/useAdminCases";
import { CASE_STATUSES, CaseStatus } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboard() {
  const { cases, loading } = useAdminCases();

  const statusCounts = Object.keys(CASE_STATUSES).reduce((acc, key) => {
    acc[key as CaseStatus] = cases.filter((c) => c.status === key).length;
    return acc;
  }, {} as Record<CaseStatus, number>);

  const totalCases = cases.length;

  const urgentCases = cases.filter((c) => {
    if (c.sla_due_at) {
      return new Date(c.sla_due_at) < new Date() && c.status !== "ClosedWon" && c.status !== "ClosedLost";
    }
    const created = new Date(c.created_at);
    const hours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return hours > 36 && c.status !== "ClosedWon" && c.status !== "ClosedLost" && c.status !== "BankOfferReceived";
  }).length;

  const pendingDocs = statusCounts.WaitingForDocs || 0;
  const readyToSend = statusCounts.ReportGenerated || 0;

  const summaryCards = [
    { label: "סה״כ תיקים", value: totalCases, icon: Briefcase, color: "text-primary" },
    { label: "חורגים מ-SLA", value: urgentCases, icon: AlertTriangle, color: "text-destructive" },
    { label: "ממתינים למסמכים", value: pendingDocs, icon: Clock, color: "text-warning" },
    { label: "מוכנים לשליחה", value: readyToSend, icon: CheckCircle2, color: "text-success" },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-black text-foreground mb-2">לוח בקרה</h1>
        <p className="text-muted-foreground mb-8">סקירה כללית של התיקים הפעילים</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="bg-card rounded-xl p-5 shadow-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`${card.color}`}>
                <card.icon size={22} />
              </div>
            </div>
            <div className="font-display text-3xl font-black text-foreground">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Status Breakdown */}
      <motion.div
        className="bg-card rounded-xl p-6 shadow-card border border-border mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-xl font-bold text-foreground mb-4">פילוח לפי סטטוס</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(CASE_STATUSES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${val.color}`}>
                {statusCounts[key as CaseStatus] || 0}
              </span>
              <span className="text-sm text-foreground">{val.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Cases */}
      <motion.div
        className="bg-card rounded-xl p-6 shadow-card border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">תיקים אחרונים</h2>
          <Link to="/admin/cases" className="text-sm text-gold font-semibold hover:underline">
            צפה בכולם ←
          </Link>
        </div>
        {cases.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">אין תיקים עדיין</p>
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 5).map((c) => {
              const status = CASE_STATUSES[c.status];
              return (
                <Link
                  key={c.id}
                  to={`/admin/cases/${c.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <div className="font-semibold text-foreground">{c.client_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.case_number} • {c.case_type === "refi" ? "מיחזור" : "חדשה"}
                      {c.goal && ` • ${c.goal}`}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
