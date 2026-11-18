// Client-side view of the parse-balance-report result (#52). Types mirror supabase/functions/_shared/balanceReport.ts.
export type ReportStatus = "complete" | "needs_completion" | "conflict";
export interface ReportIssue { code: string; severity: "conflict" | "missing" | "info"; path: string; message: string }
export const REPORT_STATUS_TEXT: Record<ReportStatus, string> = {
  complete: "סכומי המסלולים תואמים לסיכום הדוח. בדקו שהנתונים תואמים גם לעין.",
  needs_completion: "חלק מהנתונים לא נמצאו בדוח או דורשים אימות. הם נשארו ריקים ולא נספרים כאפס. אפשר להשלים ידנית או איתנו.",
  conflict: "נמצאה אי התאמה בין הנתונים לסיכום הדוח. נדרשת בדיקה מקצועית לפני כל מסקנה.",
};
