import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload } from "lucide-react";
import { REPORT_STATUS_TEXT, type ReportIssue, type ReportStatus } from "@/lib/mortgage/balanceReportView";
import { analyzeBalanceTrack, BALANCE_CHECK_STORE, BALANCE_TRACK_TYPES, parseInput, referenceDates, STATUS_TEXT, summarizeBalance, type BalanceTrack, type BalanceTrackType, type TrackStatus } from "@/lib/mortgage/balanceCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExistingAlternatives } from "@/components/mortgage/ExistingAlternatives";
import { diagnose } from "@/lib/mortgage/diagnosis";
import { GOAL_TEXT, type Goal } from "@/lib/mortgage/engine";

type TrackType = BalanceTrackType;
const TYPES = BALANCE_TRACK_TYPES;
type MarketRates = Record<string, unknown>;
type Track = BalanceTrack;

const BANKS = [
  { name: "לאומי", path: "אתר/אפליקציית לאומי ← משכנתאות ← המשכנתא שלי ← דוח יתרות לסילוק ← הורדת PDF" },
  { name: "הפועלים", path: "אתר הפועלים ← משכנתאות ← פרטי המשכנתא ← אישור יתרה לסילוק ← הורדה" },
  { name: "מזרחי טפחות", path: "אתר מזרחי טפחות ← משכנתאות ← מסמכים ואישורים ← דוח יתרות לסילוק" },
  { name: "דיסקונט", path: "אתר דיסקונט ← הלוואות ומשכנתאות ← המשכנתא שלי ← אישור יתרה לסילוק" },
  { name: "הבינלאומי", path: "אתר הבינלאומי ← משכנתאות ← מידע על ההלוואה ← דוח יתרות לסילוק" },
  { name: "ירושלים", path: "אתר בנק ירושלים ← משכנתאות ← האזור האישי ← בקשת דוח יתרות לסילוק" },
];

const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;
const STATUS_TONE: Record<TrackStatus, string> = {
  incomplete: "bg-muted-foreground", no_reference: "bg-muted-foreground", linked_review: "bg-warning",
  worth_checking_strong: "bg-warning", worth_checking: "bg-warning", near_reference: "bg-primary", keep_terms: "bg-navy",
};
const fromParsed = (t: any): Track => ({
  type: (t?.type in BALANCE_TRACK_TYPES ? t.type : "prime") as TrackType,
  balance: parseInput(String(t?.balance ?? "")), rate: parseInput(String(t?.rate ?? "")), years: parseInput(String(t?.years ?? "")),
});
const DRAFT_KEY = "easymort_balance_draft";
type Draft = { tracks: Track[]; show: boolean; goal: Goal | null };
/** Restores (once) what was entered before signup. Invalid or foreign content is ignored. */
function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    const d = JSON.parse(raw) as Partial<Draft>;
    if (!Array.isArray(d.tracks) || !d.tracks.length) return null;
    const tracks = d.tracks.slice(0, 12).map(fromParsed);
    const goal = typeof d.goal === "string" && d.goal in GOAL_TEXT ? (d.goal as Goal) : null;
    return { tracks, show: d.show === true, goal };
  } catch { return null; }
}
function saveDraft(d: Draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* storage blocked: the form simply starts empty */ }
}
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `bc-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function MortgageCheckPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();
  // Entered data survives the trip to signup and back (kept on this device for this tab only, never in the URL).
  const [draft] = useState(readDraft);
  const [tracks, setTracks] = useState<Track[]>(draft?.tracks ?? [{ type: "prime", balance: null, rate: null, years: null }]);
  const [show, setShow] = useState(!!draft?.show);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");
  const [sources, setSources] = useState<number[][]>([]);
  const [analysis, setAnalysis] = useState<{ id: string | null; status: ReportStatus | null; issues: ReportIssue[] } | null>(null);
  const [marketRates, setMarketRates] = useState<MarketRates | null>(null);
  const [lastPaymentTotal, setLastPaymentTotal] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(draft?.goal ?? null);
  const resultRef = useRef<HTMLElement | null>(null);

  const onFile = async (f: File) => {
    if (f.size > 8 * 1024 * 1024) return setParseMsg("הקובץ גדול מ-8MB");
    setParsing(true); setParseMsg("");
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1] ?? "");
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const { data, error } = await supabase.functions.invoke("parse-balance-report", { body: { file: b64, mime: f.type } });
      if (error || data?.error) throw new Error(data?.error || "הניתוח נכשל");
      if (!data.tracks?.length) { setParseMsg("לא זוהו מסלולים בדוח. אפשר להזין ידנית למטה."); return; }
      setTracks(data.tracks.slice(0, 12).map(fromParsed));
      setSources(data.tracks.slice(0, 12).map((t: { pages?: unknown }) => (Array.isArray(t.pages) ? t.pages.filter((n): n is number => typeof n === "number") : [])));
      setAnalysis({ id: typeof data.analysis_id === "string" ? data.analysis_id : null, status: data.status ?? null, issues: Array.isArray(data.issues) ? data.issues : [] });
      // Report's last payment: only when every track states it (never a partial sum).
      const lp = Array.isArray(data.report?.tracks) ? data.report.tracks.map((t: { last_payment?: { value?: unknown } }) => t?.last_payment?.value) : [];
      setLastPaymentTotal(lp.length && lp.every((v: unknown) => typeof v === "number" && v > 0) ? lp.reduce((a: number, b: number) => a + b, 0) : null);
      setShow(true);
      setParseMsg(`זוהו ${data.tracks.length} מסלולים. ${REPORT_STATUS_TEXT[data.status as ReportStatus] ?? "בדקו שהנתונים תואמים לדוח."}`);
    } catch (e: any) {
      setParseMsg(e.message || "הניתוח נכשל, אפשר להזין ידנית");
    } finally { setParsing(false); }
  };

  useEffect(() => {
    supabase.from("market_rates").select("*")
      .order("updated_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setMarketRates((data as MarketRates | null) ?? null));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const upd = (i: number, k: keyof Track, v: string) =>
    setTracks((ts) => ts.map((t, j) => (j === i ? { ...t, [k]: k === "type" ? v : parseInput(v) } : t)));
  const results = tracks.map((t) => analyzeBalanceTrack(t, marketRates));
  const summary = summarizeBalance(results);
  const dates = referenceDates(marketRates);
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("he-IL") : null);
  /** Keeps the entered tracks on this device and carries them into the free check, under an id. Nothing goes in the URL. */
  const continueToCheck = () => {
    try { localStorage.setItem(BALANCE_CHECK_STORE, JSON.stringify({ id: newId(), analysis_id: analysis?.id ?? null, report_status: analysis?.status ?? null, goal: chosenGoal, tracks, saved_at: new Date().toISOString() })); } catch { /* storage blocked */ }
    navigate(loggedIn ? "/intake" : "/auth?next=/intake");
  };
  const diag = diagnose(tracks, marketRates, { lastPaymentTotal });
  const chosenGoal: Goal = goal ?? diag.suggestedGoal;
  // After a report is read, the result leads: scroll to it.
  useEffect(() => { if (show && analysis) resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }); }, [show, analysis]);
  const needsCompletion = diag.state !== "ready" || results.some((r) => r.status === "incomplete");
  const anyData = tracks.some((t) => t.balance !== null || t.rate !== null || t.years !== null);
  const input = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="container py-10 md:py-14 max-w-4xl space-y-10">
      <header className="text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-success/15 text-success text-sm font-bold">חינם · ללא התחייבות</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">בדיקת המשכנתא שלי: דוח יתרות ובדיקה ראשונית חינם</h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          העלו את דוח היתרות לסילוק או הזינו את המסלולים, וקבלו תמונת מצב של המשכנתה, עד שלושה ממצאים מהנתונים וחלופות לבדיקה. זו בדיקה ראשונית, וממנה ממשיכים לבדיקה מלאה ללא עלות.
        </p>
      </header>

      <section className={`bg-card rounded-2xl text-center space-y-3 ${analysis ? "border border-border p-4" : "border-2 border-dashed border-primary/40 p-6"}`}>
        {!analysis && <>
        <Upload className="mx-auto text-primary" />
        <h2 className="font-display text-xl font-bold text-foreground">העלו את דוח היתרות לסילוק</h2>
        <p className="text-sm text-muted-foreground">PDF או צילום של הדוח. המערכת תחלץ את המסלולים, הריביות והיתרות ותמלא אותם עבורכם.</p>
        </>}
        {analysis && <h2 className="font-display text-base font-bold text-foreground">הדוח נקלט</h2>}
        {loggedIn ? (
          <label className="inline-block">
            <input type="file" accept="application/pdf,image/*" className="sr-only" disabled={parsing} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <span className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-bold cursor-pointer">{parsing ? "מנתח את הדוח..." : analysis ? "החלפת קובץ" : "בחירת קובץ"}</span>
          </label>
        ) : (
          <Link to="/auth?next=/balance-check" onClick={() => saveDraft({ tracks, show, goal })}><Button variant="cta">הרשמה והעלאת הדוח</Button></Link>
        )}
        {parseMsg && <p className="text-sm text-foreground" role="status">{parseMsg}</p>}
        {analysis && analysis.issues.length > 0 && (
          <details className="text-right max-w-xl mx-auto"><summary className="cursor-pointer text-sm text-foreground">{analysis.issues.filter((x) => x.severity !== "info").length ? "נתונים להשלמה או לאימות" : "הערות על הדוח"}</summary>
          <ul className="text-right text-sm space-y-1 mt-2">
            {analysis.issues.filter((x) => x.severity !== "info").slice(0, 8).map((x, i) => <li key={i} className="text-foreground">• {x.message}</li>)}
            {analysis.issues.filter((x) => x.severity === "info").slice(0, 4).map((x, i) => <li key={`i${i}`} className="text-muted-foreground">• {x.message}</li>)}
          </ul></details>
        )}
      </section>


      {show && (
        <section ref={resultRef} className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-5 scroll-mt-24">
          <h2 className="font-display text-xl font-bold text-foreground">הבדיקה הראשונית שלכם</h2>
          <p className="font-display text-lg font-bold text-foreground">{diag.headline}</p>
          {diag.cards.length > 0 && (
            <dl className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {diag.cards.map((c) => (
                <div key={c.key} className="rounded-xl border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{c.label}</dt>
                  <dd className="font-bold text-foreground">{c.value ?? "לא ידוע"}</dd>
                  <dd className="text-xs text-muted-foreground">{c.note}</dd>
                </div>
              ))}
            </dl>
          )}
          {diag.findings.length > 0 && (
            <ol className="space-y-3" aria-label="ממצאים עיקריים">
              {diag.findings.map((f) => (
                <li key={f.key} className="rounded-xl bg-muted/50 p-4 space-y-1">
                  <p className="font-bold text-foreground">{f.title}</p>
                  <p className="text-sm text-foreground">{f.detail}</p>
                  <p className="text-sm text-muted-foreground">מה כדאי לבדוק: {f.check}</p>
                </li>
              ))}
            </ol>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-foreground">מה הכי חשוב לכם עכשיו?</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GOAL_TEXT) as Goal[]).map((g) => (
                <button key={g} type="button" aria-pressed={chosenGoal === g} onClick={() => setGoal(g)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${chosenGoal === g ? "border-primary bg-primary/10 text-foreground font-bold" : "border-border text-foreground"}`}>{GOAL_TEXT[g]}</button>
              ))}
            </div>
          </fieldset>
          <div className="rounded-xl bg-primary/10 p-4 space-y-3">
            <p className="font-bold text-foreground">{needsCompletion || !anyData ? "נשלים יחד את הנתונים החסרים ונבדוק את כל המשכנתה, כולל הצמדה ועמלות." : "בבדיקה המלאה נבחן את כל המשכנתה לפי המטרה שבחרתם, כולל עמלות, הצמדה והשפעה על העלות הכוללת."}</p>
            <p className="text-xs text-muted-foreground">הנתונים והמטרה עוברים איתכם. אין צורך להעלות את הדוח או להזין שוב.</p>
            {!loggedIn && (
              <p className="text-xs text-muted-foreground">
                כדי לשמור את הבדיקה, לפתוח אותה שוב או להמשיך לתיק נדרשת הרשמה קצרה, והנתונים יחכו לכם אחריה.{" "}
                <Link to="/auth?next=/balance-check" onClick={() => saveDraft({ tracks, show: true, goal })} className="underline text-primary">שמירת הבדיקה באזור האישי</Link>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="cta" onClick={continueToCheck}>{needsCompletion || !anyData ? "השלימו איתנו את הבדיקה בחינם" : "בדקו איתנו מה אפשר לשפר, ללא עלות"}</Button>
            </div>
          </div>
          <ExistingAlternatives tracks={tracks} rates={marketRates} goal={chosenGoal} onGoalChange={setGoal} />
          <details className="space-y-3">
          <summary className="cursor-pointer font-bold text-foreground">פירוט לפי מסלול ומקורות</summary>
          <p className="text-xs text-muted-foreground">
            ההשוואה היא מול נתוני ייחוס כלליים, לא מול הצעה אישית של בנק.
            {fmtDate(dates.prime) ? ` ריבית הפריים עודכנה ב-${fmtDate(dates.prime)}.` : ""}
            {fmtDate(dates.others) ? ` שאר נתוני הייחוס עודכנו ב-${fmtDate(dates.others)}.` : ""}
          </p>
          {tracks.map((t, i) => {
            const r = results[i];
            return (
              <div key={i} className="flex items-start gap-3 border-b border-border pb-3">
                <span className={`mt-1.5 w-3 h-3 shrink-0 rounded-full ${STATUS_TONE[r.status]}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground">{TYPES[t.type].label}{t.balance !== null ? ` · ${nis(t.balance)}` : ""}{sources[i]?.length ? <span className="font-normal text-xs text-muted-foreground"> · מקור בדוח: עמ׳ {sources[i].join(", ")}</span> : null}</p>
                  <p className="font-bold text-sm text-foreground">{STATUS_TEXT[r.status]}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.status === "incomplete" ? `חסר: ${r.missing.join(", ")}. נתון חסר לא נספר כאפס.`
                      : r.gap === null ? (TYPES[t.type].linked ? "אין לנו נתון ייחוס למסלול הצמוד הזה. במסלול צמוד הקרן משתנה לפי המדד, ולכן הבדיקה נעשית מול דוח היתרות המלא." : "לא ניתן להשוות כרגע.")
                      : `פער מול נתון הייחוס: \u2066${r.gap > 0 ? "+" : ""}${r.gap.toFixed(2)}\u2069 נקודות.`}
                    {r.status === "linked_review" && r.gap !== null ? " במסלול צמוד הקרן משתנה לפי המדד, ולכן לא חישבנו הפרש בשקלים לפי הריבית בלבד." : ""}
                    {r.status === "keep_terms" ? " זו השוואה מול נתון כללי בלבד. לפני מחזור של המסלול הזה בודקים את העלות מול המשך שלו." : ""}
                  </p>
                  {r.monthlyDiff !== null && <p className="text-xs text-muted-foreground">תרחיש: באותה יתרה ותקופה בריבית הייחוס, ההחזר היה נמוך בכ־{nis(r.monthlyDiff)} בחודש, לפני עמלת פירעון מוקדם ועלויות מעבר.</p>}
                </div>
              </div>
            );
          })}
          <div className="space-y-1">
            {summary.knownMonthlyDiff !== null && summary.knownMonthlyDiff >= 1
              ? <p className="font-display font-bold text-lg text-foreground">הפרש חודשי בתרחיש, במסלולים שחושבו: כ־{nis(summary.knownMonthlyDiff)}</p>
              : <p className="font-display font-bold text-lg text-foreground">לא חישבנו סכום חיסכון</p>}
            {summary.notComputed > 0 && <p className="text-sm text-muted-foreground">{summary.notComputed === 1 ? "מסלול אחד לא חושב" : `${summary.notComputed} מסלולים לא חושבו`} בגלל נתון חסר, הצמדה למדד או היעדר נתון ייחוס. הם לא נספרים כאפס.</p>}
            {summary.keep > 0 && <p className="text-sm text-muted-foreground">בחלק מהמסלולים הריבית נמוכה מנתון הייחוס. לא כל משכנתה צריכה מחזור, ולפעמים מספיק שינוי חלקי.</p>}
          </div>
          </details>
          <p className="text-xs text-muted-foreground">זו בדיקה אוטומטית ראשונית בלבד. היא לא כוללת עמלת פירעון מוקדם, הצמדה למדד, תחנות שינוי, עלויות מעבר או שינויים עתידיים בריבית, ואינה ייעוץ או הצעת בנק. הקטנת החזר באמצעות הארכת תקופה אינה חיסכון ועלולה להגדיל את העלות הכוללת.</p>
          <Link to="/dashboard/documents" className="inline-flex items-center gap-2 text-sm text-primary underline"><Upload size={16} /> שמירת דוח היתרות באזור האישי</Link>
        </section>
      )}

      {show ? (
        <details className="bg-card border border-border rounded-2xl p-5 md:p-7">
          <summary className="cursor-pointer font-display font-bold text-foreground">צפייה ועריכת הנתונים ({tracks.length === 1 ? "מסלול אחד" : `${tracks.length} מסלולים`})</summary>
          <div className="space-y-4 mt-4">
        <h2 className="font-display text-xl font-bold text-foreground">נתוני המסלולים (מולאו מהדוח או הזנה ידנית)</h2>
        {tracks.map((t, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <label className="col-span-2 md:col-span-1 text-xs text-muted-foreground">סוג מסלול
              <select className={input} value={t.type} onChange={(e) => upd(i, "type", e.target.value)}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">יתרה (₪)<input type="number" className={input} value={t.balance ?? ""} onChange={(e) => upd(i, "balance", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">ריבית (%)<input type="number" step="0.01" className={input} value={t.rate ?? ""} onChange={(e) => upd(i, "rate", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">שנים שנותרו<input type="number" step="0.01" className={input} value={t.years ?? ""} onChange={(e) => upd(i, "years", e.target.value)} /></label>
            <Button variant="ghost" size="icon" aria-label="הסרת מסלול" disabled={tracks.length === 1} onClick={() => { setTracks((ts) => ts.filter((_, j) => j !== i)); setSources((ss) => ss.filter((_, j) => j !== i)); }}><Trash2 size={16} /></Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" size="sm" disabled={tracks.length >= 12} onClick={() => setTracks((ts) => [...ts, { type: "fixed_nl", balance: null, rate: null, years: null }])}><Plus size={16} /> הוספת מסלול</Button>
          <Button variant="cta" onClick={() => setShow(true)}>לבדיקה הראשונית</Button>
        </div>
          </div>
        </details>
      ) : (
        <section className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">נתוני המסלולים (מולאו מהדוח או הזנה ידנית)</h2>
        {tracks.map((t, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <label className="col-span-2 md:col-span-1 text-xs text-muted-foreground">סוג מסלול
              <select className={input} value={t.type} onChange={(e) => upd(i, "type", e.target.value)}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">יתרה (₪)<input type="number" className={input} value={t.balance ?? ""} onChange={(e) => upd(i, "balance", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">ריבית (%)<input type="number" step="0.01" className={input} value={t.rate ?? ""} onChange={(e) => upd(i, "rate", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">שנים שנותרו<input type="number" step="0.01" className={input} value={t.years ?? ""} onChange={(e) => upd(i, "years", e.target.value)} /></label>
            <Button variant="ghost" size="icon" aria-label="הסרת מסלול" disabled={tracks.length === 1} onClick={() => { setTracks((ts) => ts.filter((_, j) => j !== i)); setSources((ss) => ss.filter((_, j) => j !== i)); }}><Trash2 size={16} /></Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" size="sm" disabled={tracks.length >= 12} onClick={() => setTracks((ts) => [...ts, { type: "fixed_nl", balance: null, rate: null, years: null }])}><Plus size={16} /> הוספת מסלול</Button>
          <Button variant="cta" onClick={() => setShow(true)}>לבדיקה הראשונית</Button>
        </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">איך מורידים דוח יתרות לסילוק בכל בנק</h2>
        <p className="text-muted-foreground text-sm">הדוח ניתן בחינם באזור האישי באתר או באפליקציית הבנק. שמרו אותו כקובץ PDF והעלו אותו לאזור האישי ב-EASY MORTE.</p>
        <div className="grid md:grid-cols-2 gap-3">
          {BANKS.map((b) => (
            <div key={b.name} className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-display font-bold text-foreground mb-1">בנק {b.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.path}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">שמות התפריטים עשויים להשתנות מעט בין גרסאות האתר והאפליקציה. אם לא מצאתם, חפשו "יתרה לסילוק" בחיפוש של אתר הבנק.</p>
      </section>
    </div>
  );
}
