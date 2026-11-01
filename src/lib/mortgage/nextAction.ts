// One clear "next step" for the customer, by priority. Never leaves them guessing.

export interface NextActionInput {
  status: string;
  caseType: "new" | "refi";
  intakeComplete: boolean;
  firstMissingStep?: { label: string; href: string } | null;
  paymentSucceeded: boolean;
  missingDocs: number;
  docsNeedUpdate: number;
  tenderStage?: string | null;
  offersCount: number;
  selectedOffer: boolean;
  slaDueAt?: string | null;
}

export interface NextAction {
  tone: "action" | "waiting" | "done";
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);

export function nextAction(i: NextActionInput): NextAction {
  if (i.status === "ClosedWon" || i.tenderStage === "completed") {
    return { tone: "done", title: "המשכנתא הושלמה", body: "אין צורך בפעולה נוספת. אפשר לחזור לכאן בכל זמן כדי לראות את פרטי המשכנתא." };
  }
  if (i.status === "ClosedLost") {
    return { tone: "done", title: "הטיפול בתיק הסתיים", body: "אם תרצו לחזור לתהליך, אנחנו כאן.", cta: { label: "צרו קשר", href: "/contact" } };
  }
  if (!i.intakeComplete) {
    return {
      tone: "action", title: "השלב הבא שלכם: השלמת הפרטים",
      body: i.firstMissingStep ? `נשאר להשלים: ${i.firstMissingStep.label}. הכל נשמר אוטומטית.` : "נשארו עוד כמה פרטים. הכל נשמר אוטומטית.",
      cta: { label: "המשך השלמה", href: i.firstMissingStep?.href || "/dashboard/personal" },
    };
  }
  if (i.docsNeedUpdate > 0) {
    return { tone: "action", title: "השלב הבא שלכם: העלאה מחדש של מסמך", body: `${plural(i.docsNeedUpdate, "מסמך אחד צריך", "מסמכים צריכים")} עדכון. זה לוקח דקה.`, cta: { label: "למסמכים", href: "/dashboard/documents" } };
  }
  if (i.offersCount > 0 && !i.selectedOffer && (!i.tenderStage || ["offers", "negotiation", "waiting", "submitted"].includes(i.tenderStage))) {
    return { tone: "action", title: `${plural(i.offersCount, "התקבלה הצעה אחת", "הצעות התקבלו")}`, body: "אפשר להשוות ביניהן עכשיו. הסברנו בשפה פשוטה מה ההבדל בין ההצעות.", cta: { label: "להשוואת ההצעות", href: "/dashboard/tender" } };
  }
  if (i.missingDocs > 0) {
    return { tone: "action", title: `השלב הבא שלכם: ${plural(i.missingDocs, "מסמך אחד חסר", "מסמכים חסרים")}`, body: "אפשר לצלם מהטלפון ולהעלות ישירות. הטיפול המקצועי מתחיל כשהתיק מלא והתשלום התקבל.", cta: { label: "להעלאת מסמכים", href: "/dashboard/documents" } };
  }
  if (!i.paymentSucceeded) {
    return { tone: "action", title: "השלב הבא שלכם: תשלום ופתיחת הטיפול", body: "התיק מלא. אחרי התשלום (3,450 ₪, מחיר קבוע) מתחיל חלון הטיפול המקצועי שלנו.", cta: { label: "למעבר לתשלום", href: "/dashboard/payment" } };
  }
  if (i.selectedOffer || ["client_selected", "executing", "signing"].includes(i.tenderStage || "")) {
    return { tone: "waiting", title: "אין צורך בפעולה כרגע", body: "בחרתם הצעה. אנחנו מתאמים מול הבנק את השלבים עד החתימה, ונעדכן כשנדרש משהו מכם.", cta: { label: "לפרטי התהליך", href: "/dashboard/tender" } };
  }
  if (i.tenderStage && ["submitted", "waiting", "negotiation"].includes(i.tenderStage)) {
    return { tone: "waiting", title: "אין צורך בפעולה כרגע", body: "התיק הוגש לבנקים ואנחנו ממתינים להצעות. זמני התשובה נקבעים על ידי הבנקים, ונעדכן ברגע שתגיע הצעה." };
  }
  const due = i.slaDueAt ? new Date(i.slaDueAt) : null;
  const dueText = due && !Number.isNaN(due.getTime())
    ? ` חלון הטיפול המקצועי שלנו מסתיים עד ${due.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}.`
    : "";
  return { tone: "waiting", title: "אין צורך בפעולה כרגע", body: `התיק בטיפול מקצועי אצלנו.${dueText} נעדכן כשנעבור לשלב הבא.` };
}
