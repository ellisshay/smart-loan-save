import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Clock,
  ArrowLeft,
  FolderOpen,
  Plus,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CaseRow {
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
}

export default function MyCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserName([profile.first_name, profile.last_name].filter(Boolean).join(" "));
      }

      const { data, error } = await supabase
        .from("cases")
        .select("id, case_number, case_type, status, goal, intake_complete, payment_succeeded, created_at, updated_at, selected_mix")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCases(data as CaseRow[]);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const statusInfo = (status: CaseStatus) => {
    const s = CASE_STATUSES[status];
    return s || { label: status, color: "bg-muted text-muted-foreground" };
  };

  const canDownloadReport = (status: CaseStatus) => {
    const order = CASE_STATUSES[status]?.order ?? 0;
    return order >= 5; // ReportGenerated and beyond
  };

  const handleDownloadReport = async (caseId: string, caseNumber: string) => {
    // Check for report file in storage
    const { data } = await supabase.storage
      .from("case-documents")
      .list(`${caseId}/reports`);

    if (data && data.length > 0) {
      const { data: urlData } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(`${caseId}/reports/${data[0].name}`, 3600);

      if (urlData?.signedUrl) {
        window.open(urlData.signedUrl, "_blank");
        return;
      }
    }

    // Fallback: no report yet
    alert("הדוח עדיין לא זמין להורדה. נעדכן אותך כשהוא יהיה מוכן.");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

  const getStatusIcon = (status: CaseStatus) => {
    const order = CASE_STATUSES[status]?.order ?? 0;
    if (order >= 10) return <CheckCircle2 className="h-4 w-4" />;
    if (order >= 5) return <FileText className="h-4 w-4" />;
    if (order >= 3) return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center">
              <span className="font-display font-black text-accent-foreground text-sm">EM</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">EasyMorte</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/intake">
              <Button variant="cta" size="sm">
                <Plus className="h-4 w-4" />
                תיק חדש
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-10 max-w-4xl">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            {userName ? `שלום, ${userName}` : "אזור אישי"}
          </h1>
          <p className="text-muted-foreground">כאן תוכל/י לעקוב אחרי כל התיקים שלך</p>
        </motion.div>

        {/* Cases list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center py-16">
              <CardContent>
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                  אין תיקים עדיין
                </h2>
                <p className="text-muted-foreground mb-6">
                  פתח תיק חדש כדי להתחיל בתהליך
                </p>
                <Link to="/intake">
                  <Button variant="cta" size="lg">
                    <Plus className="h-5 w-5" />
                    פתח תיק חדש
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {cases.map((c, i) => {
              const info = statusInfo(c.status);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Case info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-display font-bold text-lg text-foreground">
                              {c.case_number}
                            </h3>
                            <Badge className={info.color}>
                              {getStatusIcon(c.status)}
                              <span className="mr-1">{info.label}</span>
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {c.case_type === "refi" ? "מיחזור משכנתא" : "משכנתא חדשה"}
                            </span>
                            {c.goal && <span>• {c.goal}</span>}
                            <span>• נוצר: {formatDate(c.created_at)}</span>
                          </div>

                          {/* Progress indicators */}
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${c.intake_complete ? "text-success" : "text-muted-foreground"}`}>
                              {c.intake_complete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              טופס קליטה
                            </span>
                            <span className={`flex items-center gap-1 ${c.payment_succeeded ? "text-success" : "text-muted-foreground"}`}>
                              {c.payment_succeeded ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              תשלום
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {canDownloadReport(c.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(c.id, c.case_number)}
                            >
                              <Download className="h-4 w-4" />
                              הורד דוח
                            </Button>
                          )}

                          {c.selected_mix === null && canDownloadReport(c.status) && (
                            <Link to={`/mix-selection/${c.id}`}>
                              <Button variant="cta" size="sm">
                                בחר תמהיל
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}

                          {!c.intake_complete && (
                            <Link to={`/intake?caseId=${c.id}`}>
                              <Button variant="cta" size="sm">
                                המשך מילוי
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
