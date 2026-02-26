import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";

const TIMELINE: { status: CaseStatus; label: string; description: string }[] = [
  { status: "Draft", label: "פרטים התקבלו", description: "הטופס נשמר במערכת" },
  { status: "WaitingForPayment", label: "ממתין לתשלום", description: "יש לשלם כדי להתחיל" },
  { status: "PaymentSucceeded", label: "תשלום אושר", description: "התשלום התקבל בהצלחה" },
  { status: "WaitingForDocs", label: "מסמכים הועלו", description: "המסמכים נבדקים" },
  { status: "InAnalysis", label: "בניתוח", description: "הצוות שלנו עובד על התיק" },
  { status: "ReportGenerated", label: "בניית תמהילים", description: "התמהילים מוכנים" },
  { status: "SentToBank", label: "שליחה לבנקים", description: "התיק נשלח להצעות" },
  { status: "BankOfferReceived", label: "התקבלו הצעות", description: "הבנקים שלחו הצעות" },
  { status: "ClosedWon", label: "הסתיים", description: "התיק נסגר בהצלחה" },
];

export default function DashboardStatus() {
  const [currentStatus, setCurrentStatus] = useState<CaseStatus>("Draft");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cases")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) setCurrentStatus(data.status as CaseStatus);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const currentOrder = CASE_STATUSES[currentStatus]?.order ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">סטטוס התיק</h1>
      <Card>
        <CardContent className="p-8">
          {TIMELINE.map((item, i) => {
            const order = CASE_STATUSES[item.status]?.order ?? 0;
            const isDone = currentOrder > order;
            const isCurrent = currentStatus === item.status;
            return (
              <motion.div
                key={item.status}
                className="flex gap-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isDone ? "bg-primary border-primary" :
                    isCurrent ? "bg-gold border-gold animate-pulse" :
                    "bg-muted border-border"
                  }`}>
                    {isDone && <CheckCircle2 size={12} className="text-primary-foreground" />}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className={`w-0.5 h-10 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className={`text-sm font-bold ${
                    isDone ? "text-primary" : isCurrent ? "text-gold" : "text-muted-foreground"
                  }`}>
                    {isDone ? "✔ " : isCurrent ? "⏳ " : ""}{item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
