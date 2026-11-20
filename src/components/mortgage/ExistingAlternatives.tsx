import { useMemo, useState } from "react";
import { evaluate, existingAlternatives, fromSimpleTracks, GOAL_TEXT, OUTCOME_TEXT, snapshot, BASE_ASSUMPTIONS, STRESS, type Goal, type Evaluated } from "@/lib/mortgage/engine";
import type { BalanceTrack } from "@/lib/mortgage/balanceCheck";

const nis = (v: number) => `${Math.round(v).toLocaleString("he-IL")} ₪`;
/** Signed values are isolated left-to-right so the sign stays in front of the number in RTL text. */
const ltr = (x: string) => `\u2066${x}\u2069`;
const signedNis = (v: number) => `${ltr(`${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.round(Math.abs(v)).toLocaleString("he-IL")}`)} ₪`;
const pctTxt = (v: number) => `${Math.round(v * 100)}%`;
const parse = (v: string) => { const n = Number(v.replace(/,/g, "")); return v.trim() && Number.isFinite(n) && n >= 0 ? n : null; };
const knownCpi = (v: unknown) => { const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };
const TONE: Record<Evaluated["outcome"], string> = {
  baseline: "border-primary/40", lower_total_cost: "border-navy/50", lower_payment_higher_total: "border-warning/60",
  higher_cost: "border-border", no_change: "border-border", incomplete: "border-dashed border-border",
};

/**
 * Existing mortgage: snapshot on three axes and alternatives against the baseline (#52 stage 3).
 * Rates for new tracks are general reference data, so every alternative is a scenario, never an offer.
 */
/** goal/onGoalChange: when the page already asks for the goal (summary), pass it in and the picker here is hidden. */
export function ExistingAlternatives({ tracks, rates, goal: goalProp, onGoalChange }: { tracks: BalanceTrack[]; rates: Record<string, unknown> | null; goal?: Goal; onGoalChange?: (g: Goal) => void }) {
  const [ownGoal, setOwnGoal] = useState<Goal>("not_sure");
  const goal = goalProp ?? ownGoal;
  const setGoal = onGoalChange ?? setOwnGoal;
  const [costs, setCosts] = useState("");
  const [prepayAmt, setPrepayAmt] = useState("");
  const [income, setIncome] = useState("");
  const cpi = knownCpi(rates?.cpi_annual);
  const { tracks: engineTracks, skipped } = useMemo(() => fromSimpleTracks(tracks), [tracks]);
  const needsCpi = engineTracks.some((t) => t.linked) && cpi === null;
  const a = BASE_ASSUMPTIONS(cpi ?? 0);

  const result = useMemo(() => {
    if (!engineTracks.length || needsCpi) return null;
    const alts = existingAlternatives(engineTracks, rates, { switchingCosts: parse(costs), prepayAmount: parse(prepayAmt), goal, cpiAnnual: cpi ?? 0 });
    return { snap: snapshot(engineTracks, rates, a, parse(income)), evaluated: evaluate(engineTracks, alts, a) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineTracks, rates, costs, prepayAmt, goal, income, cpi, needsCpi]);

  const input = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm";
  if (!engineTracks.length) return null;
  if (needsCpi) return <p className="text-sm text-muted-foreground">כדי לבחון חלופות למסלול צמוד נדרשת הנחת מדד, והיא חסרה כרגע. לא נחשב בלעדיה.</p>;
  if (!result) return null;
  const { snap, evaluated } = result;
  const baseline = evaluated[0];

  return (
    <section className="space-y-5" aria-labelledby="alts-title">
      <h3 id="alts-title" className="font-display text-lg font-bold text-foreground">תמונת מצב וחלופות לבדיקה</h3>
      {skipped.length > 0 && <p className="text-xs text-muted-foreground">{skipped.length === 1 ? "מסלול אחד לא נכלל" : `${skipped.length} מסלולים לא נכללו`} בחישוב כי חסרים בו נתונים. החלופות מתייחסות רק למסלולים המלאים.</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">עלות</p>
          {snap.cost.weightedGap === null ? <p className="text-sm text-foreground">אין נתון ייחוס להשוואה</p> : <>
            <p className="font-bold text-foreground">{snap.cost.weightedGap >= 0.3 ? "מעל נתוני הייחוס" : snap.cost.weightedGap <= -0.3 ? "מתחת לנתוני הייחוס" : "קרוב לנתוני הייחוס"}</p>
            <p className="text-xs text-muted-foreground">פער משוקלל {ltr(`${snap.cost.weightedGap > 0 ? "+" : ""}${snap.cost.weightedGap.toFixed(2)}`)} נקודות{snap.cost.belowShare > 0 ? ` · ${pctTxt(snap.cost.belowShare)} מהיתרה בריבית נמוכה מנתון הייחוס` : ""}</p>
          </>}
        </div>
        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">יציבות</p>
          <p className="font-bold text-foreground">{pctTxt(snap.stability.variableShare)} בריבית משתנה · {pctTxt(snap.stability.linkedShare)} צמוד</p>
          <p className="text-xs text-muted-foreground">בתרחיש לחץ (משתנה {ltr(`+${STRESS.rate}`)}, מדד {ltr(`+${STRESS.cpi}`)}) ההחזר עולה עד {nis(snap.fit.payment + snap.stability.stressJump)} בחמש השנים הראשונות</p>
        </div>
        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground">התאמה</p>
          <p className="font-bold text-foreground">החזר משוער {nis(snap.fit.payment)} · עוד {Math.round(snap.fit.monthsLeft / 12 * 10) / 10} שנים</p>
          {snap.fit.band ? <p className="text-xs text-muted-foreground">{snap.fit.band.text}</p> : <label className="block text-xs text-muted-foreground">הכנסה נטו של משק הבית (לא חובה)<input inputMode="numeric" className={input} value={income} onChange={(e) => setIncome(e.target.value)} /></label>}
        </div>
      </div>

      {goalProp === undefined && <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-foreground">מה הכי חשוב לכם עכשיו?</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GOAL_TEXT) as Goal[]).map((g) => (
            <button key={g} type="button" aria-pressed={goal === g} onClick={() => setGoal(g)}
              className={`rounded-full border px-3 py-1.5 text-sm ${goal === g ? "border-primary bg-primary/10 text-foreground font-bold" : "border-border text-foreground"}`}>{GOAL_TEXT[g]}</button>
          ))}
        </div>
      </fieldset>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-muted-foreground">עלויות מעבר משוערות בש״ח (שמאות, פתיחת תיק, עו״ד). ריק = לא ידוע<input inputMode="numeric" className={input} value={costs} onChange={(e) => setCosts(e.target.value)} /></label>
        <label className="text-xs text-muted-foreground">סכום לפירעון חלקי (לא חובה)<input inputMode="numeric" className={input} value={prepayAmt} onChange={(e) => setPrepayAmt(e.target.value)} /></label>
      </div>

      <ul className="space-y-3">
        {evaluated.map((e) => (
          <li key={e.kind} className={`rounded-xl border-2 p-4 space-y-1 ${TONE[e.outcome]}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-bold text-foreground">{e.title}</p>
              <p className="text-sm font-bold text-foreground">{OUTCOME_TEXT[e.outcome]}</p>
            </div>
            {e.kind === "baseline" ? (
              <p className="text-sm text-muted-foreground">החזר ראשון {nis(e.base.firstPayment)} · {e.base.months} חודשים · ריבית והצמדה מכאן והלאה {nis(e.base.financeCost)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                החזר ראשון {signedNis(e.vsBaseline.firstPayment)} · תקופה {ltr(`${e.vsBaseline.months > 0 ? "+" : ""}${e.vsBaseline.months}`)} חודשים ·{" "}
                {e.vsBaseline.totalCost !== null ? `עלות כוללת ${signedNis(e.vsBaseline.totalCost)}`
                  : e.vsBaseline.totalCostAtLeast !== null ? `עלות כוללת גבוהה לפחות ב־${nis(e.vsBaseline.totalCostAtLeast)}, עוד לפני ${e.missing.join(", ")}`
                  : `עלות כוללת: לא ניתן לקבוע (חסר: ${e.missing.join(", ")})`}
                {e.vsBaseline.breakEvenMonths !== null ? ` · העלויות החד פעמיות מוחזרות בתוך כ־${e.vsBaseline.breakEvenMonths} חודשים` : ""}
              </p>
            )}
            {e.extendsTerm && <p className="text-xs text-warning">הארכת תקופה מקטינה את ההחזר, אבל בדרך כלל מגדילה את העלות הכוללת. זה לא חיסכון.</p>}
            {e.lumpSum > 0 && <p className="text-xs text-muted-foreground">הסכום לפירעון ({nis(e.lumpSum)}) הוא כסף שלכם שמוקדם, ולא נספר כעלות.</p>}
            {e.kind !== "baseline" && Math.abs(e.vsBaseline.stressPeakPayment) >= 50 && <p className="text-xs text-muted-foreground">בתרחיש לחץ: {e.vsBaseline.stressPeakPayment < 0 ? "החזר שיא נמוך יותר ב־" : "החזר שיא גבוה יותר ב־"}{nis(Math.abs(e.vsBaseline.stressPeakPayment))} בחודש</p>}
          </li>
        ))}
      </ul>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">ההנחות בחישוב</summary>
        <ul className="mt-2 list-disc pr-5 space-y-1">
          <li>כל החלופות מושוות להמשך המשכנתה הקיימת, באותן הנחות.</li>
          <li>ריבית למסלול חדש היא נתון ייחוס כללי ולא הצעה אישית של בנק.</li>
          <li>בהיעדר עמלת פירעון מוקדם או עלויות מעבר ידועות, העלות הכוללת לא נקבעת ולא מחושבת כאפס.</li>
          <li>פריים משתנה מהחודש הראשון בתרחיש לחץ, ומסלול משתנה כל 5 שנים במועד השינוי הבא.</li>
          {[...new Set([...baseline.base.notes, ...evaluated.flatMap((e) => e.base.notes)])].map((n) => <li key={n}>{n}</li>)}
        </ul>
      </details>
    </section>
  );
}
