// Maps case status + tender stage + documents to the 9 client-facing steps.

export type StepState = "done" | "active" | "waiting" | "action";

export const STEP_STATE_LABEL: Record<StepState, string> = {
  done: "הושלם",
  active: "בתהליך",
  waiting: "ממתין",
  action: "נדרשת פעולה שלכם",
};

export interface ProgressInput {
  status: string;
  intakeStarted: boolean;
  intakeComplete: boolean;
  paymentSucceeded: boolean;
  missingDocs: number;        // required docs not uploaded and not deferred
  docsNeedUpdate: number;     // uploaded docs marked for re-upload
  tenderStage?: string | null;
  offersCount: number;
  selectedOffer: boolean;
}

export interface ProgressStep { key: string; label: string; state: StepState; hint: string }

const STATUS_ORDER: Record<string, number> = {
  Draft: 0, WaitingForPayment: 1, PaymentSucceeded: 2, WaitingForDocs: 3, InAnalysis: 4, ReportGenerated: 5,
  CustomerReview: 6, SentToBank: 7, BankOfferReceived: 8, Negotiation: 9, ClosedWon: 10, ClosedLost: 11,
};
const STAGE_ORDER: Record<string, number> = {
  review: 1, submitted: 2, waiting: 3, negotiation: 4, offers: 5, client_selected: 6, executing: 7, signing: 8, completed: 9,
};

export function caseProgress(i: ProgressInput): ProgressStep[] {
  const s = STATUS_ORDER[i.status] ?? 0;
  const st = i.tenderStage ? STAGE_ORDER[i.tenderStage] ?? 0 : 0;
  const closedWon = i.status === "ClosedWon" || i.tenderStage === "completed";
  const working = i.intakeComplete && i.paymentSucceeded;
  const docsOk = i.missingDocs === 0 && i.docsNeedUpdate === 0;
  const steps: ProgressStep[] = [];
  const push = (key: string, label: string, state: StepState, hint: string) => steps.push({ key, label, state, hint });

  push("intake", "פרטים התקבלו",
    i.intakeComplete ? "done" : "action",
    i.intakeComplete ? "כל הפרטים נשמרו בתיק." : i.intakeStarted ? "נשארו עוד כמה פרטים להשלים." : "מתחילים במילוי הפרטים.");

  push("docs", "מסמכים",
    docsOk ? "done" : "action",
    docsOk ? "המסמכים הנדרשים התקבלו." : i.docsNeedUpdate ? "יש מסמך שצריך להעלות מחדש." : `חסרים ${i.missingDocs} מסמכים נדרשים.`);

  const reviewDone = s >= 5 || st >= 2;
  push("review", "בדיקה מקצועית",
    reviewDone ? "done" : !i.paymentSucceeded && i.intakeComplete ? "action" : working && docsOk ? "active" : "waiting",
    reviewDone ? "הבדיקה המקצועית הושלמה."
      : !i.paymentSucceeded && i.intakeComplete ? "הטיפול המקצועי מתחיל אחרי התשלום והשלמת התיק."
      : working && docsOk ? "התיק בבדיקה מקצועית אצלנו." : "מתחיל אחרי השלמת הפרטים, המסמכים והתשלום.");

  const prepDone = s >= 7 || st >= 2;
  push("prep", "הכנת תיק", prepDone ? "done" : reviewDone ? "active" : "waiting",
    prepDone ? "התיק הוכן להגשה." : reviewDone ? "מכינים את התיק להגשה לבנקים." : "אחרי הבדיקה המקצועית.");

  const banksDone = i.offersCount > 0 || st >= 5;
  push("banks", "פנייה לבנקים", banksDone ? "done" : st >= 2 || s >= 7 ? "active" : "waiting",
    banksDone ? "הבנקים השיבו." : st >= 2 || s >= 7 ? "התיק הוגש לבנקים. ממתינים לתשובות." : "אחרי הכנת התיק.");

  push("offers", "הצעות התקבלו", i.offersCount > 0 ? "done" : "waiting",
    i.offersCount > 0 ? `התקבלו ${i.offersCount} הצעות.` : "נעדכן ברגע שתגיע הצעה.");

  const negDone = st >= 6 || i.selectedOffer || closedWon;
  push("negotiation", "משא ומתן", negDone ? "done" : i.tenderStage === "negotiation" || s === 9 ? "active" : "waiting",
    negDone ? "שלב המשא ומתן הסתיים." : i.tenderStage === "negotiation" || s === 9 ? "אנחנו עובדים מול הבנקים על שיפור התנאים." : "מתחיל כשמגיעות הצעות.");

  const chosen = i.selectedOffer || st >= 6 || closedWon;
  push("choose", "בחירת הצעה", chosen ? "done" : i.offersCount > 0 ? "action" : "waiting",
    chosen ? "ההצעה נבחרה." : i.offersCount > 0 ? "אפשר להשוות בין ההצעות ולבחור." : "אחרי קבלת ההצעות.");

  push("signing", "חתימה", closedWon ? "done" : st >= 7 ? "active" : "waiting",
    closedWon ? "המשכנתא הושלמה." : st >= 7 ? "מתאמים חתימות וביצוע מול הבנק." : "השלב האחרון.");

  return steps;
}
