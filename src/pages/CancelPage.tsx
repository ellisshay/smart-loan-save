import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  const [f, setF] = useState({ full_name: "", contact: "", case_number: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const input = "w-full h-11 rounded-lg border border-input bg-background px-3 text-sm";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.full_name.trim().length < 2 || f.contact.trim().length < 5) return setErr("נא למלא שם מלא וטלפון או מייל");
    setBusy(true); setErr("");
    const { data, error } = await supabase.functions.invoke("cancel-request", { body: f });
    setBusy(false);
    if (error || !data?.ok) return setErr(data?.error || "השליחה נכשלה, נסו שוב או פנו אלינו בטלפון");
    setDone(new Date(data.created_at).toLocaleString("he-IL"));
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-xl space-y-6">
        <h1 className="font-display text-3xl md:text-4xl font-black text-foreground">ביטול עסקה</h1>
        <p className="text-muted-foreground leading-relaxed">
          ניתן לבטל את העסקה בהתאם לחוק הגנת הצרכן ולסעיף הביטול בתנאי השימוש. מלאו את הטופס ונחזור אליכם. אין צורך במספר תעודת זהות.
        </p>
        {done ? (
          <div role="status" className="bg-card border border-primary/40 rounded-2xl p-6 space-y-2">
            <h2 className="font-display text-xl font-bold text-foreground">בקשת הביטול התקבלה</h2>
            <p className="text-sm text-muted-foreground">התקבלה ב-{done}. אם מסרתם מייל, נשלח אליו אישור.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <label className="block text-sm text-foreground">שם מלא *<input className={input} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></label>
            <label className="block text-sm text-foreground">טלפון או מייל *<input className={input} dir="ltr" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></label>
            <label className="block text-sm text-foreground">מספר תיק (לא חובה)<input className={input} dir="ltr" value={f.case_number} onChange={(e) => setF({ ...f, case_number: e.target.value })} /></label>
            <label className="block text-sm text-foreground">סיבה (לא חובה)<textarea className={`${input} h-24 py-2`} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></label>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <Button type="submit" variant="cta" disabled={busy}>{busy ? "שולח..." : "שליחת בקשת ביטול"}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
