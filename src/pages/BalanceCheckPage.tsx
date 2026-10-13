import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Upload, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type TrackType = "prime" | "fixed_nl" | "fixed_l" | "var5" | "var_l";
const TYPES: Record<TrackType, { label: string; rateKey: string | null }> = {
  prime: { label: "פריים", rateKey: "prime" },
  fixed_nl: { label: "קבועה לא צמודה", rateKey: "fixed_not_linked" },
  fixed_l: { label: "קבועה צמודה", rateKey: "fixed_linked" },
  var5: { label: "משתנה כל 5 לא צמודה", rateKey: "variable_5" },
  var_l: { label: "משתנה כל 5 צמודה", rateKey: null },
};

interface MarketRates {
  prime?: number;
  fixed_not_linked?: number;
  fixed_linked?: number;
  variable_5?: number;
  updated_at?: string;
  source?: string;
}
interface Track { type: TrackType; balance: number; rate: number; years: number }

const BANKS = [
  { name: "לאומי", path: "אתר/אפליקציית לאומי ← משכנתאות ← המשכנתא שלי ← דוח יתרות לסילוק ← הורדת PDF" },
  { name: "הפועלים", path: "אתר הפועלים ← משכנתאות ← פרטי המשכנתא ← אישור יתרה לסילוק ← הורדה" },
  { name: "מזרחי טפחות", path: "אתר מזרחי טפחות ← משכנתאות ← מסמכים ואישורים ← דוח יתרות לסילוק" },
  { name: "דיסקונט", path: "אתר דיסקונט ← הלוואות ומשכנתאות ← המשכנתא שלי ← אישור יתרה לסילוק" },
  { name: "הבינלאומי", path: "אתר הבינלאומי ← משכנתאות ← מידע על ההלוואה ← דוח יתרות לסילוק" },
  { name: "ירושלים", path: "אתר בנק ירושלים ← משכנתאות ← האזור האישי ← בקשת דוח יתרות לסילוק" },
];

const pmt = (b: number, r: number, y: number) => {
  const n = y * 12, m = r / 1200;
  return m ? (b * m) / (1 - Math.pow(1 + m, -n)) : b / n;
};
const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;

function analyze(t: Track, rates: MarketRates | null) {
  const key = TYPES[t.type].rateKey;
  const market = key && rates ? Number((rates as any)[key]) : 0;
  if (!market || !t.rate || !t.balance || !t.years) {
    return { color: "bg-muted-foreground", tone: "text-muted-foreground", label: "נדרשים עוד נתונים", gap: null as number | null, saving: 0 };
  }
  const gap = t.rate - market;
  const saving = Math.max(0, pmt(t.balance, t.rate, t.years) - pmt(t.balance, market, t.years));
  if (gap >= 0.8) return { color: "bg-destructive", tone: "text-destructive", label: "פוטנציאל משמעותי לבדיקה", gap, saving };
  if (gap >= 0.3) return { color: "bg-warning", tone: "text-warning", label: "כדאי לבדוק", gap, saving };
  return { color: "bg-success", tone: "text-success", label: "נראה יעיל כרגע", gap, saving };
}

export default function MortgageCheckPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [tracks, setTracks] = useState<Track[]>([{ type: "prime", balance: 0, rate: 0, years: 0 }]);
  const [show, setShow] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState("");
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
      const { data, error } = await supabase.functions.invoke("parse-balance-report", { body: { file: b64, mime: f.type, name: f.name } });
      if (error || data?.error) throw new Error(data?.error || "הניתוח נכשל");
      if (!data.tracks?.length) { setParseMsg("לא זוהו מסלולים בדוח. אפשר להזין ידנית למטה."); return; }
      setTracks(data.tracks.slice(0, 12));
      setShow(true);
      setParseMsg(`זוהו ${data.tracks.length} מסלולים${data.bank ? ` (${data.bank})` : ""}. בדקו שהנתונים תואמים לדוח.`);
    } catch (e: any) {
      setParseMsg(e.message || "הניתוח נכשל, אפשר להזין ידנית");
    } finally { setParsing(false); }
  };

  useEffect(() => {
    supabase.from("market_rates").select("prime,fixed_not_linked,fixed_linked,variable_5,updated_at,source")
      .order("updated_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setMarketRates((data as MarketRates | null) ?? null));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const upd = (i: number, k: keyof Track, v: string) =>
    setTracks((ts) => ts.map((t, j) => (j === i ? { ...t, [k]: k === "type" ? v : Number(v) } : t)));
  const results = tracks.map((t) => analyze(t, marketRates));
  const total = results.reduce((a, r) => a + r.saving, 0);
  const input = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="container py-10 md:py-14 max-w-4xl space-y-10">
      <header className="text-center space-y-3">
        <span className="inline-block px-3 py-1 rounded-full bg-success/15 text-success text-sm font-bold">חינם · ללא התחייבות</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">בדיקת המשכנתא שלי: דוח יתרות והמלצה חינם</h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          הזינו את המסלולים מדוח היתרות לסילוק וקבלו לכל מסלול המלצה ברורה: להשאיר, לתקן בבנק הנוכחי או למחזר. הבדיקה חינמית ודורשת הרשמה קצרה בלבד.
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
          <Link to="/auth?next=/mortgage-check"><Button variant="cta">הרשמה והעלאת הדוח</Button></Link>
        )}
        {parseMsg && <p className="text-sm text-foreground">{parseMsg}</p>}
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
            <label className="text-xs text-muted-foreground">יתרה (₪)<input type="number" className={input} value={t.balance || ""} onChange={(e) => upd(i, "balance", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">ריבית (%)<input type="number" step="0.01" className={input} value={t.rate || ""} onChange={(e) => upd(i, "rate", e.target.value)} /></label>
            <label className="text-xs text-muted-foreground">שנים שנותרו<input type="number" className={input} value={t.years || ""} onChange={(e) => upd(i, "years", e.target.value)} /></label>
            <Button variant="ghost" size="icon" aria-label="הסרת מסלול" disabled={tracks.length === 1} onClick={() => setTracks((ts) => ts.filter((_, j) => j !== i))}><Trash2 size={16} /></Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="outline" size="sm" disabled={tracks.length >= 12} onClick={() => setTracks((ts) => [...ts, { type: "fixed_nl", balance: 0, rate: 0, years: 0 }])}><Plus size={16} /> הוספת מסלול</Button>
          <Button variant="cta" onClick={() => setShow(true)}>קבלו המלצה חינם</Button>
        </div>
      </section>

      {show && (loggedIn ? (
        <section className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">הבדיקה הראשונית שלכם</h2>
          <p className="text-xs text-muted-foreground">
            ההשוואה משתמשת בנתוני הריבית השמורים במערכת{marketRates?.updated_at ? `, שעודכנו ב-${new Date(marketRates.updated_at).toLocaleDateString("he-IL")}` : ""}. זו נקודת ייחוס בלבד ולא הצעת בנק.
          </p>
          {tracks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border pb-3">
              <span className={`w-3 h-3 rounded-full ${results[i].color}`} aria-hidden="true" />
              <div className="flex-1">
                <p className="font-bold text-foreground">{TYPES[t.type].label} · {nis(t.balance)}</p>
                <p className="text-xs text-muted-foreground">
                  {results[i].gap === null ? "אין כרגע נתון השוואה אמין למסלול הזה" : `פער מול נתון הייחוס במערכת: ${results[i].gap.toFixed(2)}%`}
                </p>
              </div>
              <div className="text-left">
                <p className={`font-bold text-sm ${results[i].tone}`}>{results[i].label}</p>
                {results[i].saving > 0 && <p className="text-xs text-muted-foreground">חיסכון משוער {nis(results[i].saving)}/חודש</p>}
              </div>
            </div>
          ))}
          <p className="font-display font-bold text-lg text-foreground">חיסכון חודשי משוער: {nis(total)}</p>
          <p className="text-xs text-muted-foreground">זו בדיקה אוטומטית ראשונית בלבד. היא אינה כוללת בהכרח עמלת פירעון מוקדם, הצמדה, תחנות שינוי, עלויות מעבר או שינויים עתידיים בריבית ואינה מהווה ייעוץ או הצעת בנק. לפני ביצוע מחזור נדרשת בדיקה מקצועית של דוח היתרות המלא.</p>
          {total > 0 && (
            <div className="rounded-xl bg-primary/10 p-4 space-y-3">
              <p className="font-bold text-foreground">זיהינו פוטנציאל לשיפור – רוצים שנבנה חלופת מחזור ונוציא את הבנקים למכרז?</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/intake"><Button variant="cta">מחזור משכנתא מלא – 3,450 ₪ מחיר קבוע</Button></Link>
                <Link to="/dashboard/documents"><Button variant="outline"><Upload size={16} /> העלאת דוח יתרות לאזור האישי</Button></Link>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-card border border-primary/40 rounded-2xl p-6 text-center space-y-3">
          <Lock className="mx-auto text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">ההמלצה מוכנה – נשאר רק להירשם</h2>
          <p className="text-sm text-muted-foreground">הרשמה קצרה (או כניסה עם Google) שומרת את התוצאות באזור האישי שלכם. חינם לגמרי.</p>
          <Link to="/auth"><Button variant="cta">הרשמה וקבלת ההמלצה</Button></Link>
        </section>
      ))}

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">איך מורידים דוח יתרות לסילוק בכל בנק</h2>
        <p className="text-muted-foreground text-sm">הדוח ניתן בחינם באזור האישי באתר או באפליקציית הבנק. שמרו אותו כקובץ PDF והעלו אותו לאזור האישי ב-EasyMorte.</p>
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
