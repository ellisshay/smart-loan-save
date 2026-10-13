import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONSENT_VERSIONS } from "@/lib/privacy";
import { buildMixes, dtiGrade, ltvGrade, Rates, TRACK_LABEL, Mix, Grade, TrackKey } from "@/lib/quickCheck";
import { FUNNEL_ICONS } from "@/components/quickcheck/FunnelIcons";

type Goal = "first" | "upgrade" | "refi";
interface A {
  goal?: Goal; timing?: string; propertyType?: string; city?: string;
  value: number; equity: number; borrowers?: string; firstName: string;
  income: number; obligations: number;
  balance: number; currentPayment: number; yearsLeft: number;
}
const nis = (v: number) => `₪${Math.round(v).toLocaleString("he-IL")}`;
const STORE = "easymort_quick_check";
const EXTRA_COSTS_RATE = 0.02; // estimate: lawyer, appraisal, bank fees
const ANIM = "animate-in fade-in slide-in-from-left-4 duration-200 motion-reduce:animate-none";

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

type Opt = { v: string; t: string; d: string; icon: string };
const OPTS: Record<string, Opt[]> = {
  goal: [
    { v: "first", t: "משכנתא ראשונה", d: "רוכשים דירה ראשונה", icon: "first" },
    { v: "upgrade", t: "משפרי דיור", d: "מוכרים או מחליפים דירה קיימת", icon: "upgrade" },
    { v: "refi", t: "מחזור משכנתא", d: "בודקים אם אפשר לשלם פחות", icon: "refi" },
  ],
  timing: [
    { v: "now", t: "בחודש הקרוב", d: "יש עסקה על הפרק", icon: "now" },
    { v: "3m", t: "תוך 3 חודשים", d: "מחפשים ברצינות", icon: "3m" },
    { v: "later", t: "בהמשך", d: "בודקים אפשרויות", icon: "later" },
    { v: "unknown", t: "לא יודע עדיין", d: "אפשר להמשיך גם כך", icon: "unknown" },
  ],
  propertyType: [
    { v: "apartment", t: "דירה", d: "יד שנייה בבניין קיים", icon: "apartment" },
    { v: "house", t: "בית פרטי", d: "צמוד קרקע", icon: "house" },
    { v: "new_build", t: "דירה מקבלן", d: "בבנייה או חדשה", icon: "new_build" },
    { v: "unknown", t: "לא יודע עדיין", d: "אפשר להמשיך גם כך", icon: "unknown" },
  ],
  borrowers: [
    { v: "1", t: "לווה אחד", d: "הכנסה אחת", icon: "b1" },
    { v: "2", t: "שני לווים", d: "בני זוג או שותפים", icon: "b2" },
    { v: "3", t: "שלושה ומעלה", d: "כולל ערבים או בני משפחה", icon: "b3" },
  ],
};

const GRADE_DOT: Record<Grade, string> = { "מצוין": "bg-success", "אפשרי": "bg-warning", "גבולי": "bg-destructive" };
const GRADE_LINE = {
  ltv: { "מצוין": "מימון נמוך – הבנקים יציעו את התנאים הטובים ביותר.", "אפשרי": "בטווח המקובל; עד 75% בדירה יחידה.", "גבולי": "מעל המימון המקובל – כדאי להגדיל הון עצמי." },
  dti: { "מצוין": "החזר נוח ביחס להכנסה.", "אפשרי": "בטווח שהבנקים מאשרים בדרך כלל.", "גבולי": "גבוה – הבנקים יבחנו את התיק בזהירות." },
} as const;
const RISK_BAR: Record<Mix["risk"], string> = { "נמוך": "bg-success", "בינוני": "bg-warning", "גבוה": "bg-destructive" };
const TRACK_DOT: Record<TrackKey, string> = { prime: "bg-primary", fixed_not_linked: "bg-navy", fixed_linked: "bg-warning", variable_5: "bg-success" };
const PROS_CONS: Record<Mix["risk"], { pros: string[]; cons: string[] }> = {
  "נמוך": { pros: ["החזר צפוי לאורך זמן", "פחות חשיפה לשינויי ריבית"], cons: ["עלות כוללת גבוהה יותר", "עמלת פירעון מוקדם אפשרית במסלול קבוע"] },
  "בינוני": { pros: ["איזון בין יציבות לגמישות", "אפשרות לפירעון חלקי בחלק מהמסלולים"], cons: ["חלק מההחזר עשוי להשתנות", "דורש מעקב אחרי תחנות יציאה"] },
  "גבוה": { pros: ["עלות כוללת נמוכה יותר בתנאים הנוכחיים", "גמישות גבוהה לפירעון מוקדם"], cons: ["ההחזר עלול לעלות אם הריבית תעלה", "פחות ודאות לאורך השנים"] },
};

function GradePill({ g }: { g: Grade }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-sm font-bold text-foreground"><span className={`w-2.5 h-2.5 rounded-full ${GRADE_DOT[g]}`} aria-hidden="true" />{g}</span>;
}

function Cards({ name, opts, value, onPick }: { name: string; opts: Opt[]; value?: string; onPick: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid sm:grid-cols-2 gap-3">
      {opts.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onPick(o.v)}
          className={`flex items-center gap-4 min-h-20 rounded-2xl border-2 p-4 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${value === o.v ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
          {FUNNEL_ICONS[o.icon]}
          <span><span className="block font-display font-bold text-foreground">{o.t}</span><span className="block text-sm text-muted-foreground">{o.d}</span></span>
        </button>
      ))}
    </div>
  );
}

function Money({ label, value, onChange, min, max, step, suffix = "₪" }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; suffix?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-center gap-2 rounded-2xl bg-muted/50 py-4">
        <input type="number" inputMode="numeric" aria-label={label} value={value || ""} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-48 bg-transparent text-center font-display text-4xl font-black text-foreground focus:outline-none" dir="ltr" />
        <span className="text-xl font-bold text-muted-foreground">{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={Math.min(Math.max(value, min), max)} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary h-2" aria-label={`${label} – סליידר`} />
    </div>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const C = 2 * Math.PI * 40; let off = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(", ")}>
      <circle cx="50" cy="50" r="40" fill="none" className="stroke-muted" strokeWidth="16" />
      {parts.map((p) => { const len = (p.value / total) * C; const el = <circle key={p.label} cx="50" cy="50" r="40" fill="none" className={p.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />; off += len; return el; })}
    </svg>
  );
}

const PROCESS = ["קולטים את הנתונים", "בודקים את אחוז המימון והיחס להכנסה", "משווים לריביות הממוצעות", "בונים לכם תמהילים"];

export default function QuickCheckPage() {
  const [a, setA] = useState<A>({ value: 2_000_000, equity: 600_000, firstName: "", income: 20_000, obligations: 0, balance: 900_000, currentPayment: 5_500, yearsLeft: 20 });
  const [i, setI] = useState(0);
  const [why, setWhy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const [interim, setInterim] = useState(false);
  const [processing, setProcessing] = useState(-1);
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

  const advance = () => { setWhy(false); setI((n) => Math.min(n + 1, steps.length - 1)); };
  const next = () => (key === "equity" ? setInterim(true) : advance());
  const pick = (k: keyof A) => (v: string) => { set({ [k]: v } as Partial<A>); if (k === "goal") { setWhy(false); setI(1); } else setTimeout(advance, 150); };

  const showResult = async () => {
    if (!consent) return;
    setErr(""); setProcessing(0); window.scrollTo({ top: 0 });
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tick = reduce ? 400 : 850;
    const timer = (async () => { for (let s = 1; s <= PROCESS.length; s++) { await new Promise((r) => setTimeout(r, tick)); setProcessing(s); } })();
    try {
      const work = (async () => {
        const { data: rows, error } = await supabase.rpc("quiz_create_session" as never);
        const token = (rows as unknown as { session_token: string }[] | null)?.[0]?.session_token;
        if (error || !token) throw new Error("create");
        await supabase.rpc("quiz_update_session" as never, { _token: token, _quiz_data: { quick_check: a } as never, _current_step: steps.length, _score: null, _purpose: a.goal, _completed: true } as never);
        await supabase.rpc("record_session_consent" as never, { _token: token, _type: "quick_check", _version: CONSENT_VERSIONS.quick_check, _ua: navigator.userAgent } as never);
        const { data: r } = await supabase.from("market_rates").select("prime,fixed_not_linked,fixed_linked,variable_5,cpi_annual,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (!r) throw new Error("rates");
        return { token, r };
      })();
      const [{ token, r }] = await Promise.all([work, timer]);
      localStorage.setItem(STORE, JSON.stringify({ token, answers: a }));
      await new Promise((res) => setTimeout(res, 300));
      setResult({ token, rates: r as unknown as Rates, updated: (r as { updated_at?: string }).updated_at });
      window.scrollTo({ top: 0 });
    } catch {
      setErr("לא הצלחנו להציג את התוצאה כרגע. נסו שוב בעוד רגע.");
    } finally { setProcessing(-1); }
  };

  if (result) return <ResultView a={a} loan={loan} years={years} refi={refi} rates={result.rates} updated={result.updated} token={result.token} />;

  if (processing >= 0) return (
    <div className="container py-16 max-w-md" role="status" aria-live="polite">
      <div className={`bg-card border border-border rounded-2xl p-6 space-y-4 ${ANIM}`}>
        <h1 className="font-display text-2xl font-bold text-foreground text-center">מכינים את התוצאה שלכם</h1>
        <ul className="space-y-3">
          {PROCESS.map((p, n) => (
            <li key={p} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${n < processing ? "bg-success text-success-foreground" : "bg-muted"}`}>
                {n < processing ? <Check size={16} aria-hidden="true" /> : n === processing ? <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse motion-reduce:animate-none" aria-hidden="true" /> : null}
              </span>
              <span className={n <= processing ? "text-foreground font-bold" : "text-muted-foreground"}>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const pct = Math.round(((i + 1) / steps.length) * 100);
  const derived = key === "equity" ? `סכום המשכנתא הנדרש: ${nis(loan)}` : key === "value" ? `עם ${nis(a.equity)} הון עצמי: משכנתא של ${nis(Math.max(0, a.value - a.equity))}` : key === "income" ? `הכנסה פנויה אחרי החזרים: ${nis(Math.max(0, a.income - a.obligations))}` : key === "yearsLeft" ? `כ-${a.yearsLeft * 12} תשלומים נותרו` : "";
  const q: Record<string, { title: string; body: JSX.Element }> = {
    goal: { title: "מה המטרה?", body: <Cards name="מטרה" opts={OPTS.goal} value={a.goal} onPick={pick("goal")} /> },
    timing: { title: "מתי צריך את הכסף?", body: <Cards name="מועד" opts={OPTS.timing} value={a.timing} onPick={pick("timing")} /> },
    propertyType: { title: "איזה נכס?", body: <Cards name="סוג נכס" opts={OPTS.propertyType} value={a.propertyType} onPick={pick("propertyType")} /> },
    city: { title: "באיזו עיר?", body: <div className="space-y-3"><input aria-label="עיר" className="w-full h-14 rounded-xl border border-input bg-background px-4 text-lg" value={a.city === "unknown" ? "" : a.city || ""} onChange={(e) => set({ city: e.target.value })} placeholder="שם העיר" /><Button variant="outline" onClick={() => { set({ city: "unknown" }); advance(); }}>לא ידוע עדיין</Button></div> },
    value: { title: "מה שווי הנכס?", body: <Money label="שווי הנכס" value={a.value} onChange={(v) => set({ value: v })} min={300_000} max={10_000_000} step={50_000} /> },
    equity: { title: "כמה הון עצמי יש לכם?", body: <Money label="הון עצמי" value={a.equity} onChange={(v) => set({ equity: v })} min={0} max={Math.max(a.value, 500_000)} step={10_000} /> },
    borrowers: { title: "כמה לווים?", body: <div className="space-y-4"><Cards name="לווים" opts={OPTS.borrowers} value={a.borrowers} onPick={(v) => set({ borrowers: v })} /><label className="block text-sm text-muted-foreground">שם פרטי (לא חובה)<input className="w-full h-12 rounded-xl border border-input bg-background px-3" value={a.firstName} maxLength={40} onChange={(e) => set({ firstName: e.target.value })} /></label></div> },
    income: { title: "הכנסה והחזרים", body: <div className="space-y-6"><Money label="הכנסה חודשית נטו משוערת של כל הלווים" value={a.income} onChange={(v) => set({ income: v })} min={0} max={100_000} step={500} /><p className="text-sm text-muted-foreground -mt-3">הכנסה חודשית נטו משוערת של כל הלווים</p><Money label="החזרים חודשיים קיימים" value={a.obligations} onChange={(v) => set({ obligations: v })} min={0} max={30_000} step={100} /><p className="text-sm text-muted-foreground -mt-3">החזרים חודשיים קיימים (הלוואות, ליסינג){refi ? " – לא כולל המשכנתא" : ""}</p></div> },
    balance: { title: "מה יתרת המשכנתא?", body: <Money label="יתרת המשכנתא" value={a.balance} onChange={(v) => set({ balance: v })} min={50_000} max={5_000_000} step={10_000} /> },
    currentPayment: { title: "מה ההחזר החודשי היום?", body: <Money label="החזר חודשי נוכחי" value={a.currentPayment} onChange={(v) => set({ currentPayment: v })} min={500} max={40_000} step={100} /> },
    yearsLeft: { title: "כמה שנים נותרו?", body: <Money label="שנים שנותרו" suffix="שנים" value={a.yearsLeft} onChange={(v) => set({ yearsLeft: Math.min(30, v) })} min={1} max={30} step={1} /> },
  };
  const autoCards = ["goal", "timing", "propertyType"].includes(key);
  const extras = a.value * EXTRA_COSTS_RATE;
  const ltv = a.value > 0 ? (loan / a.value) * 100 : 0;

  return (
    <div className="container py-8 md:py-14 max-w-2xl space-y-6 pb-28 md:pb-14">
      <header className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-success/15 text-foreground text-sm font-bold">חינם · בלי הרשמה</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">בדיקת המשכנתא שלי</h1>
      </header>
      <div className="space-y-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="התקדמות בבדיקה">
        <div className="flex justify-between text-xs text-muted-foreground"><span>שאלה {i + 1} מתוך {steps.length}</span><span className="font-bold text-foreground">{pct}%</span></div>
        <div className="relative h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
          <span className="absolute -top-3 w-8 h-8 -mr-4 rounded-full bg-card border-2 border-primary flex items-center justify-center transition-all duration-300 motion-reduce:transition-none" style={{ right: `${pct}%` }} aria-hidden="true"><Home size={14} className="text-primary" /></span>
        </div>
      </div>
      <section key={key} className={`bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5 ${ANIM}`}>
        <h2 className="font-display text-2xl font-bold text-foreground">{q[key].title}</h2>
        {q[key].body}
        {derived && <p className="rounded-xl bg-primary/10 p-3 font-bold text-foreground" aria-live="polite">{derived}</p>}
        <button type="button" className="text-sm text-primary underline" aria-expanded={why} onClick={() => setWhy((w) => !w)}>למה אנחנו שואלים?</button>
        {why && <p className="text-sm text-muted-foreground">{WHY[key]}</p>}
        {last && (
          <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-muted/50 p-3">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1" />
            <span className="text-sm text-foreground">אני מאשר/ת ל-EasyMorte לעבד את הנתונים שמסרתי לצורך הצגת התוצאה, בהתאם ל<Link to="/privacy" target="_blank" className="text-primary underline">מדיניות הפרטיות</Link>.</span>
          </label>
        )}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <div className="fixed md:static bottom-0 inset-x-0 z-30 flex justify-between gap-2 bg-background/95 md:bg-transparent border-t md:border-0 border-border p-3 md:p-0">
          <Button variant="ghost" disabled={i === 0} onClick={() => { setWhy(false); setI((n) => n - 1); }}><ChevronRight size={16} /> חזרה</Button>
          {last ? <Button variant="cta" disabled={!consent} onClick={showResult}>הצג לי את התוצאה</Button>
            : !autoCards && <Button variant="cta" onClick={next} className="flex-1 md:flex-none">המשך</Button>}
        </div>
        {i === 0 && <p className="text-xs text-muted-foreground">הנתונים שתמסרו ישמשו להצגת התוצאה בלבד, בהתאם ל<Link to="/privacy" className="underline">מדיניות הפרטיות</Link>.</p>}
      </section>
      <p className="text-center text-sm text-muted-foreground">יש לכם דוח יתרות? <Link to="/balance-check" className="text-primary underline">בדיקה לפי דוח יתרות לסילוק</Link></p>

      <Dialog open={interim} onOpenChange={setInterim}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-right">התמונה שלכם עד עכשיו</DialogTitle><DialogDescription className="text-right">חלוקת מחיר הנכס לפי מה שמסרתם</DialogDescription></DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <Donut parts={[{ label: "הון עצמי", value: a.equity, color: "stroke-success" }, { label: "משכנתא", value: loan, color: "stroke-navy" }, { label: "הוצאות נוספות", value: extras, color: "stroke-warning" }]} />
            <table className="w-full text-sm">
              <tbody>
                {[["bg-success", "הון עצמי", a.equity], ["bg-navy", "משכנתא", loan], ["bg-warning", "הוצאות נוספות (הערכה: כ-2%)", extras]].map(([c, l, v]) => (
                  <tr key={l as string} className="border-b border-border"><td className="py-2"><span className={`inline-block w-2.5 h-2.5 rounded-full ml-2 ${c}`} aria-hidden="true" />{l}</td><td className="py-2 text-left font-bold text-foreground">{nis(v as number)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="w-full rounded-xl bg-muted/50 p-3 space-y-1">
              <p className="flex items-center justify-between font-bold text-foreground">אחוז מימון (LTV): {ltv.toFixed(0)}% <GradePill g={ltvGrade(ltv)} /></p>
              <p className="text-sm text-muted-foreground">{GRADE_LINE.ltv[ltvGrade(ltv)]}</p>
            </div>
            <Button variant="cta" className="w-full" onClick={() => { setInterim(false); advance(); }}>המשך</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultView({ a, loan, years, refi, rates, updated, token }: { a: A; loan: number; years: number; refi: boolean; rates: Rates; updated?: string; token: string }) {
  const mixes: Mix[] = useMemo(() => buildMixes(loan, years, rates), [loan, years, rates]);
  const ltv = !refi && a.value > 0 ? (loan / a.value) * 100 : null;
  const basePay = mixes[1]?.monthly ?? 0;
  const dti = a.income > 0 ? ((basePay + a.obligations) / a.income) * 100 : null;
  const [detail, setDetail] = useState<Mix | null>(null);
  const [email, setEmail] = useState(""); const [mkt, setMkt] = useState(false); const [mail, setMail] = useState(""); const [openMail, setOpenMail] = useState(false);
  useEffect(() => { document.title = "התוצאה שלכם | EasyMorte"; }, []);

  const sendMail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMail("כתובת מייל לא תקינה");
    setMail("שולח...");
    if (mkt) await supabase.rpc("record_session_consent" as never, { _token: token, _type: "marketing", _version: CONSENT_VERSIONS.marketing, _ua: navigator.userAgent } as never);
    const { data, error } = await supabase.functions.invoke("send-quick-result", { body: { token, email, first_name: a.firstName, ltv, dti, mixes: mixes.map((m) => ({ name: m.name, risk: m.risk, monthly: m.monthly, total: m.total })) } });
    setMail(error || !data?.ok ? "השליחה נכשלה, נסו שוב" : "התוצאה נשלחה למייל");
  };

  const Metric = ({ title, value, g, line, empty }: { title: string; value: number | null; g?: Grade; line?: string; empty: string }) => (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      {value === null || !g ? <p className="font-bold text-foreground">{empty}</p> : <>
        <div className="flex items-center gap-3"><span className="font-display text-4xl font-black text-foreground">{value.toFixed(0)}%</span><GradePill g={g} /></div>
        <p className="text-sm text-muted-foreground">{line}</p></>}
    </div>
  );

  return (
    <div className={`container py-10 md:py-14 max-w-5xl space-y-8 pb-28 md:pb-14 ${ANIM}`}>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center">{a.firstName.trim() ? `${a.firstName.trim()}, זו התוצאה שלך` : "התוצאה שלכם"}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Metric title="אחוז מימון (LTV)" value={ltv} g={ltv !== null ? ltvGrade(ltv) : undefined} line={ltv !== null ? GRADE_LINE.ltv[ltvGrade(ltv)] : ""} empty="לא חושב במחזור ללא שווי נכס" />
        <Metric title="יחס החזר להכנסה (DTI)" value={dti} g={dti !== null ? dtiGrade(dti) : undefined} line={dti !== null ? GRADE_LINE.dti[dtiGrade(dti)] : ""} empty="נדרשת הכנסה לחישוב" />
      </div>
      {refi && <p className="text-sm text-foreground">ההחזר החודשי היום: {nis(a.currentPayment)}. השוו אותו להחזר בתמהילים למטה.</p>}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2">
        {mixes.map((m) => (
          <article key={m.name} className="snap-center shrink-0 w-[80%] md:w-auto bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className={`h-2 ${RISK_BAR[m.risk]}`} aria-hidden="true" />
            <div className="p-5 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2"><h2 className="font-display font-bold text-lg text-foreground">{m.name}</h2><span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">סיכון {m.risk}</span></div>
              <div><p className="text-xs text-muted-foreground">החזר חודשי משוער</p><p className="font-display text-3xl font-black text-foreground">{nis(m.monthly)}</p></div>
              <p className="text-sm text-muted-foreground">החזר כולל משוער: <strong className="text-foreground">{nis(m.total)}</strong></p>
              <Button variant="outline" className="mt-auto" onClick={() => setDetail(m)}>לפירוט התמהיל</Button>
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">הערכה לפי ריביות ממוצעות שמפורסמות על ידי בנק ישראל{updated ? ` (עודכן ${new Date(updated).toLocaleDateString("he-IL")})` : ""}. התנאים הסופיים נקבעים על ידי הבנק.</p>

      <section className="bg-navy text-primary-foreground rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="font-display text-2xl font-bold">את המכרז מול הבנקים אנחנו סוגרים בשבילכם.</h2>
        <ul className="space-y-2">
          {["בלי לרוץ בין סניפים", "בלי טלפונים", "מכרז מול כמה בנקים במקביל", "יועצת מקצועית מלווה עד החתימה"].map((x) => <li key={x} className="flex gap-2"><Check size={18} className="text-success shrink-0" aria-hidden="true" />{x}</li>)}
        </ul>
        <p className="text-lg font-bold">₪3,450 כולל מע"מ · עד 4 תשלומים</p>
        <div className="fixed md:static bottom-0 inset-x-0 z-30 p-3 md:p-0 bg-background/95 md:bg-transparent border-t md:border-0 border-border">
          <Link to="/auth?next=/intake" className="block md:inline-block"><Button variant="cta" size="lg" className="w-full md:w-auto">מתחילים</Button></Link>
        </div>
        <div>
          <button type="button" className="text-sm underline text-primary-foreground/90" aria-expanded={openMail} onClick={() => setOpenMail((o) => !o)}>שלחו לי את התוצאה למייל</button>
          {openMail && (
            <div className="mt-3 space-y-2 max-w-sm">
              <input type="email" dir="ltr" aria-label="כתובת מייל" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-10 rounded-lg border border-input bg-background text-foreground px-3" />
              <label className="flex items-start gap-2 text-sm"><Checkbox checked={mkt} onCheckedChange={(v) => setMkt(v === true)} className="mt-0.5 border-primary-foreground" />אשמח לקבל עדכונים ותוכן שיווקי</label>
              <Button variant="outline" size="sm" onClick={sendMail} className="text-foreground">שליחה</Button>
              {mail && <p className="text-sm" role="status">{mail}</p>}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          {detail && <>
            <DialogHeader><DialogTitle className="font-display text-right">{detail.name} · סיכון {detail.risk}</DialogTitle><DialogDescription className="text-right">החזר חודשי משוער {nis(detail.monthly)} · החזר כולל {nis(detail.total)}</DialogDescription></DialogHeader>
            <Tabs defaultValue="tracks" dir="rtl">
              <TabsList className="w-full"><TabsTrigger value="tracks" className="flex-1">מסלולים</TabsTrigger><TabsTrigger value="pc" className="flex-1">יתרונות וחסרונות</TabsTrigger></TabsList>
              <TabsContent value="tracks">
                <table className="w-full text-sm">
                  <thead><tr className="text-muted-foreground text-right"><th className="py-2 font-normal">מסלול</th><th className="font-normal">סכום</th><th className="font-normal">שנים</th><th className="font-normal">ריבית</th></tr></thead>
                  <tbody>{detail.tracks.map((t) => (
                    <tr key={t.key} className="border-t border-border text-foreground">
                      <td className="py-2"><span className={`inline-block w-2.5 h-2.5 rounded-full ml-2 ${TRACK_DOT[t.key]}`} aria-hidden="true" />{TRACK_LABEL[t.key]} <span className="text-muted-foreground">({Math.round((t.amount / loan) * 100)}%)</span></td>
                      <td>{nis(t.amount)}</td><td>{t.years}</td><td dir="ltr" className="text-right">{t.rate.toFixed(2)}%</td>
                    </tr>))}</tbody>
                </table>
              </TabsContent>
              <TabsContent value="pc">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><h3 className="font-bold text-foreground mb-2">יתרונות</h3><ul className="space-y-1.5">{PROS_CONS[detail.risk].pros.map((p) => <li key={p} className="flex gap-1.5 text-foreground"><Check size={16} className="text-success shrink-0" aria-hidden="true" />{p}</li>)}</ul></div>
                  <div><h3 className="font-bold text-foreground mb-2">חסרונות</h3><ul className="space-y-1.5 list-disc pr-4 text-foreground">{PROS_CONS[detail.risk].cons.map((p) => <li key={p}>{p}</li>)}</ul></div>
                </div>
              </TabsContent>
            </Tabs>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
