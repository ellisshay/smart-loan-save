import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CONTROLLER, hasConsent, recordConsent, logAudit } from "@/lib/privacy";

const TYPES = [
  { v: "access", l: "עיון במידע שלי" },
  { v: "correction", l: "תיקון מידע" },
  { v: "deletion", l: "מחיקת מידע" },
  { v: "revoke_consent", l: "ביטול הסכמה" },
];

export default function DashboardPrivacy() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [bankConsent, setBankConsent] = useState(false);
  const [bankChecked, setBankChecked] = useState(false);
  const [type, setType] = useState("access");
  const [details, setDetails] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);

  const load = async (uid: string) => {
    setBankConsent(await hasConsent(uid, "bank_data_transfer"));
    const [r, c] = await Promise.all([
      supabase.from("privacy_requests" as never).select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("consents" as never).select("*").eq("user_id", uid).order("consented_at", { ascending: false }),
    ]);
    setRequests((r.data as any[]) || []);
    setConsents((c.data as any[]) || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) { setUserId(user.id); load(user.id); } });
  }, []);

  const giveBank = async () => {
    if (!userId || !bankChecked) return;
    if (await recordConsent(userId, "bank_data_transfer")) { toast({ title: "ההסכמה נשמרה" }); load(userId); }
  };

  const submit = async () => {
    if (!userId) return;
    const { error } = await supabase.from("privacy_requests" as never).insert({ user_id: userId, request_type: type, details: details.slice(0, 2000) } as never);
    if (error) return toast({ title: "שגיאה בשליחה", variant: "destructive" });
    await logAudit("privacy_request_created", { objectType: "privacy_request", objectId: type });
    toast({ title: "הבקשה התקבלה", description: "נחזור אליך תוך 30 יום לכל היותר." });
    setDetails(""); load(userId);
  };

  const label = (t: string) => ({ privacy_notice: "הודעת פרטיות", bank_data_transfer: "העברה לגופים פיננסיים", automated_processing: "עיבוד אוטומטי" } as Record<string, string>)[t] || t;

  return (
    <div dir="rtl" className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">הפרטיות שלי</h1>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-foreground">הסכמה להעברת מידע לבנקים</h2>
        {bankConsent ? (
          <p className="text-sm text-primary">נתת הסכמה להעברת המידע לגופים פיננסיים.</p>
        ) : (
          <>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={bankChecked} onCheckedChange={(v) => setBankChecked(v === true)} className="mt-1" />
              <span className="text-sm text-foreground">אני מאשר/ת ל־EasyMorte להעביר את המידע והמסמכים הדרושים לגופים פיננסיים לצורך בדיקת וקבלת הצעות משכנתא.</span>
            </label>
            <Button variant="cta" disabled={!bankChecked} onClick={giveBank}>שמירת הסכמה</Button>
            <p className="text-xs text-muted-foreground">בלי הסכמה זו לא נעביר את התיק לאף בנק.</p>
          </>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-foreground">בקשת פרטיות</h2>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t.v} onClick={() => setType(t.v)} className={`px-3 py-1.5 rounded-full text-sm border ${type === t.v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{t.l}</button>
          ))}
        </div>
        <Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="פרט את הבקשה (לא חובה)" maxLength={2000} />
        <Button variant="cta" onClick={submit}>שליחת בקשה</Button>
        <p className="text-xs text-muted-foreground">בעל השליטה במידע: {CONTROLLER.name}, {CONTROLLER.businessId}. {CONTROLLER.email}. מחיקה עשויה להתעכב כשקיימת חובת שמירה על פי דין.</p>
        {requests.length > 0 && (
          <ul className="text-sm divide-y divide-border">
            {requests.map(r => <li key={r.id} className="py-2 flex justify-between"><span>{TYPES.find(t => t.v === r.request_type)?.l || r.request_type}</span><span className="text-muted-foreground">{r.status === "open" ? "בטיפול" : r.status === "done" ? "טופל" : r.status}</span></li>)}
          </ul>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-3">ההסכמות שנתתי</h2>
        <ul className="text-sm divide-y divide-border">
          {consents.map(c => <li key={c.id} className="py-2 flex justify-between"><span>{label(c.consent_type)} ({c.consent_version})</span><span className="text-muted-foreground">{new Date(c.consented_at).toLocaleString("he-IL")}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
