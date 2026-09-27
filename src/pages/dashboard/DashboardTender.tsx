import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Check, Landmark, Loader2 } from "lucide-react";
import { BANK_STATUSES, CLIENT_STEPS, CHECKLIST, OFFER_KINDS, stageToStep, nis, Track } from "@/lib/tender";

export default function DashboardTender() {
  const { caseId, loading: caseLoading } = useDashboardCase();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any>(null);
  const [dialog, setDialog] = useState<{ mode: "question" | "proceed"; offer: any; bank: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const load = async () => {
    if (!caseId) { setLoading(false); return; }
    const { data } = await (supabase as any).rpc("get_client_tender", { _case_id: caseId });
    setT(data); setLoading(false);
  };
  useEffect(() => { if (!caseLoading) load(); }, [caseId, caseLoading]);

  const submit = async () => {
    if (!dialog) return;
    setSending(true);
    const { error } = await (supabase as any).rpc("client_tender_action", { _offer_id: dialog.offer.id, _action: dialog.mode, _message: msg || null });
    if (error) { setSending(false); return toast({ title: "שגיאה", description: error.message, variant: "destructive" }); }
    supabase.functions.invoke("case-email", { body: { case_id: caseId, event: dialog.mode === "proceed" ? "tender_proceed" : "tender_question", message: `${dialog.bank}: ${msg}` } }).catch(console.error);
    setSending(false); setDone(true); load();
  };

  if (loading || caseLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  if (!t) return (
    <div className="card-surface p-8 text-center" dir="rtl">
      <h1 className="font-display text-2xl font-black mb-2">מכרז המשכנתא שלי</h1>
      <p className="text-muted-foreground">לאחר השלמת התיק והתשלום, היועץ שלכם יפתח מכרז מול 3 בנקים ותוכלו לעקוב כאן אחרי כל שלב.</p>
    </div>
  );

  const step = stageToStep(t.stage);
  const withOffers = t.banks.filter((b: any) => b.offers.length);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="font-display text-3xl font-black text-foreground">מכרז המשכנתא שלי</h1>
        <p className="text-muted-foreground">העברתם את הנתונים פעם אחת. אנחנו מטפלים מול הבנקים ואתם רואים בדיוק איפה הדברים עומדים.</p>
      </div>

      <div className="card-surface p-5">
        <ol className="grid grid-cols-3 md:grid-cols-9 gap-3">
          {CLIENT_STEPS.map((s, i) => (
            <li key={s} className="flex flex-col items-center text-center gap-1">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-primary text-primary-foreground" : i === step ? "ring-2 ring-primary text-primary bg-background" : "bg-muted text-muted-foreground"}`}>{i < step ? <Check size={14} /> : i + 1}</span>
              <span className={`text-xs ${i <= step ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {t.advisor_summary && <div className="card-surface p-5"><p className="text-sm font-semibold mb-1">עדכון מהיועץ שלכם</p><p className="text-sm text-muted-foreground whitespace-pre-line">{t.advisor_summary}</p></div>}

      <div className="grid md:grid-cols-3 gap-4">
        {t.banks.map((b: any) => {
          const o = b.offers[0];
          const st = BANK_STATUSES[b.status];
          return (
            <div key={b.slot} className={`card-surface p-5 space-y-3 ${o && o.id === t.selected_offer_id ? "ring-2 ring-primary" : ""}`}>
              <p className="font-display font-bold flex items-center gap-2"><Landmark size={18} className="text-primary" /> {b.bank_name || `בנק ${b.slot}`}</p>
              <p className="text-sm text-muted-foreground min-h-[40px]">{st.client}</p>
              {o ? (
                <>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <p className="text-xs text-muted-foreground">{OFFER_KINDS[o.kind]}</p>
                    <p>סכום: <b>{nis(o.total_amount)}</b></p>
                    <p>החזר חודשי התחלתי: <b>{nis(o.first_payment)}</b></p>
                    {o.valid_until && <p className="text-xs text-muted-foreground">בתוקף עד {new Date(o.valid_until).toLocaleDateString("he-IL")}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen({ ...o, bank: b.bank_name })}>צפייה במבנה המשכנתא</Button>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setMsg(""); setDone(false); setDialog({ mode: "question", offer: o, bank: b.bank_name }); }}>יש לי שאלה לגבי ההצעה</Button>
                  {!t.selected_offer_id && <Button size="sm" className="w-full" onClick={() => { setMsg(""); setDone(false); setDialog({ mode: "proceed", offer: o, bank: b.bank_name }); }}>אני רוצה להתקדם עם ההצעה</Button>}
                  {o.id === t.selected_offer_id && <p className="text-sm text-primary font-semibold text-center">בחרתם בהצעה זו</p>}
                </>
              ) : <p className="text-xs text-muted-foreground">ההצעה תוצג כאן לאחר אישור היועץ.</p>}
            </div>
          );
        })}
      </div>

      {withOffers.length > 1 && (
        <div className="card-surface p-5 overflow-x-auto">
          <h2 className="font-display text-lg font-bold mb-1">השוואה פשוטה</h2>
          <p className="text-xs text-muted-foreground mb-3">ההחזר הנמוך ביותר אינו בהכרח ההצעה המתאימה ביותר. היועץ שלכם יסביר את ההבדלים במבנה ובסיכון.</p>
          <table className="w-full text-sm">
            <thead><tr className="text-right bg-muted/60">{["בנק", "סכום", "החזר חודשי התחלתי", "מספר מסלולים", "תוקף"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>{withOffers.map((b: any) => { const o = b.offers[0]; return (
              <tr key={b.slot} className="border-b border-border"><td className="p-2 font-semibold">{b.bank_name}</td><td className="p-2">{nis(o.total_amount)}</td><td className="p-2">{nis(o.first_payment)}</td><td className="p-2">{o.tracks.length}</td><td className="p-2">{o.valid_until ? new Date(o.valid_until).toLocaleDateString("he-IL") : "-"}</td></tr>
            ); })}</tbody>
          </table>
        </div>
      )}

      {t.selected_offer_id && (
        <div className="card-surface p-5">
          <h2 className="font-display text-lg font-bold mb-3">מתקדמים לביצוע</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {t.checklist.map((c: any) => (
              <div key={c.step_key} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${c.done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c.done && <Check size={12} />}</span>
                <span className={c.done ? "" : "text-muted-foreground"}>{CHECKLIST[c.step_key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{open?.bank}: מבנה המשכנתא</DialogTitle><DialogDescription>{open && OFFER_KINDS[open.kind]}</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm">
            {open?.tracks.map((tr: Track, i: number) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{tr.type}</p>
                <p>{nis(tr.amount)} · ריבית {tr.rate}% ({tr.rate_type}) · {Math.round(tr.months / 12)} שנים · {tr.indexation}</p>
                <p className="text-muted-foreground">החזר התחלתי {nis(tr.first_payment)}</p>
              </div>
            ))}
            {open?.extra_costs && <p className="text-muted-foreground">{open.extra_costs}</p>}
            {open?.advisor_explanation && <p className="rounded-lg border border-primary/30 p-3"><b>הסבר היועץ: </b>{open.advisor_explanation}</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent dir="rtl">
          {done ? (
            <>
              <DialogHeader><DialogTitle>{dialog?.mode === "proceed" ? "הבקשה התקבלה" : "השאלה נשלחה"}</DialogTitle>
                <DialogDescription>{dialog?.mode === "proceed" ? "היועץ שלכם עודכן ויחזור אליכם לאישור הצעדים הבאים. שום דבר לא נחתם עדיין." : "היועץ שלכם יחזור אליכם בהקדם."}</DialogDescription></DialogHeader>
              <DialogFooter><Button onClick={() => setDialog(null)}>סגירה</Button></DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{dialog?.mode === "proceed" ? `להתקדם עם ההצעה של ${dialog?.bank}?` : `שאלה על ההצעה של ${dialog?.bank}`}</DialogTitle>
                <DialogDescription>{dialog?.mode === "proceed" ? "זו אינה חתימה ואינה התחייבות. היועץ יאשר איתכם את הפרטים לפני כל פעולה מול הבנק." : "כתבו את השאלה והיועץ יחזור אליכם."}</DialogDescription>
              </DialogHeader>
              <Textarea rows={3} placeholder={dialog?.mode === "proceed" ? "הערה ליועץ (לא חובה)" : "השאלה שלכם"} value={msg} onChange={(e) => setMsg(e.target.value)} />
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDialog(null)}>ביטול</Button>
                <Button disabled={sending || (dialog?.mode === "question" && !msg.trim())} onClick={submit}>{sending ? <Loader2 className="animate-spin" size={16} /> : dialog?.mode === "proceed" ? "כן, אני רוצה להתקדם" : "שליחה"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
