// Personal summary of an existing mortgage (#52): the data contract behind the result screen.
// Pure and unit-tested. Any design (ours or Lovable's) renders this object; it does not recompute.
//
// Rules: findings come only from entered/extracted data and the shared engine. Up to three, by
// importance. No negative finding is forced. A rate below a general reference is described as a
// comparison, never as advice to keep the track. Projected indexation is a forecast under a stated
// assumption, not money already paid or lost. Missing data is listed, never filled in.
import { BASE_ASSUMPTIONS, fromSimpleTracks, referenceFor, runPlan, snapshot, stressOf, type Goal } from "./engine";
import type { BalanceTrack } from "./balanceCheck";

export interface DiagnosisCard { key: "balance" | "payment" | "linked" | "variable" | "term"; label: string; value: string | null; note: string }
export interface Finding { key: "linkage" | "variable" | "rate_gap" | "long_term" | "missing"; title: string; detail: string; check: string }
export interface Diagnosis {
  state: "empty" | "partial" | "ready";
  headline: string;
  cards: DiagnosisCard[];
  /** At most three, most important first. May be empty when nothing stands out. */
  findings: Finding[];
  missing: string[];
  assumptions: string[];
  /** Suggested goal for the goal picker, from the findings. The client chooses. */
  suggestedGoal: Goal;
}

const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const yrs = (months: number) => { const y = Math.round((months / 12) * 10) / 10; return Number.isInteger(y) ? `${y}` : y.toFixed(1); };
const knownNum = (v: unknown) => { const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };

export const LINKED_SHARE_FINDING = 0.25;
export const VARIABLE_SHARE_FINDING = 0.33;
export const RATE_GAP_FINDING = 0.3;
export const LONG_TERM_MONTHS = 240;

export function diagnose(tracks: BalanceTrack[], rates: Record<string, unknown> | null | undefined, opts: { lastPaymentTotal?: number | null } = {}): Diagnosis {
  const { tracks: et, skipped } = fromSimpleTracks(tracks);
  const missing: string[] = [];
  if (skipped.length) missing.push(skipped.length === 1 ? "נתונים חסרים במסלול אחד" : `נתונים חסרים ב־${skipped.length} מסלולים`);
  const cpi = knownNum(rates?.cpi_annual);
  const hasLinked = et.some((t) => t.linked);
  if (hasLinked && cpi === null) missing.push("הנחת מדד");
  const assumptions: string[] = ["השוואת ריבית היא מול נתוני ייחוס כלליים, לא מול הצעה אישית של בנק."];

  if (!et.length) {
    return {
      state: "empty", headline: "כדי לבנות תמונת מצב צריך לפחות מסלול אחד עם סוג, יתרה, ריבית ותקופה.",
      cards: [], findings: [], missing: missing.length ? missing : ["נתוני המסלולים"], assumptions, suggestedGoal: "not_sure",
    };
  }

  const a = BASE_ASSUMPTIONS(cpi ?? 0);
  if (hasLinked && cpi !== null) assumptions.push(`הצמדה למדד: הנחת מדד שנתית קבועה של ${cpi}%.`);
  const total = et.reduce((s, t) => s + t.balance, 0);
  const plan = runPlan(et, a);
  const snap = snapshot(et, rates, a, null);
  const stress = runPlan(et, stressOf(a));
  const linkedBalance = et.filter((t) => t.linked).reduce((s, t) => s + t.balance, 0);
  const variableBalance = et.filter((t) => t.behavior !== "fixed").reduce((s, t) => s + t.balance, 0);

  const cards: DiagnosisCard[] = [
    { key: "balance", label: "יתרה במסלולים שחושבו", value: nis(total), note: "קרן כולל הפרשי הצמדה, בלי עמלות פירעון" },
    opts.lastPaymentTotal && opts.lastPaymentTotal > 0
      ? { key: "payment", label: "החזר אחרון לפי הדוח", value: nis(opts.lastPaymentTotal), note: "כפי שמופיע בדוח" }
      : { key: "payment", label: "החזר חודשי משוער", value: nis(plan.firstPayment), note: "חישוב לפי היתרה, הריבית והתקופה" },
    { key: "linked", label: "חלק צמוד למדד", value: pct(snap.stability.linkedShare), note: linkedBalance ? nis(linkedBalance) : "אין מסלול צמוד" },
    { key: "variable", label: "חלק בריבית משתנה", value: pct(snap.stability.variableShare), note: variableBalance ? nis(variableBalance) : "אין מסלול משתנה" },
    { key: "term", label: "תקופה שנותרה", value: `${yrs(plan.months)} שנים`, note: "לפי המסלול הארוך ביותר" },
  ];

  // Candidate findings, scored by weight in the mortgage. Only those that cross a threshold.
  const cands: { score: number; f: Finding }[] = [];
  if (snap.stability.linkedShare >= LINKED_SHARE_FINDING && cpi !== null) {
    cands.push({ score: snap.stability.linkedShare, f: {
      key: "linkage", title: `${pct(snap.stability.linkedShare)} מהיתרה צמודה למדד`,
      detail: `בהנחת מדד של ${cpi}% בשנה, ההצמדה צפויה להוסיף כ־${nis(plan.totalIndexation)} לקרן עד סוף התקופה. זו תחזית לפי הנחה, לא כסף ששולם או אבד.`,
      check: "האם להקטין את החלק הצמוד, ובאיזו עלות.",
    } });
  }
  if (snap.stability.variableShare >= VARIABLE_SHARE_FINDING) {
    const jump = stress.peakPayment - plan.firstPayment;
    cands.push({ score: snap.stability.variableShare, f: {
      key: "variable", title: `${pct(snap.stability.variableShare)} מהיתרה בריבית משתנה`,
      detail: `אם הריבית המשתנה תעלה ב־2 נקודות${hasLinked ? " והמדד בנקודה" : ""}, ההחזר עלול לעלות בכ־${nis(Math.max(0, jump))} בחודש בחמש השנים הראשונות.`,
      check: "האם ההחזר הזה נוח לכם גם בתרחיש כזה.",
    } });
  }
  if (snap.cost.weightedGap !== null && snap.cost.aboveShare > 0) {
    const above = et.filter((t) => { const r = referenceFor(t, rates); return r !== null && t.rate - r >= RATE_GAP_FINDING; });
    const aboveBal = above.reduce((s, t) => s + t.balance, 0);
    cands.push({ score: snap.cost.aboveShare + 0.1, f: {
      key: "rate_gap", title: above.length === 1 ? "מסלול אחד בריבית גבוהה מנתון הייחוס" : `${above.length} מסלולים בריבית גבוהה מנתון הייחוס`,
      detail: `${nis(aboveBal)} מהיתרה בריבית גבוהה לפחות ב־${RATE_GAP_FINDING} נקודות מנתון ייחוס כללי. נתון ייחוס אינו הצעה, ומחזור כרוך בעמלות ועלויות.`,
      check: "האם מחזור חלקי של המסלולים האלה משתלם אחרי עמלות.",
    } });
  }
  if (plan.months >= LONG_TERM_MONTHS) {
    cands.push({ score: 0.2, f: {
      key: "long_term", title: `עוד ${yrs(plan.months)} שנים לסיום`,
      detail: `לפי הנתונים, מכאן והלאה צפויים כ־${nis(plan.financeCost)} בריבית${hasLinked ? " ובהצמדה" : ""}.`,
      check: "האם קיצור תקופה או פירעון חלקי מתאימים לכם.",
    } });
  }
  const findings = cands.sort((x, y) => y.score - x.score).slice(0, 3).map((c) => c.f);
  if (findings.length < 3 && skipped.length) {
    findings.push({ key: "missing", title: "חלק מהמשכנתה עוד לא נבדק", detail: `${missing[0]}. הם לא נכללים בסיכום ולא נספרים כאפס.`, check: "נשלים יחד את הנתונים." });
  }

  const goalOf: Record<Finding["key"], Goal> = { linkage: "stability", variable: "stability", rate_gap: "lower_total", long_term: "early_payoff", missing: "not_sure" };
  const n = et.length;
  const headline = findings.length && findings[0].key !== "missing"
    ? `המשכנתה שלכם: כ־${nis(total)} ב־${n === 1 ? "מסלול אחד" : `${n} מסלולים`}, עוד ${yrs(plan.months)} שנים. ${findings.filter((f) => f.key !== "missing").length === 1 ? "ממצא אחד" : `${findings.filter((f) => f.key !== "missing").length} ממצאים`} שכדאי להכיר.`
    : `המשכנתה שלכם: כ־${nis(total)} ב־${n === 1 ? "מסלול אחד" : `${n} מסלולים`}, עוד ${yrs(plan.months)} שנים. לפי הנתונים שהוזנו לא זיהינו חשיפה בולטת.`;

  return {
    state: skipped.length || missing.length ? "partial" : "ready",
    headline, cards, findings, missing, assumptions,
    suggestedGoal: findings[0] ? goalOf[findings[0].key] : "not_sure",
  };
}
