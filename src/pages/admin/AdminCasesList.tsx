import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAdminCases } from "@/hooks/useAdminCases";
import { CASE_STATUSES, CaseStatus, STATUS_OPTIONS } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ChevronLeft } from "lucide-react";

export default function AdminCasesList() {
  const { cases, loading } = useAdminCases();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        !search ||
        c.client_name.includes(search) ||
        c.case_number.includes(search) ||
        (c.client_email || "").includes(search) ||
        (c.client_phone || "").includes(search);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cases, search, statusFilter]);

  const getSLAClass = (c: typeof cases[0]) => {
    if (c.status === "ClosedWon" || c.status === "ClosedLost") return "";
    if (c.sla_due_at) {
      return new Date(c.sla_due_at) < new Date() ? "text-destructive font-bold" : "text-muted-foreground";
    }
    const hours = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return "text-destructive font-bold";
    if (hours > 36) return "text-warning font-bold";
    return "text-muted-foreground";
  };

  const getTimeLabel = (c: typeof cases[0]) => {
    const ref = c.sla_started_at || c.created_at;
    const hours = Math.round((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "פחות משעה";
    if (hours < 24) return `${hours} שעות`;
    return `${Math.floor(hours / 24)} ימים`;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-black text-foreground mb-2">ניהול תיקים</h1>
        <p className="text-muted-foreground mb-6">
          {cases.length} תיקים | SLA: 48 שעות
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, מזהה, אימייל או טלפון..."
            className="w-full h-11 pr-10 pl-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "all")}
            className="h-11 pr-10 pl-4 rounded-lg border border-input bg-background text-foreground text-sm appearance-none min-w-[180px]"
          >
            <option value="all">כל הסטטוסים</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div
        className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מזהה</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">שם לקוח</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">סוג</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">סטטוס</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">SLA</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">מסמכים</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const status = CASE_STATUSES[c.status];
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.case_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{c.client_name}</div>
                      <div className="text-xs text-muted-foreground">{c.client_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {c.case_type === "refi" ? "מיחזור" : "חדשה"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${getSLAClass(c)}`}>
                      {getTimeLabel(c)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-gradient rounded-full"
                            style={{ width: `${c.docs_total > 0 ? (c.docs_uploaded / c.docs_total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{c.docs_uploaded}/{c.docs_total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-gold font-semibold hover:underline"
                      >
                        פתח
                        <ChevronLeft size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((c) => {
            const status = CASE_STATUSES[c.status];
            return (
              <Link
                key={c.id}
                to={`/admin/cases/${c.id}`}
                className="block p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{c.client_name}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{c.case_number}</span>
                  <span className={getSLAClass(c)}>{getTimeLabel(c)}</span>
                  <span>מסמכים: {c.docs_uploaded}/{c.docs_total}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            לא נמצאו תיקים תואמים
          </div>
        )}
      </motion.div>
    </div>
  );
}
