export const BANK_STATUSES: Record<string, { label: string; client: string; tone: string }> = {
  not_submitted: { label: "טרם הוגש", client: "הבקשה בהכנה להגשה לבנק.", tone: "bg-muted text-muted-foreground" },
  submitted: { label: "הוגש לבנק", client: "הבקשה שלכם הועברה לבנק לבדיקה.", tone: "bg-primary/10 text-primary" },
  waiting: { label: "ממתין לבנק", client: "הבנק בודק את הבקשה. נעדכן ברגע שתתקבל תשובה.", tone: "bg-primary/10 text-primary" },
  docs_needed: { label: "נדרשת השלמת מסמכים", client: "הבנק ביקש מסמך נוסף. נעדכן אתכם מה נדרש.", tone: "bg-accent text-accent-foreground" },
  principle_approval: { label: "התקבל אישור עקרוני", client: "התקבל אישור עקרוני מהבנק.", tone: "bg-primary/15 text-primary" },
  offer_received: { label: "התקבלה הצעה", client: "התקבלה הצעה מהבנק.", tone: "bg-primary/15 text-primary" },
  negotiation: { label: "במשא ומתן", client: "אנחנו עובדים מול הבנק על שיפור תנאי המשכנתא.", tone: "bg-accent text-accent-foreground" },
  improved_offer: { label: "התקבלה הצעה משופרת", client: "התקבלה הצעה משופרת מהבנק.", tone: "bg-primary/15 text-primary" },
  final_offer: { label: "הצעה סופית", client: "התקבלה הצעה מעודכנת מהבנק והיא זמינה לצפייה.", tone: "bg-primary/20 text-primary" },
  rejected: { label: "נדחה", client: "הבנק לא הציע תנאים מתאימים בשלב זה. אנחנו ממשיכים מול הבנקים האחרים.", tone: "bg-destructive/10 text-destructive" },
  client_selected: { label: "נבחר על ידי הלקוח", client: "בחרתם בהצעה של בנק זה. אנחנו מתקדמים לביצוע.", tone: "bg-primary text-primary-foreground" },
  closed: { label: "נסגר", client: "הטיפול מול בנק זה הסתיים.", tone: "bg-muted text-muted-foreground" },
};

export const OFFER_KINDS: Record<string, string> = { initial: "הצעה ראשונית", improved: "הצעה משופרת", final: "הצעה סופית" };

export const TRACK_TYPES = ["פריים", "קבועה לא צמודה", "קבועה צמודה", "משתנה כל 5 שנים", "משתנה כל 5 שנים צמודה", "משתנה כל שנתיים", "מט\"ח", "אחר"];
export const RATE_TYPES = ["קבועה", "משתנה"];
export const INDEXATIONS = ["לא צמוד", "צמוד מדד", "צמוד מט\"ח"];

export const CHECKLIST: Record<string, string> = {
  offer_approval: "אישור ההצעה",
  missing_docs: "מסמכים חסרים",
  appraisal: "שמאות אם נדרשת",
  insurance: "ביטוחים אם נדרשים",
  collateral: "בטחונות / מסמכי עסקה",
  bank_coordination: "תיאום מול הבנק",
  signing_coordination: "תיאום חתימות",
  signing: "חתימות",
  post_signing: "השלמות לאחר חתימה",
  disbursement: "ביצוע / העמדת המשכנתא",
  completed: "תיק הושלם",
};

export const STAGES: Record<string, string> = {
  review: "בדיקה מקצועית",
  submitted: "הגשה ל-3 בנקים",
  waiting: "ממתינים להצעות",
  negotiation: "מכרז ריביות",
  offers: "התקבלו הצעות",
  client_selected: "הלקוח בחר הצעה",
  executing: "מתקדמים לביצוע",
  signing: "חתימות",
  completed: "המשכנתא הושלמה",
};

export const CLIENT_STEPS = ["התיק הושלם", "בדיקה מקצועית", "הגשה ל-3 בנקים", "ממתינים להצעות", "מכרז ריביות", "התקבלו הצעות", "בחירת הצעה", "חתימות", "המשכנתא הושלמה"];
const STAGE_STEP: Record<string, number> = { review: 1, submitted: 2, waiting: 3, negotiation: 4, offers: 5, client_selected: 6, executing: 6, signing: 7, completed: 8 };
export const stageToStep = (s: string) => STAGE_STEP[s] ?? 1;

export interface Track { type: string; amount: number; months: number; rate: number; rate_type: string; indexation: string; first_payment: number; }

export const nis = (n?: number | null) => (n || n === 0 ? `${Math.round(Number(n)).toLocaleString("he-IL")} ₪` : "-");
