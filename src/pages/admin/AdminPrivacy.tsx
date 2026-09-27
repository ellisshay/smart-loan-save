import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CONSENT_VERSIONS, DATA_MAP, FIELD_REGISTRY, SIGNED_URL_TTL, CONTROLLER } from "@/lib/privacy";

const TABS = ["מפת מידע", "סיווג שדות", "ספקים", "תפקידים", "בקשות פרטיות", "יומן פעולות", "הסכמות", "רשימת בדיקה"] as const;

const CHECKLIST: [string, boolean][] = [
  ["הגנת הרשאות לפי משתמש פעילה על כל הטבלאות", true],
  ["אחסון מסמכים פרטי בלבד, ללא קישורים קבועים", true],
  [`קישורי צפייה זמניים (${SIGNED_URL_TTL / 60} דקות)`, true],
  ["יומן פעולות שלא ניתן לעריכה", true],
  ["הסכמות נפרדות: פרטיות, העברה לבנקים, עיבוד אוטומטי", true],
  ["פרטי אשראי אינם עוברים במערכת (Tranzila)", true],
  ["אין צירוף מסמכים למיילים ול־WhatsApp", true],
  ["אימות דו־שלבי לעובדים פנימיים", false],
  ["הגנה מסיסמאות שדלפו", false],
  ["מחיקה אוטומטית לפי מדיניות שמירה", false],
  ["חוזי עיבוד מידע (DPA) חתומים מול כל הספקים", false],
  ["סקירת הרשאות רבעונית", false],
];

export default function AdminPrivacy() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("מפת מידע");
  const [vendors, setVendors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [consentCount, setConsentCount] = useState<Record<string, number>>({});

  const load = async () => {
    const [v, r, a, ro, c] = await Promise.all([
      supabase.from("vendors" as never).select("*").order("vendor_name"),
      supabase.from("privacy_requests" as never).select("*").order("created_at", { ascending: false }),
      supabase.from("audit_log" as never).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("consents" as never).select("consent_type"),
    ]);
    setVendors((v.data as any[]) || []);
    setRequests((r.data as any[]) || []);
    setAudit((a.data as any[]) || []);
    setRoles((ro.data as any[]) || []);
    const counts: Record<string, number> = {};
    ((c.data as any[]) || []).forEach(x => (counts[x.consent_type] = (counts[x.consent_type] || 0) + 1));
    setConsentCount(counts);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string, legal_hold?: boolean) => {
    await supabase.from("privacy_requests" as never).update({ status, ...(legal_hold !== undefined ? { legal_hold } : {}) } as never).eq("id", id);
    load();
  };

  const roleCounts = roles.reduce((m: Record<string, number>, r) => ((m[r.role] = (m[r.role] || 0) + 1), m), {});
  const th = "p-2 text-right font-semibold text-foreground bg-muted";
  const td = "p-2 align-top text-muted-foreground border-t border-border";

  return (
    <div dir="rtl" className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">פרטיות ואבטחת מידע</h1>
        <p className="text-sm text-muted-foreground">בעל השליטה: {CONTROLLER.name}, {CONTROLLER.businessId}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t}</button>)}
        <Button variant="outline" size="sm" onClick={() => window.print()}>הדפסה לביקורת</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        {tab === "מפת מידע" && (
          <table className="w-full text-sm"><thead><tr>{["סוג מידע","מקור","מטרה","מיקום","גישה","נמענים","תקופת שמירה","בסיס","מחיקה"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{DATA_MAP.map(d => <tr key={d.category}>{[d.category,d.from,d.purpose,d.storage,d.access,d.recipients,d.retention,d.basis,d.deletion].map((x,i) => <td key={i} className={td}>{x}</td>)}</tr>)}</tbody></table>
        )}
        {tab === "סיווג שדות" && (
          <table className="w-full text-sm"><thead><tr>{["שדה","סיווג","מטרה"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{FIELD_REGISTRY.map(f => <tr key={f.field}><td className={td} dir="ltr">{f.field}</td><td className={td}>{f.cls}</td><td className={td}>{f.purpose}</td></tr>)}</tbody></table>
        )}
        {tab === "ספקים" && (
          <table className="w-full text-sm"><thead><tr>{["ספק","שירות","סוגי מידע","אזור","מטרה","DPA","שמירה","הערות אבטחה","נסקר"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{vendors.map(v => <tr key={v.id}>{[v.vendor_name,v.service,v.data_categories,v.region,v.purpose,v.dpa_signed ? "כן" : "לא",v.retention,v.security_notes,v.last_reviewed || "טרם"].map((x,i) => <td key={i} className={td}>{x}</td>)}</tr>)}</tbody></table>
        )}
        {tab === "תפקידים" && (
          <table className="w-full text-sm"><thead><tr>{["תפקיד","משתמשים","הרשאות"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{[
              ["user / customer","הלקוח רואה ועורך רק את התיק שלו"],
              ["operations","תפעול: נתונים הדרושים לטיפול"],
              ["mortgage_advisor","יועץ: רק לידים שרכש או הוקצו לו"],
              ["advisor","יועץ בשוק הלידים"],
              ["supervisor","צפייה ביומנים ובקרה"],
              ["privacy_auditor","צפייה בלבד ביומנים, מדיניות והרשאות"],
              ["admin","ניהול לקוחות ומסמכים"],
            ].map(([r,p]) => <tr key={r}><td className={td} dir="ltr">{r}</td><td className={td}>{r.split(" / ").reduce((s,k)=>s+(roleCounts[k]||0),0)}</td><td className={td}>{p}</td></tr>)}</tbody></table>
        )}
        {tab === "בקשות פרטיות" && (
          <table className="w-full text-sm"><thead><tr>{["תאריך","סוג","פרטים","סטטוס","הקפאה משפטית","פעולות"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{requests.length === 0 ? <tr><td className={td} colSpan={6}>אין בקשות</td></tr> : requests.map(r => <tr key={r.id}>
              <td className={td}>{new Date(r.created_at).toLocaleDateString("he-IL")}</td><td className={td}>{r.request_type}</td><td className={td}>{r.details}</td><td className={td}>{r.status}</td><td className={td}>{r.legal_hold ? "כן" : "לא"}</td>
              <td className={td}><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setStatus(r.id, "done")}>טופל</Button><Button size="sm" variant="outline" onClick={() => setStatus(r.id, r.status, !r.legal_hold)}>הקפאה</Button></div></td></tr>)}</tbody></table>
        )}
        {tab === "יומן פעולות" && (
          <table className="w-full text-sm"><thead><tr>{["זמן","פעולה","משתמש","תפקיד","אובייקט","הצלחה"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{audit.map(a => <tr key={a.id}><td className={td}>{new Date(a.created_at).toLocaleString("he-IL")}</td><td className={td} dir="ltr">{a.action}</td><td className={td} dir="ltr">{a.user_id ? a.user_id.slice(0, 8) : "מערכת"}</td><td className={td}>{a.role}</td><td className={td}>{a.object_type}</td><td className={td}>{a.success ? "כן" : "לא"}</td></tr>)}</tbody></table>
        )}
        {tab === "הסכמות" && (
          <table className="w-full text-sm"><thead><tr>{["סוג הסכמה","גרסה פעילה","נרשמו"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{Object.entries(CONSENT_VERSIONS).map(([k,v]) => <tr key={k}><td className={td} dir="ltr">{k}</td><td className={td}>{v}</td><td className={td}>{consentCount[k] || 0}</td></tr>)}</tbody></table>
        )}
        {tab === "רשימת בדיקה" && (
          <ul className="p-4 space-y-2 text-sm">{CHECKLIST.map(([t, ok]) => <li key={t} className="flex gap-2"><span className={ok ? "text-primary" : "text-destructive"}>{ok ? "✓" : "✗"}</span><span className="text-foreground">{t}</span></li>)}</ul>
        )}
      </div>
    </div>
  );
}
