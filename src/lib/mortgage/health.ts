// "מדד מצב המשכנתא": a product heuristic (0-100) describing how efficient / resilient the
// mortgage looks from the data we have. It is NOT a bank approval score or a credit score.

export interface HealthInput {
  dti?: number | null;            // (mortgage payment + obligations) / net income, 0..1
  ltv?: number | null;            // loan / property value, 0..1
  variableShare?: number | null;  // share of prime + variable tracks, 0..1
  linkedShare?: number | null;    // share of CPI-linked tracks, 0..1
  kinds?: number | null;          // number of different track types
  remainingYears?: number | null;
  rateGap?: number | null;        // refinance only: current weighted rate minus market reference, % points
}

export interface HealthFactor { key: string; label: string; score: number; weight: number; text: string }

export interface HealthResult {
  score: number;                  // rounded to 5
  band: "good" | "check" | "review";
  bandLabel: string;
  factors: HealthFactor[];        // only the factors that had data
  missing: string[];              // human labels of factors without data
  reasons: string[];              // 2-3 plain-Hebrew explanations, weakest first
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const ok = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export const MIN_FACTORS = 3;

export function healthScore(input: HealthInput): HealthResult | null {
  const factors: HealthFactor[] = [];
  const missing: string[] = [];
  const add = (key: string, label: string, weight: number, value: unknown, fn: (v: number) => [number, string]) => {
    if (!ok(value) || value < 0) { missing.push(label); return; }
    const [score, text] = fn(value);
    factors.push({ key, label, weight, score, text });
  };

  add("dti", "יחס החזר להכנסה", 25, input.dti, (v) =>
    v <= 0.3 ? [100, `ההחזר החודשי הוא כ-${pct(v)} מההכנסה, טווח נוח.`]
    : v <= 0.4 ? [70, `ההחזר החודשי הוא כ-${pct(v)} מההכנסה. אפשרי, אבל משאיר פחות מרווח.`]
    : v <= 0.5 ? [35, `ההחזר החודשי הוא כ-${pct(v)} מההכנסה, גבוה יחסית.`]
    : [10, `ההחזר החודשי גבוה מחצי מההכנסה (${pct(v)}). כדאי לבדוק מבנה אחר.`]);

  add("ltv", "אחוז מימון", 15, input.ltv, (v) =>
    v <= 0.5 ? [100, `המשכנתא היא כ-${pct(v)} משווי הנכס.`]
    : v <= 0.6 ? [85, `המשכנתא היא כ-${pct(v)} משווי הנכס.`]
    : v <= 0.75 ? [65, `אחוז מימון של כ-${pct(v)}. בנקים מתמחרים מימון גבוה בריבית גבוהה יותר.`]
    : [30, `אחוז מימון של כ-${pct(v)}, מעל המקובל לדירה יחידה.`]);

  add("variable", "חשיפה לריבית משתנה", 15, input.variableShare, (v) =>
    v <= 0.34 ? [100, `כ-${pct(v)} מהמשכנתא בריבית שיכולה להשתנות.`]
    : v <= 0.5 ? [75, `כ-${pct(v)} מהמשכנתא בריבית שיכולה להשתנות. עלייה בריבית תשפיע על ההחזר.`]
    : v <= 0.67 ? [50, `יותר ממחצית המשכנתא (${pct(v)}) בריבית משתנה.`]
    : [25, `רוב המשכנתא (${pct(v)}) בריבית משתנה. ההחזר רגיש לשינויי ריבית.`]);

  add("linked", "הצמדה למדד", 10, input.linkedShare, (v) =>
    v <= 0.34 ? [100, `כ-${pct(v)} מהמשכנתא צמוד למדד.`]
    : v <= 0.5 ? [70, `כ-${pct(v)} מהמשכנתא צמוד למדד. אינפלציה מגדילה את היתרה.`]
    : [45, `רוב המשכנתא (${pct(v)}) צמוד למדד. אינפלציה מגדילה את היתרה ואת ההחזר.`]);

  add("mix", "פיזור בין מסלולים", 10, input.kinds, (v) =>
    v >= 3 ? [100, `המשכנתא מפוזרת על ${v} סוגי מסלולים.`]
    : v === 2 ? [75, "המשכנתא מפוזרת על 2 סוגי מסלולים."]
    : [50, "כל המשכנתא במסלול מסוג אחד. פיזור יכול להקטין סיכון."]);

  add("term", "תקופה שנותרה", 5, input.remainingYears, (v) =>
    v <= 25 ? [100, `נותרו כ-${Math.round(v)} שנים.`]
    : [75, `תקופה ארוכה (כ-${Math.round(v)} שנים) מגדילה את סך הריבית.`]);

  add("cost", "עלות מול ריביות השוק", 20, input.rateGap, (v) =>
    v <= 0.25 ? [100, "הריבית הממוצעת קרובה לריביות השוק הנוכחיות."]
    : v <= 0.75 ? [70, `הריבית הממוצעת גבוהה בכ-${v.toFixed(1)} נקודות אחוז מהשוק. ייתכן פוטנציאל לחיסכון.`]
    : v <= 1.25 ? [45, `הריבית הממוצעת גבוהה בכ-${v.toFixed(1)} נקודות אחוז מהשוק. כדאי לבדוק מחזור.`]
    : [25, `הריבית הממוצעת גבוהה בכ-${v.toFixed(1)} נקודות אחוז מהשוק. פוטנציאל משמעותי לבדיקה.`]);

  if (factors.length < MIN_FACTORS) return null;
  const wsum = factors.reduce((s, f) => s + f.weight, 0);
  const raw = factors.reduce((s, f) => s + f.score * f.weight, 0) / wsum;
  const score = Math.min(100, Math.max(0, Math.round(raw / 5) * 5));
  const band = score >= 80 ? "good" : score >= 60 ? "check" : "review";
  const bandLabel = band === "good" ? "נראה יעיל כרגע" : band === "check" ? "כדאי לבדוק" : "פוטנציאל משמעותי לבדיקה";
  const sorted = [...factors].sort((a, b) => a.score - b.score || b.weight - a.weight);
  const weak = sorted.filter((f) => f.score < 75).slice(0, 2).map((f) => f.text);
  const strong = [...factors].sort((a, b) => b.score - a.score || b.weight - a.weight).filter((f) => f.score >= 85).slice(0, 3 - weak.length).map((f) => f.text);
  return { score, band, bandLabel, factors, missing, reasons: [...weak, ...strong].slice(0, 3) };
}
