import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload, Lock } from "lucide-react";
import { REPORT_STATUS_TEXT, type ReportIssue, type ReportStatus } from "@/lib/mortgage/balanceReportView";
import { analyzeBalanceTrack, BALANCE_CHECK_STORE, BALANCE_TRACK_TYPES, parseInput, referenceDates, STATUS_TEXT, summarizeBalance, type BalanceTrack, type BalanceTrackType, type TrackStatus } from "@/lib/mortgage/balanceCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `bc-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function MortgageCheckPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([{ type: "prime", balance: null, rate: null, years: null }]);
  const [show, setShow] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");
  const [sources, setSources] = useState<number[][]>([]);
  const [analysis, setAnalysis] = useState<{ id: string | null; status: ReportStatus | null; issues: ReportIssue[] } | null>(null);
  const [marketRates, setMarketRates] = useState<MarketRates | null>(null);

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
    try { localStorage.setItem(BALANCE_CHECK_STORE, JSON.stringify({ id: newId(), analysis_id: analysis?.id ?? null, report_status: analysis?.status ?? null, tracks, saved_at: new Date().toISOString() })); } catch { /* storage blocked */ }
    navigate(loggedIn ? "/intake" : "/auth?next=/intake");
  };
  const anyData = tracks.some((t) => t.balance !== null || t.rate !== null || t.years !== null);
  const input = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="container py-10 md:py-14 max-w-4xl space-y-10">
      <header className="text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-success/15 text-success text-sm font-bold">חינם · ללא התחייבות</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">בדיקת המשכנתא שלי: דוח יתרות ובדיקה ראשונית חינם</h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          הזינו את המסלולים מדוח היתרות לסילוק וקבלו בדיקה ראשונית לכל מסלול: מה כדאי לבדוק לעומק ומה כדאי לשמור. זו לא מסקנה על כל המשכנתה, וממנה ממשיכים לבדיקה מלאה ללא עלות.
        </p>
      </header>

      <section className="bg-card border-2 border-dashed border-primary/40 rounded-2xl p-6 text-center space-y-3">
        <Upload className="mx-auto text-primary" />
        <h2 className="font-display text-xl font-bold text-foreground">העלו את דוח היתרות לסילוק</h2>
        <p className="text-sm text-muted-foreground">PDF או צילום של הדוח. המערכת תחלץ את המסלולים, הריביות והיתרות ותמלא אותם עבורכם.</p>
        {loggedIn ? (
          <label className="inline-block">
            <input type="file" accept="application/pdf,image/*" className="sr-only" disabled={parsing} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <span className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground font-bold cursor-pointer">{parsing ? "מנתח את הדוח..." : "בחירת קובץ"}</span>
          </label>
        ) : (
          <Link to="/auth?next=/balance-check"><Button variant="cta">הרשמה והעלאת הדוח</Button></Link>
        )}
        {parseMsg && <p className="text-sm text-foreground" role="status">{parseMsg}</p>}
        {analysis && analysis.issues.length > 0 && (
          <ul className="text-right text-sm space-y-1 max-w-xl mx-auto">
            {analysis.issues.filter((x) => x.severity !== "info").slice(0, 8).map((x, i) => <li key={i} className="text-foreground">• {x.message}</li>)}
            {analysis.issues.filter((x) => x.severity === "info").slice(0, 4).map((x, i) => <li key={`i${i}`} className="text-muted-foreground">• {x.message}</li>)}
          </ul>
        )}
      </section>

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

      {show && (loggedIn ? (
        <section className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">הבדיקה הראשונית שלכם</h2>
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
                      : `פער מול נתון הייחוס: ${r.gap > 0 ? "+" : ""}${r.gap.toFixed(2)} נקודות.`}
                    {r.status === "linked_review" && r.gap !== null ? " במסלול צמוד הקרן משתנה לפי המדד, ולכן לא חישבנו הפרש בשקלים לפי הריבית בלבד." : ""}
                    {r.status === "keep_terms" ? " מחזור מלא עלול לוותר על התנאי הזה." : ""}
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
            {summary.keep > 0 && <p className="text-sm text-muted-foreground">יש מסלולים בתנאים שכדאי לשמור. לא כל משכנתה צריכה מחזור, ולפעמים מספיק שינוי חלקי.</p>}
          </div>
          <p className="text-xs text-muted-foreground">זו בדיקה אוטומטית ראשונית בלבד. היא לא כוללת עמלת פירעון מוקדם, הצמדה למדד, תחנות שינוי, עלויות מעבר או שינויים עתידיים בריבית, ואינה ייעוץ או הצעת בנק. הקטנת החזר באמצעות הארכת תקופה אינה חיסכון ועלולה להגדיל את העלות הכוללת.</p>
          <div className="rounded-xl bg-primary/10 p-4 space-y-3">
            <p className="font-bold text-foreground">{summary.notComputed > 0 || !anyData ? "נשלים יחד את הנתונים החסרים ונבדוק את כל המשכנתה, כולל הצמדה ועמלות." : "בבדיקה המלאה נבחן את כל המשכנתה, כולל עמלות, הצמדה והשפעה על העלות הכוללת."}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="cta" onClick={continueToCheck}>{summary.notComputed > 0 || !anyData ? "השלימו איתנו את הבדיקה בחינם" : "בדקו מה אפשר לשפר במשכנתה שלי, ללא עלות"}</Button>
              <Link to="/dashboard/documents"><Button variant="outline"><Upload size={16} /> העלאת דוח יתרות לאזור האישי</Button></Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-card border border-primary/40 rounded-2xl p-6 text-center space-y-3">
          <Lock className="mx-auto text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">הבדיקה הראשונית מוכנה, נשאר רק להירשם</h2>
          <p className="text-sm text-muted-foreground">הרשמה קצרה (או כניסה עם Google) שומרת את התוצאות באזור האישי שלכם. חינם לגמרי.</p>
          <Link to="/auth?next=/balance-check"><Button variant="cta">הרשמה וצפייה בבדיקה</Button></Link>
        </section>
      ))}

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
