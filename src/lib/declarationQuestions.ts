// The banking declarations, asked once and worded the same in the questionnaire and in the dashboard.
// Enforcement files, other legal proceedings and insolvency are separate topics and stay separate questions.
export const DECLARATION_QUESTIONS = [
  {
    key: "hasExecutionFile",
    label: "האם קיים כרגע תיק הוצאה לפועל פתוח נגד אחד הלווים?",
    hint: "רק תיקים בהוצאה לפועל. תיק שנסגר במלואו אינו נחשב.",
  },
  {
    key: "hasLegalProceedings",
    label: "האם יש הליך משפטי אחר, תלוי ועומד, שעלול להשפיע על יכולת ההחזר?",
    hint: "לא כולל הוצאה לפועל, שנשאלה בשאלה הקודמת. למשל תביעה כספית נגד אחד הלווים.",
  },
  {
    key: "hasBankruptcy",
    label: "האם אחד הלווים נמצא כעת או היה בשנים האחרונות בהליך חדלות פירעון (פשיטת רגל)?",
    hint: "הליך חדלות פירעון שונה מתיק הוצאה לפועל.",
  },
  { key: "hasRestrictedAccount", label: "האם קיים כרגע חשבון מוגבל או הגבלה בנקאית אחרת?", hint: "" },
  { key: "hasBouncedChecks", label: "האם חזרו המחאות או הוראות קבע בשנה האחרונה?", hint: "" },
] as const;

export type DeclarationKey = (typeof DECLARATION_QUESTIONS)[number]["key"];
