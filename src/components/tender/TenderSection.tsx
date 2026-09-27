import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Landmark, Plus, Trash2, History, Paperclip, Download, Gavel, MessageSquare } from "lucide-react";
import { BANK_STATUSES, OFFER_KINDS, TRACK_TYPES, RATE_TYPES, INDEXATIONS, CHECKLIST, STAGES, Track, nis } from "@/lib/tender";

const db = supabase as any;

interface Props { caseId: string; clientName: string; intake: any; caseStatus: string; createdAt: string; assignedAdvisorId: string | null; }

const emptyTrack = (): Track => ({ type: TRACK_TYPES[0], amount: 0, months: 300, rate: 0, rate_type: "משתנה", indexation: "לא צמוד", first_payment: 0 });
const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export default function TenderSection({ caseId, clientName, intake, caseStatus, createdAt, assignedAdvisorId }: Props) {
  const [tender, setTender] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
  const [advisor, setAdvisor] = useState<string | null>(assignedAdvisorId);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: t }, { data: b }, { data: adm }] = await Promise.all([
      db.from("tenders").select("*").eq("case_id", caseId).maybeSingle(),
      db.from("banks").select("*").eq("active", true).order("sort"),
      db.rpc("is_admin"),
    ]);
    setTender(t); setBanks(b || []); setIsAdmin(!!adm);
    if (adm) {
      const { data: roles } = await db.from("user_roles").select("user_id, role").in("role", ["advisor", "mortgage_advisor", "admin"]);
      const ids = [...new Set((roles || []).map((r: any) => r.user_id))];
      if (ids.length) {
        const { data: profs } = await db.from("profiles").select("user_id, first_name, last_name, email").in("user_id", ids);
        setAdvisors((profs || []).map((p: any) => ({ id: p.user_id, name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email })));
      }
    }
    if (t) {
      const [{ data: s }, { data: c }, { data: a }] = await Promise.all([
        db.from("tender_banks").select("*").eq("tender_id", t.id).order("slot"),
        db.from("tender_checklist").select("*").eq("tender_id", t.id).order("sort"),
        db.from("tender_client_actions").select("*").eq("tender_id", t.id).order("created_at", { ascending: false }),
      ]);
      setSlots(s || []); setChecklist(c || []); setActions(a || []);
      const ids = (s || []).map((x: any) => x.id);
      const { data: o } = ids.length ? await db.from("tender_offers").select("*").in("tender_bank_id", ids).order("version", { ascending: false }) : { data: [] };
      setOffers(o || []);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const openTender = async () => {
    const { error } = await db.rpc("open_tender", { _case_id: caseId });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "המכרז נפתח" }); load();
  };

  const saveAdvisor = async (id: string) => {
    setAdvisor(id || null);
    const { error } = await db.from("cases").update({ assigned_advisor_id: id || null }).eq("id", caseId);
    toast(error ? { title: "שגיאה", description: error.message, variant: "destructive" } : { title: "היועץ עודכן" });
  };

  const updateTender = async (patch: any) => {
    const { error } = await db.from("tenders").update(patch).eq("id", tender.id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setTender({ ...tender, ...patch });
  };

  const toggleStep = async (row: any) => {
    const done = !row.done;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("tender_checklist").update({ done, done_at: done ? new Date().toISOString() : null, done_by: done ? u.user?.id : null }).eq("id", row.id);
    if (!error) setChecklist(checklist.map((c) => (c.id === row.id ? { ...c, done } : c)));
  };

  if (loading) return <div className="card-surface p-6 text-sm text-muted-foreground">טוען מכרז...</div>;

  const pv = Number(intake?.property?.propertyValue || intake?.property?.property_value || 0);
  const loan = Number(intake?.mortgage_request?.loanAmount || intake?.mortgage_request?.amount || 0);
  const ltv = pv && loan ? Math.round((loan / pv) * 100) : null;
  const advisorName = advisors.find((a) => a.id === advisor)?.name;

  return (
    <section className="card-surface p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-2xl font-black text-foreground flex items-center gap-2"><Gavel size={22} className="text-primary" /> מכרז בנקים</h2>
        {!tender && <Button onClick={openTender}>פתיחת מכרז</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Info label="לקוח" value={clientName} />
        <Info label="סכום משכנתא מבוקש" value={nis(loan)} />
        <Info label="שווי נכס" value={nis(pv)} />
        <Info label="אחוז מימון" value={ltv ? `${ltv}%` : "-"} />
        <Info label="מטרת המשכנתא" value={intake?.goal || intake?.mortgage_request?.purpose || "-"} />
        <Info label="סטטוס התיק" value={tender ? STAGES[tender.stage] : caseStatus} />
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">יועץ מטפל</p>
          {isAdmin ? (
            <select className={sel} value={advisor || ""} onChange={(e) => saveAdvisor(e.target.value)}>
              <option value="">לא הוקצה</option>
              {advisors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          ) : <p className="font-semibold">{advisorName || "אתם"}</p>}
        </div>
        <Info label="תאריך פתיחת המכרז" value={tender ? new Date(tender.opened_at).toLocaleDateString("he-IL") : "-"} />
      </div>

      {tender && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">שלב המכרז
              <select className={sel} value={tender.stage} onChange={(e) => updateTender({ stage: e.target.value })}>
                {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-sm">הסבר מקצועי ללקוח (מוצג ללקוח)
              <Textarea defaultValue={tender.advisor_summary || ""} rows={2} onBlur={(e) => e.target.value !== (tender.advisor_summary || "") && updateTender({ advisor_summary: e.target.value })} />
            </label>
          </div>

          {actions.length > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="font-semibold flex items-center gap-2"><MessageSquare size={16} /> פניות מהלקוח</p>
              {actions.map((a) => (
                <p key={a.id} className="text-sm">
                  <b>{a.action === "proceed" ? "רוצה להתקדם עם הצעה" : "שאלה"}</b> · {new Date(a.created_at).toLocaleString("he-IL")}
                  {a.message && <span className="block text-muted-foreground">{a.message}</span>}
                </p>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {slots.map((s) => (
              <BankSlot key={s.id} slot={s} banks={banks} caseId={caseId} offers={offers.filter((o) => o.tender_bank_id === s.id)} selectedOfferId={tender.selected_offer_id} onChange={load} />
            ))}
          </div>

          <Comparison slots={slots} banks={banks} offers={offers} />

          <div>
            <h3 className="font-display text-lg font-bold mb-3">צ׳קליסט לסגירה</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {checklist.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-pointer">
                  <Checkbox checked={c.done} onCheckedChange={() => toggleStep(c)} />
                  <span className={c.done ? "line-through text-muted-foreground" : ""}>{CHECKLIST[c.step_key]}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-semibold text-foreground">{value}</p></div>;
}

function BankSlot({ slot, banks, caseId, offers, selectedOfferId, onChange }: { slot: any; banks: any[]; caseId: string; offers: any[]; selectedOfferId: string | null; onChange: () => void }) {
  const [f, setF] = useState(slot);
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const folder = `tender/${caseId}/${slot.slot}`;

  const loadFiles = useCallback(async () => {
    const { data } = await supabase.storage.from("case-documents").list(folder);
    setFiles(data || []);
  }, [folder]);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  const save = async () => {
    const { id, tender_id, slot: _s, created_at, updated_at, ...patch } = f;
    const statusChanged = patch.status !== slot.status;
    const { error } = await db.from("tender_banks").update(patch).eq("id", slot.id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "נשמר" });
    if (statusChanged && patch.status !== "not_submitted") {
      const bankName = banks.find((b) => b.id === patch.bank_id)?.name || "הבנק";
      supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "tender_update", message: `${bankName}: ${BANK_STATUSES[patch.status].client}` } }).catch(console.error);
    }
    onChange();
  };

  const upload = async (file: File) => {
    const { error } = await supabase.storage.from("case-documents").upload(`${folder}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`, file);
    if (error) return toast({ title: "שגיאה בהעלאה", description: error.message, variant: "destructive" });
    loadFiles();
  };
  const openFile = async (name: string) => {
    const { data } = await supabase.storage.from("case-documents").createSignedUrl(`${folder}/${name}`, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const toggleVisible = async (o: any, patch: any) => {
    const { error } = await db.from("tender_offers").update(patch).eq("id", o.id);
    if (error) toast({ title: "שגיאה", description: error.message, variant: "destructive" }); else onChange();
  };

  const latest = offers[0];
  const st = BANK_STATUSES[f.status];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold flex items-center gap-2"><Landmark size={18} className="text-primary" /> בנק {slot.slot}</p>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.tone}`}>{st.label}</span>
      </div>
      <select className={sel} value={f.bank_id || ""} onChange={(e) => setF({ ...f, bank_id: e.target.value || null })}>
        <option value="">בחירת בנק</option>
        {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
        {Object.entries(BANK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <Input placeholder="איש קשר / בנקאי" value={f.banker_contact || ""} onChange={(e) => setF({ ...f, banker_contact: e.target.value })} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label>תאריך הגשה<Input type="date" value={f.submitted_at || ""} onChange={(e) => setF({ ...f, submitted_at: e.target.value || null })} /></label>
        <label>תוקף האישור<Input type="date" value={f.approval_valid_until || ""} onChange={(e) => setF({ ...f, approval_valid_until: e.target.value || null })} /></label>
        <label>סכום שאושר<Input type="number" value={f.approved_amount ?? ""} onChange={(e) => setF({ ...f, approved_amount: e.target.value ? Number(e.target.value) : null })} /></label>
        <label>אחוז מימון שאושר<Input type="number" value={f.approved_ltv ?? ""} onChange={(e) => setF({ ...f, approved_ltv: e.target.value ? Number(e.target.value) : null })} /></label>
      </div>
      <Textarea placeholder="הערות פנימיות (לא מוצגות ללקוח)" rows={2} value={f.internal_notes || ""} onChange={(e) => setF({ ...f, internal_notes: e.target.value })} />
      <Button size="sm" className="w-full" onClick={save}>שמירת פרטי הבנק</Button>

      <div className="border-t border-border pt-3 space-y-1">
        <p className="text-xs font-semibold flex items-center gap-1"><Paperclip size={14} /> מסמכים מהבנק</p>
        {files.map((x) => (
          <button key={x.name} onClick={() => openFile(x.name)} className="flex items-center gap-1 text-xs text-primary hover:underline"><Download size={12} />{x.name.replace(/^\d+_/, "")}</button>
        ))}
        <input type="file" className="text-xs" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        {latest ? <OfferView o={latest} selected={latest.id === selectedOfferId} onVisible={(p) => toggleVisible(latest, p)} /> : <p className="text-xs text-muted-foreground">אין הצעה עדיין</p>}
        <Button size="sm" variant="outline" className="w-full" onClick={() => setEditing(!editing)}><Plus size={14} /> {latest ? "הצעה חדשה (גרסה חדשה)" : "הזנת הצעה"}</Button>
        {editing && <OfferEditor slotId={slot.id} version={(latest?.version || 0) + 1} base={latest} onSaved={() => { setEditing(false); onChange(); }} />}
        {offers.length > 1 && (
          <>
            <button className="text-xs text-muted-foreground flex items-center gap-1" onClick={() => setShowHistory(!showHistory)}><History size={12} /> היסטוריית הצעות ({offers.length - 1})</button>
            {showHistory && offers.slice(1).map((o) => <OfferView key={o.id} o={o} selected={o.id === selectedOfferId} onVisible={(p) => toggleVisible(o, p)} muted />)}
          </>
        )}
      </div>
    </div>
  );
}

function OfferView({ o, selected, onVisible, muted }: { o: any; selected: boolean; onVisible: (p: any) => void; muted?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-xs space-y-1 ${muted ? "bg-muted/30" : "bg-muted/60"} ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex justify-between font-semibold"><span>{OFFER_KINDS[o.kind]} · גרסה {o.version}</span>{selected && <span className="text-primary">נבחרה ע״י הלקוח</span>}</div>
      <p>סה״כ {nis(o.total_amount)} · החזר ראשון {nis(o.first_payment)}</p>
      {(o.tracks || []).map((t: Track, i: number) => <p key={i} className="text-muted-foreground">{t.type}: {nis(t.amount)} · {t.rate}% · {t.months} ח׳ · {t.indexation}</p>)}
      {o.valid_until && <p>בתוקף עד {new Date(o.valid_until).toLocaleDateString("he-IL")}</p>}
      <label className="flex items-center gap-2 pt-1"><Switch checked={o.client_visible} onCheckedChange={(v) => onVisible({ client_visible: v })} /> מוצג ללקוח</label>
      <Textarea rows={2} placeholder="הסבר ללקוח על ההצעה" defaultValue={o.advisor_explanation || ""} onBlur={(e) => e.target.value !== (o.advisor_explanation || "") && onVisible({ advisor_explanation: e.target.value })} />
    </div>
  );
}

function OfferEditor({ slotId, version, base, onSaved }: { slotId: string; version: number; base?: any; onSaved: () => void }) {
  const [kind, setKind] = useState(base ? "improved" : "initial");
  const [tracks, setTracks] = useState<Track[]>(base?.tracks?.length ? base.tracks.map((t: Track) => ({ ...t })) : [emptyTrack()]);
  const [offerDate, setOfferDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [extra, setExtra] = useState("");
  const total = tracks.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const first = tracks.reduce((s, t) => s + (Number(t.first_payment) || 0), 0);
  const upd = (i: number, k: keyof Track, v: any) => setTracks(tracks.map((t, j) => (j === i ? { ...t, [k]: v } : t)));

  const save = async () => {
    const { error } = await db.from("tender_offers").insert({ tender_bank_id: slotId, version, kind, tracks, total_amount: total, first_payment: first, extra_costs: extra || null, offer_date: offerDate || null, valid_until: validUntil || null });
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "ההצעה נשמרה כגרסה חדשה" }); onSaved();
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2 text-xs">
      <select className={sel} value={kind} onChange={(e) => setKind(e.target.value)}>
        {Object.entries(OFFER_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {tracks.map((t, i) => (
        <div key={i} className="rounded-md bg-muted/40 p-2 space-y-1">
          <div className="flex gap-1">
            <select className={sel} value={t.type} onChange={(e) => upd(i, "type", e.target.value)}>{TRACK_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
            <Button size="icon" variant="ghost" onClick={() => setTracks(tracks.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <label>סכום<Input type="number" value={t.amount || ""} onChange={(e) => upd(i, "amount", Number(e.target.value))} /></label>
            <label>תקופה (חודשים)<Input type="number" value={t.months || ""} onChange={(e) => upd(i, "months", Number(e.target.value))} /></label>
            <label>ריבית %<Input type="number" step="0.01" value={t.rate || ""} onChange={(e) => upd(i, "rate", Number(e.target.value))} /></label>
            <label>החזר התחלתי<Input type="number" value={t.first_payment || ""} onChange={(e) => upd(i, "first_payment", Number(e.target.value))} /></label>
            <select className={sel} value={t.rate_type} onChange={(e) => upd(i, "rate_type", e.target.value)}>{RATE_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
            <select className={sel} value={t.indexation} onChange={(e) => upd(i, "indexation", e.target.value)}>{INDEXATIONS.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <p className="text-muted-foreground">{total ? Math.round(((t.amount || 0) / total) * 100) : 0}% מסך המשכנתא</p>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={() => setTracks([...tracks, emptyTrack()])}><Plus size={14} /> מסלול</Button>
      <div className="grid grid-cols-2 gap-1">
        <label>תאריך ההצעה<Input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} /></label>
        <label>תוקף ההצעה<Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
      </div>
      <Input placeholder="עלויות / נתונים נוספים" value={extra} onChange={(e) => setExtra(e.target.value)} />
      <p className="font-semibold">סה״כ {nis(total)} · החזר התחלתי {nis(first)}</p>
      <Button size="sm" className="w-full" onClick={save}>שמירה כגרסה {version}</Button>
    </div>
  );
}

function Comparison({ slots, banks, offers }: { slots: any[]; banks: any[]; offers: any[] }) {
  const rows = slots.map((s) => ({ s, o: offers.find((o) => o.tender_bank_id === s.id), bank: banks.find((b) => b.id === s.bank_id)?.name || `בנק ${s.slot}` }));
  if (!rows.some((r) => r.o)) return null;
  return (
    <div className="overflow-x-auto">
      <h3 className="font-display text-lg font-bold mb-1">השוואת 3 הבנקים</h3>
      <p className="text-xs text-muted-foreground mb-3">ההשוואה אינה קובעת זוכה. יש לשקול מבנה, הצמדה, תקופה וסיכון.</p>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="bg-muted/60 text-right">{["בנק", "סכום מאושר", "תמהיל", "ריביות", "תקופות", "החזר חודשי התחלתי", "תוקף ההצעה", "סטטוס"].map((h) => <th key={h} className="p-2 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(({ s, o, bank }) => (
            <tr key={s.id} className="border-b border-border align-top">
              <td className="p-2 font-semibold">{bank}</td>
              <td className="p-2">{nis(s.approved_amount ?? o?.total_amount)}</td>
              <td className="p-2">{o ? o.tracks.map((t: Track) => `${t.type} ${o.total_amount ? Math.round((t.amount / o.total_amount) * 100) : 0}%`).join(", ") : "-"}</td>
              <td className="p-2">{o ? o.tracks.map((t: Track) => `${t.rate}%`).join(" / ") : "-"}</td>
              <td className="p-2">{o ? o.tracks.map((t: Track) => `${Math.round(t.months / 12)} שנ׳`).join(" / ") : "-"}</td>
              <td className="p-2">{nis(o?.first_payment)}</td>
              <td className="p-2">{o?.valid_until ? new Date(o.valid_until).toLocaleDateString("he-IL") : "-"}</td>
              <td className="p-2">{BANK_STATUSES[s.status].label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
