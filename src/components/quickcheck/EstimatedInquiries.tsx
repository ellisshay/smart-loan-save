import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount } from "@/lib/quickCheckContact";

type Inquiry = { id: string; created_at: string; name: string; phone: string; goal: string; loan: number };

export default function EstimatedInquiries() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    supabase.from("quiz_sessions").select("id,created_at,quiz_data").eq("quiz_data->>inquiry_status", "estimated").order("created_at", { ascending: false }).limit(100).then(({ data, error }) => {
      if (!live) return;
      setError(!!error);
      setRows((data || []).map((row) => {
        const payload = row.quiz_data as { quick_check?: { firstName?: string; phone?: string; goal?: string; value?: number; equity?: number; balance?: number } };
        const a = payload.quick_check || {};
        return { id: row.id, created_at: row.created_at || "", name: a.firstName || "", phone: a.phone || "", goal: a.goal === "refi" ? "מחזור" : "רכישה", loan: a.goal === "refi" ? a.balance || 0 : Math.max(0, (a.value || 0) - (a.equity || 0)) };
      }));
    });
    return () => { live = false; };
  }, []);
  return <section className="mt-8 space-y-4">
    <h2 className="font-display text-xl font-bold text-foreground">פניות מהבדיקה המהירה</h2>
    <p className="text-sm text-muted-foreground">לידים משוערים · טרם הושלמה בקשה מלאה</p>
    {error ? <p role="alert" className="text-destructive">לא הצלחנו לטעון את הפניות</p> : rows.length === 0 ? <p className="text-muted-foreground">אין פניות עדיין</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-right">
      <thead><tr className="border-b border-border text-muted-foreground">{["שם", "טלפון", "מטרה", "משכנתא משוערת", "תאריך"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-border text-foreground"><td className="p-3">{r.name}</td><td className="p-3"><a href={`tel:${r.phone}`} dir="ltr" className="text-primary underline">{r.phone}</a></td><td className="p-3">{r.goal}</td><td className="p-3">₪{formatAmount(r.loan)}</td><td className="p-3">{new Date(r.created_at).toLocaleDateString("he-IL")}</td></tr>)}</tbody>
    </table></div>}
  </section>;
}