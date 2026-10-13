import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSENT_VERSIONS } from "@/lib/privacy";
import { buildMixes, dtiGrade, ltvGrade, Rates, TRACK_LABEL, Mix } from "@/lib/quickCheck";

type Goal = "first" | "upgrade" | "refi";
interface A {
  goal?: Goal; timing?: string; propertyType?: string; city?: string;
  value: number; equity: number; borrowers?: string; firstName: string;
  income: number; obligations: number;
  balance: number; currentPayment: number; yearsLeft: number;
}
const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;
const STORE = "easymort_quick_check";

const WHY: Record<string, string> = {
  goal: "המטרה קובעת את כללי המימון שהבנקים מפעילים.",
  timing: "לוח הזמנים משפיע על הצורך באישור עקרוני מוקדם.",
  propertyType: "סוג הנכס משפיע על אחוז המימון האפשרי.",
  city: "האזור משפיע על שמאות ועל מדיניות הבנקים.",
  value: "שווי הנכס הוא הבסיס לחישוב אחוז המימון.",
  equity: "ההון העצמי קובע את גובה המשכנתא הנדרשת.",
  borrowers: "מספר הלווים משפיע על חישוב כושר ההחזר.",
  income: "ההכנסה וההחזרים הקיימים קובעים את יחס ההחזר להכנסה.",
  balance: "היתרה היא הסכום שיש למחזר.",
  currentPayment: "כך נשווה את ההחזר החדש לנוכחי.",
  yearsLeft: "התקופה משפיעה על ההחזר החודשי ועל העלות הכוללת.",
};

function Cards({ options, value, onPick }: { options: [string, string][]; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onPick(v)}
          className={`min-h-16 rounded-xl border-2 p-4 text-right font-bold transition-colors ${value === v ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Money({ value, onChange, min, max, step }: { value: number; onChange: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="space-y-3">
      <input type="range" min={min} max={max} step={step} value={Math.min(Math.max(value, min), max)} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" aria-label="בחירת סכום" />
      <input type="number" inputMode="numeric" value={value || ""} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full h-12 rounded-lg border border-input bg-background px-3 text-lg font-bold" dir="ltr" />
    </div>
  );
}

export default function QuickCheckPage() {
  const [a, setA] = useState<A>({ value: 2_000_000, equity: 600_000, firstName: "", income: 20_000, obligations: 0, balance: 900_000, currentPayment: 5_500, yearsLeft: 20 });
  const [i, setI] = useState(0);
  const [why, setWhy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ token: string; rates: Rates; updated?: string } | null>(null);
  const set = (p: Partial<A>) => setA((s) => ({ ...s, ...p }));
  const refi = a.goal === "refi";

  const steps = refi
    ? ["goal", "balance", "currentPayment", "yearsLeft", "borrowers", "income"]
    : ["goal", "timing", "propertyType", "city", "value", "equity", "borrowers", "income"];
  const key = steps[i];
  const last = i === steps.length - 1;
  const loan = refi ? a.balance : Math.max(0, a.value - a.equity);
  const years = refi ? a.yearsLeft : 25;

  const next = () => { setWhy(false); setI((n) => Math.min(n + 1, steps.length - 1)); };
  const pick = (k: keyof A) => (v: string) => { set({ [k]: v } as Partial<A>); next(); };

  const showResult = async () => {
    if (!consent) return;
    setBusy(true); setErr("");
    try {
      const { data: rows, error } = await supabase.rpc("quiz_create_session" as never);
      const token = (rows as unknown as { session_token: string }[] | null)?.[0]?.session_token;
      if (error || !token) throw new Error("create");
      await supabase.rpc("quiz_update_session" as never, { _token: token, _quiz_data: { quick_check: a } as never, _current_step: steps.length, _score: null, _purpose: a.goal, _completed: true } as never);
      await supabase.rpc("record_session_consent" as never, { _token: token, _type: "quick_check", _version: CONSENT_VERSIONS.quick_check, _ua: navigator.userAgent } as never);
      const { data: r } = await supabase.from("market_rates").select("prime,fixed_not_linked,fixed_linked,variable_5,cpi_annual,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (!r) throw new Error("rates");
      localStorage.setItem(STORE, JSON.stringify({ token, answers: a }));
      setResult({ token, rates: r as unknown as Rates, updated: (r as { updated_at?: string }).updated_at });
      window.scrollTo({ top: 0 });
    } catch {
      setErr("לא הצלחנו להציג את התוצאה כרגע. נסו שוב בעוד רגע.");
    } finally { setBusy(false); }
  };

  if (result) return <ResultView a={a} loan={loan} years={years} refi={refi} rates={result.rates} updated={result.updated} token={result.token} />;

  const pct = Math.round(((i + 1) / steps.length) * 100);
  const q: Record<string, { title: string; body: JSX.Element }> = {
    goal: { title: "מה המטרה?", body: <Cards value={a.goal} onPick={(v) => { set({ goal: v as Goal }); setI(1); }} options={[["first", "משכנתא ראשונה"], ["upgrade", "משפרי דיור"], ["refi", "מחזור משכנתא"]]} /> },
    timing: { title: "מתי צריך את הכסף?", body: <Cards value={a.timing} onPick={pick("timing")} options={[["now", "בחודש הקרוב"], ["3m", "תוך 3 חודשים"], ["later", "בהמשך"], ["unknown", "לא יודע עדיין"]]} /> },
    propertyType: { title: "איזה נכס?", body: <Cards value={a.propertyType} onPick={pick("propertyType")} options={[["apartment", "דירה"], ["house", "בית פרטי"], ["new_build", "דירה מקבלן"], ["unknown", "לא יודע עדיין"]]} /> },
    city: { title: "באיזו עיר?", body: <div className="space-y-3"><input className="w-full h-12 rounded-lg border border-input bg-background px-3" value={a.city === "unknown" ? "" : a.city || ""} onChange={(e) => set({ city: e.target.value })} placeholder="שם העיר" /><Button variant="outline" onClick={() => { set({ city: "unknown" }); next(); }}>לא ידוע עדיין</Button></div> },
    value: { title: "מה שווי הנכס?", body: <Money value={a.value} onChange={(v) => set({ value: v })} min={300_000} max={10_000_000} step={50_000} /> },
    equity: { title: "כמה הון עצמי יש לכם?", body: <div className="space-y-3"><Money value={a.equity} onChange={(v) => set({ equity: v })} min={0} max={Math.max(a.value, 500_000)} step={10_000} /><p className="rounded-lg bg-primary/10 p-3 font-bold text-foreground">סכום המשכנתא הנדרש: {nis(loan)}</p></div> },
    borrowers: { title: "כמה לווים?", body: <div className="space-y-4"><Cards value={a.borrowers} onPick={(v) => set({ borrowers: v })} options={[["1", "לווה אחד"], ["2", "שני לווים"], ["3", "שלושה ומעלה"]]} /><label className="block text-sm text-muted-foreground">שם פרטי (לא חובה)<input className="w-full h-11 rounded-lg border border-input bg-background px-3" value={a.firstName} maxLength={40} onChange={(e) => set({ firstName: e.target.value })} /></label></div> },
    income: { title: "הכנסה והחזרים", body: <div className="space-y-5"><div><p className="text-sm text-muted-foreground mb-2">הכנסה חודשית נטו משוערת של כל הלווים</p><Money value={a.income} onChange={(v) => set({ income: v })} min={0} max={100_000} step={500} /></div><div><p className="text-sm text-muted-foreground mb-2">החזרים חודשיים קיימים (הלוואות, ליסינג){refi ? " – לא כולל המשכנתא" : ""}</p><Money value={a.obligations} onChange={(v) => set({ obligations: v })} min={0} max={30_000} step={100} /></div></div> },
    balance: { title: "מה יתרת המשכנתא?", body: <Money value={a.balance} onChange={(v) => set({ balance: v })} min={50_000} max={5_000_000} step={10_000} /> },
    currentPayment: { title: "מה ההחזר החודשי היום?", body: <Money value={a.currentPayment} onChange={(v) => set({ currentPayment: v })} min={500} max={40_000} step={100} /> },
    yearsLeft: { title: "כמה שנים נותרו?", body: <Money value={a.yearsLeft} onChange={(v) => set({ yearsLeft: Math.min(30, v) })} min={1} max={30} step={1} /> },
  };
  const card = ["goal", "timing", "propertyType"].includes(key) || (key === "borrowers" && !a.borrowers);

  return (
    <div className="container py-10 md:py-14 max-w-2xl space-y-6">
      <header className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-success/15 text-success text-sm font-bold">חינם · בלי הרשמה</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">בדיקת המשכנתא שלי</h1>
      </header>
      <div className="space-y-1" aria-label={`התקדמות ${pct}%`}>
        <div className="flex justify-between text-xs text-muted-foreground"><span>שאלה {i + 1} מתוך {steps.length}</span><span>{pct}%</span></div>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
      <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="font-display text-2xl font-bold text-foreground">{q[key].title}</h2>
        {q[key].body}
        <button type="button" className="text-sm text-primary underline" onClick={() => setWhy((w) => !w)}>למה אנחנו שואלים?</button>
        {why && <p className="text-sm text-muted-foreground">{WHY[key]}</p>}
        {last && (
          <label className="flex items-start gap-3 cursor-pointer rounded-lg bg-muted/50 p-3">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1" />
            <span className="text-sm text-foreground">אני מאשר/ת ל-EasyMorte לעבד את הנתונים שמסרתי לצורך הצגת התוצאה, בהתאם ל<Link to="/privacy" target="_blank" className="text-primary underline">מדיניות הפרטיות</Link>.</span>
          </label>
        )}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-between gap-2">
          <Button variant="ghost" disabled={i === 0} onClick={() => { setWhy(false); setI((n) => n - 1); }}><ChevronRight size={16} /> חזרה</Button>
          {last ? (
            <Button variant="cta" disabled={!consent || busy} onClick={showResult}>{busy ? "מחשב..." : "הצג לי את התוצאה"}</Button>
          ) : !card && <Button variant="cta" onClick={next}>המשך</Button>}
        </div>
        {i === 0 && <p className="text-xs text-muted-foreground">הנתונים שתמסרו ישמשו להצגת התוצאה בלבד, בהתאם ל<Link to="/privacy" className="underline">מדיניות הפרטיות</Link>.</p>}
      </section>
      <p className="text-center text-sm text-muted-foreground">יש לכם דוח יתרות? <Link to="/balance-check" className="text-primary underline">בדיקה לפי דוח יתרות לסילוק</Link></p>
    </div>
  );
}

function ResultView({ a, loan, years, refi, rates, updated, token }: { a: A; loan: number; years: number; refi: boolean; rates: Rates; updated?: string; token: string }) {
  const mixes: Mix[] = useMemo(() => buildMixes(loan, years, rates), [loan, years, rates]);
  const ltv = !refi && a.value > 0 ? (loan / a.value) * 100 : null;
  const basePay = mixes[1]?.monthly ?? 0;
  const dti = a.income > 0 ? ((basePay + a.obligations) / a.income) * 100 : null;
  const tone = (g: string) => (g === "מצוין" ? "text-success" : g === "אפשרי" ? "text-warning" : "text-destructive");
  const [email, setEmail] = useState(""); const [mkt, setMkt] = useState(false); const [mail, setMail] = useState(""); const [openMail, setOpenMail] = useState(false);

  const sendMail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMail("כתובת מייל לא תקינה");
    setMail("שולח...");
    if (mkt) await supabase.rpc("record_session_consent" as never, { _token: token, _type: "marketing", _version: CONSENT_VERSIONS.marketing, _ua: navigator.userAgent } as never);
    const { data, error } = await supabase.functions.invoke("send-quick-result", { body: { token, email, first_name: a.firstName, ltv, dti, mixes: mixes.map((m) => ({ name: m.name, risk: m.risk, monthly: m.monthly, total: m.total })) } });
    setMail(error || !data?.ok ? "השליחה נכשלה, נסו שוב" : "התוצאה נשלחה למייל");
  };

  return (
    <div className="container py-10 md:py-14 max-w-4xl space-y-8">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">{a.firstName.trim() ? `${a.firstName.trim()}, זו התוצאה שלך` : "התוצאה שלכם"}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">אחוז מימון (LTV)</p>
          {ltv === null ? <p className="font-bold text-foreground">לא חושב במחזור ללא שווי נכס</p> : <>
            <p className="text-3xl font-bold text-foreground">{ltv.toFixed(0)}% <span className={`text-base ${tone(ltvGrade(ltv))}`}>{ltvGrade(ltv)}</span></p>
            <p className="text-sm text-muted-foreground">היחס בין המשכנתא לשווי הנכס; מעל 75% רוב הבנקים מגבילים מימון.</p></>}
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">יחס החזר להכנסה (DTI)</p>
          {dti === null ? <p className="font-bold text-foreground">נדרשת הכנסה לחישוב</p> : <>
            <p className="text-3xl font-bold text-foreground">{dti.toFixed(0)}% <span className={`text-base ${tone(dtiGrade(dti))}`}>{dtiGrade(dti)}</span></p>
            <p className="text-sm text-muted-foreground">החלק מההכנסה שהולך להחזרים; מעל 40% הבנקים בוחנים בזהירות רבה.</p></>}
        </div>
      </div>
      {refi && <p className="text-sm text-foreground">ההחזר החודשי היום: {nis(a.currentPayment)}. השוו אותו להחזר בתמהילים למטה.</p>}
      <div className="grid md:grid-cols-3 gap-4">
        {mixes.map((m) => (
          <div key={m.name} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div><p className="font-display font-bold text-lg text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">רמת סיכון: {m.risk}</p></div>
            <p className="text-foreground">החזר חודשי משוער: <strong>{nis(m.monthly)}</strong></p>
            <p className="text-foreground">החזר כולל משוער: <strong>{nis(m.total)}</strong></p>
            <ul className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2">
              {m.tracks.map((t) => <li key={t.key}>{TRACK_LABEL[t.key]} · {nis(t.amount)} · {t.years} שנים · {t.rate.toFixed(2)}%</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">הערכה לפי ריביות ממוצעות שמפורסמות על ידי בנק ישראל{updated ? ` (עודכן ${new Date(updated).toLocaleDateString("he-IL")})` : ""}. התנאים הסופיים נקבעים על ידי הבנק.</p>

      <section className="bg-navy text-primary-foreground rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="font-display text-2xl font-bold">את המכרז מול הבנקים אנחנו סוגרים בשבילכם.</h2>
        <ul className="space-y-2">
          {["בלי לרוץ בין סניפים", "בלי טלפונים", "מכרז מול כמה בנקים במקביל", "יועצת מקצועית מלווה עד החתימה"].map((x) => <li key={x} className="flex gap-2"><Check size={18} className="text-success shrink-0" />{x}</li>)}
        </ul>
        <p className="text-lg font-bold">₪3,450 כולל מע"מ · עד 4 תשלומים</p>
        <Link to="/auth?next=/intake"><Button variant="cta" size="lg">מתחילים</Button></Link>
        <div>
          <button type="button" className="text-sm underline text-primary-foreground/80" onClick={() => setOpenMail((o) => !o)}>שלחו לי את התוצאה למייל</button>
          {openMail && (
            <div className="mt-3 space-y-2 max-w-sm">
              <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-10 rounded-lg border border-input bg-background text-foreground px-3" />
              <label className="flex items-start gap-2 text-sm"><Checkbox checked={mkt} onCheckedChange={(v) => setMkt(v === true)} className="mt-0.5 border-primary-foreground" />אשמח לקבל עדכונים ותוכן שיווקי</label>
              <Button variant="outline" size="sm" onClick={sendMail} className="text-foreground">שליחה</Button>
              {mail && <p className="text-sm" role="status">{mail}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
