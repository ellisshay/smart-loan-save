import type { Crumb } from "./config";

export interface StaticPageMeta {
  path: string;
  title: string;
  description: string;
  /** Breadcrumb label for this page */
  label: string;
  /** Parent path for breadcrumb trail (defaults to "/") */
  parent?: string;
  /** Emit Service schema */
  service?: boolean;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

export const HOME_TITLE = "משכנתא דיגיטלית, מחזור משכנתא ומכרז בנקים | EASY MORTE";
export const HOME_DESCRIPTION =
  "EASY MORTE מאפשרת לנהל תהליך משכנתא דיגיטלי, כולל בדיקת התאמה, העלאת מסמכים, בניית תמהיל, מחזור משכנתא ומכרז בנקים, במחיר קבוע ושקוף.";

export const staticPages: StaticPageMeta[] = [
  { path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION, label: "בית", changefreq: "weekly", priority: "1.0" },
  // Core service pages
  { path: "/first-mortgage", label: "משכנתא ראשונה", service: true, priority: "0.9", changefreq: "monthly",
    title: "משכנתא ראשונה: מדריך ותהליך דיגיטלי מלא | EASY MORTE",
    description: "לוקחים משכנתא ראשונה? בדיקת התאמה, חישוב הון עצמי והחזר, בניית תמהיל והשוואת הצעות בנקים בתהליך דיגיטלי אחד, במחיר קבוע של 3,450 ₪." },
  { path: "/mortgage", label: "משכנתא חדשה", service: true, priority: "0.9", changefreq: "monthly",
    title: "משכנתא חדשה לרכישת דירה: בדיקה, תמהיל והצעות | EASY MORTE",
    description: "משכנתא חדשה לדירה, לדירה נוספת או למשפרי דיור: ניתוח כושר החזר, הכנת תיק מסודר לבנקים ובניית תמהיל מבוסס נתונים. מחיר קבוע ושקוף." },
  { path: "/mortgage-refinance", label: "מחזור משכנתא", service: true, priority: "0.9", changefreq: "monthly",
    title: "מחזור משכנתא: בדיקת כדאיות וחיסכון בפועל | EASY MORTE",
    description: "בודקים אם מחזור משכנתא משתלם לכם: השוואת המשכנתא הקיימת לתמהיל חדש, חישוב עמלות פירעון וחיסכון נטו, והגשה מסודרת לבנקים." },
  { path: "/mortgage-advisor", label: "יועץ משכנתאות", service: true, priority: "0.8", changefreq: "monthly",
    title: "יועץ משכנתאות דיגיטלי במחיר קבוע | EASY MORTE",
    description: "ליווי משכנתא מקצועי בלי עמלות אחוזים: ניתוח תיק, בניית תמהיל, השוואת הצעות ומשא ומתן מול הבנקים, במחיר קבוע של 3,450 ₪." },
  { path: "/mortgage-tender", label: "מכרז בנקים", service: true, priority: "0.8", changefreq: "monthly",
    title: "מכרז בנקים למשכנתא: השוואת הצעות מכמה בנקים | EASY MORTE",
    description: "תיק משכנתא אחד שנשלח לכמה בנקים במקביל, השוואת הצעות לפי עלות כוללת ומשא ומתן מבוסס נתונים. כך עובד מכרז הבנקים של EASY MORTE." },
  { path: "/balance-check", label: "בדיקה לפי דוח יתרות", service: true, priority: "0.9", changefreq: "monthly",
    title: "בדיקת משכנתא חינם לפי דוח יתרות: מה לשמור ומה למחזר | EASY MORTE",
    description: "בדיקת המשכנתא שלי – חינם: מזינים או מעלים דוח יתרות לסילוק ומקבלים המלצה לכל מסלול: להשאיר, לתקן בבנק או למחזר. כולל מדריך הורדת דוח יתרות לפי בנק." },
  // Calculators
  { path: "/calculators", label: "מחשבונים", priority: "0.7", changefreq: "monthly",
    title: "מחשבוני משכנתא: החזר, מחזור, תמהיל ויכולת רכישה | EASY MORTE",
    description: "כל מחשבוני המשכנתא של EASY MORTE במקום אחד: מחשבון החזר חודשי, מחשבון מחזור, השוואת תמהילים, מדד בזבוז ומחשבון יכולת רכישת דירה." },
  { path: "/mortgage-calculator", label: "מחשבון משכנתא", parent: "/calculators", priority: "0.8", changefreq: "monthly",
    title: "מחשבון משכנתא: החזר חודשי וסך תשלומים | EASY MORTE",
    description: "מחשבון משכנתא לחישוב החזר חודשי, סך ריבית ויחס החזר מההכנסה לפי סכום, תקופה וריבית. כולל דוגמה מספרית והסבר איך להשתמש." },
  { path: "/refinance-calculator", label: "מחשבון מחזור משכנתא", parent: "/calculators", priority: "0.8", changefreq: "monthly",
    title: "מחשבון מחזור משכנתא: כמה תחסכו במחזור | EASY MORTE",
    description: "מחשבון מחזור משכנתא שמשווה את ההחזר הנוכחי להחזר אחרי מחזור ומחשב את החיסכון הכולל. כולל דוגמה, הסבר ושאלות נפוצות." },
  { path: "/calculators/waste", label: "מדד בזבוז משכנתא", parent: "/calculators", priority: "0.6",
    title: "מדד בזבוז משכנתא: כמה אתם משלמים מעבר לנדרש | EASY MORTE",
    description: "בדקו כמה ריבית עודפת אתם משלמים במשכנתא הנוכחית לעומת תנאי השוק, והאם כדאי לבדוק מחזור." },
  { path: "/calculators/mix", label: "השוואת תמהילים", parent: "/calculators", priority: "0.6",
    title: "מחשבון השוואת תמהילי משכנתא | EASY MORTE",
    description: "השוואה בין תמהילי משכנתא לפי החזר חודשי, סך תשלומים וחשיפה לריבית משתנה ולמדד." },
  { path: "/calculators/savings", label: "מחשבון חיסכון", parent: "/calculators", priority: "0.6",
    title: "מחשבון חיסכון במשכנתא: שלוש דרכים להוזיל | EASY MORTE",
    description: "כמה אפשר לחסוך במשכנתא: מחזור לריבית השוק, תוספת להחזר החודשי או קיצור התקופה. הערכה לפי הנתונים שלכם." },
  { path: "/calculators/affordability", label: "מחשבון יכולת רכישה", parent: "/calculators", priority: "0.6",
    title: "מחשבון יכולת רכישת דירה: הון עצמי והחזר | EASY MORTE",
    description: "כמה הון עצמי, הכנסה והחזר חודשי צריך כדי לקנות את הדירה שאתם רוצים. חישוב לפי מגבלות המימון בישראל." },
  { path: "/calculators/early-repayment", label: "מחשבון פירעון מוקדם", parent: "/calculators", priority: "0.6",
    title: "מחשבון פירעון מוקדם של משכנתא: להקטין החזר או לקצר תקופה | EASY MORTE",
    description: "מה יקרה אם תחזירו חלק מהמשכנתא? השוואה בין הקטנת ההחזר החודשי לקיצור התקופה, כולל החיסכון המשוער בריבית." },
  { path: "/calculators/rate-sensitivity", label: "רגישות לשינויי ריבית", parent: "/calculators", priority: "0.6",
    title: "מה קורה למשכנתא אם הריבית משתנה? מחשבון רגישות | EASY MORTE",
    description: "הזיזו את הריבית בין מינוס 2% לפלוס 3% וראו מיד את ההחזר החודשי החדש. השינוי מחושב רק על החלק בריבית משתנה." },
  // Company / info
  { path: "/about", label: "אודות", priority: "0.6", changefreq: "yearly",
    title: "אודות EASY MORTE: שירות משכנתא דיגיטלי מבוסס נתונים",
    description: "מי אנחנו, איך נולדה EASY MORTE ולמה אנחנו מנהלים תהליך משכנתא דיגיטלי במחיר קבוע, בשקיפות מלאה ועם בדיקה מקצועית של כל תיק." },
  { path: "/how-it-works", label: "איך זה עובד", priority: "0.7",
    title: "איך זה עובד: תהליך המשכנתא הדיגיטלי שלב אחר שלב | EASY MORTE",
    description: "מהשאלון הראשון ועד הצעות הבנקים: בדיקת התאמה, העלאת מסמכים, בדיקת תיק תוך 72 שעות מתשלום ותיק מלא, בניית תמהיל והגשה לבנקים." },
  { path: "/pricing", label: "מחירים", priority: "0.7",
    title: "מחיר שירות המשכנתא: 3,450 ₪ קבוע, בלי אחוזים | EASY MORTE",
    description: "מחיר קבוע ושקוף של 3,450 ₪ לתהליך המשכנתא המלא, ללא עמלת אחוזים מגובה ההלוואה. מה כלול בשירות ומתי משלמים." },
  { path: "/contact", label: "צור קשר", priority: "0.5", changefreq: "yearly",
    title: "צור קשר עם EASY MORTE: טלפון, WhatsApp ואימייל",
    description: "שאלות על משכנתא, מחזור או התיק שלכם? פנו ל-EASY MORTE בטלפון או ב-WhatsApp 055-996-1997 או במייל info@easymorte.co.il." },
  { path: "/faq", label: "שאלות נפוצות", priority: "0.7",
    title: "שאלות נפוצות על משכנתא ועל השירות | EASY MORTE",
    description: "תשובות לשאלות נפוצות: כמה עולה השירות, מה קורה אחרי התשלום, אילו מסמכים צריך, איך עובד מכרז הבנקים ומתי כדאי למחזר משכנתא." },
  { path: "/knowledge", label: "מרכז ידע", priority: "0.8", changefreq: "weekly",
    title: "משכנתאפדיה: מרכז הידע למשכנתאות בעברית | EASY MORTE",
    description: "מדריכים מעמיקים על משכנתא ראשונה, מחזור, תמהילים, ריביות, אישור עקרוני, מסמכים, משכנתא לעצמאים ומכירות פומביות, בשפה ברורה." },
  // Legal
  { path: "/privacy", label: "מדיניות פרטיות", priority: "0.3", changefreq: "yearly",
    title: "מדיניות פרטיות | EASY MORTE",
    description: "איזה מידע EASY MORTE אוספת, למה, היכן הוא נשמר, למי הוא מועבר ואילו זכויות יש לכם לגבי המידע האישי שלכם." },
  { path: "/terms", label: "תנאי שימוש", priority: "0.3", changefreq: "yearly",
    title: "תנאי שימוש | EASY MORTE",
    description: "תנאי השימוש באתר ובשירותי EASY MORTE, כולל אופי השירות, תשלום ואחריות." },
  { path: "/cookies", label: "מדיניות עוגיות", priority: "0.3", changefreq: "yearly",
    title: "מדיניות עוגיות | EASY MORTE",
    description: "באילו עוגיות אתר EASY MORTE משתמש, למה, ואיך ניתן למחוק או לחסום אותן בדפדפן." },
  { path: "/cancel", label: "ביטול עסקה", priority: "0.4", changefreq: "yearly",
    title: "ביטול עסקה | EASY MORTE",
    description: "טופס ביטול עסקה בשירות EASY MORTE לפי חוק הגנת הצרכן: שם, פרטי קשר ומספר תיק. אישור קבלה מיידי." },
  { path: "/accessibility", label: "הצהרת נגישות", priority: "0.3", changefreq: "yearly",
    title: "הצהרת נגישות | EASY MORTE",
    description: "הצהרת הנגישות של EASY MORTE: רמת הנגישות, ההתאמות שבוצעו באתר ודרכי פנייה לרכז הנגישות." },
];

export const staticPageMap: Record<string, StaticPageMeta> = Object.fromEntries(
  staticPages.map((p) => [p.path, p]),
);

/** Old URL -> canonical URL (served as meta-refresh + JS redirect). */
export const redirects: Record<string, string> = {
  "/calculators/new-mortgage": "/mortgage-calculator",
  "/calculators/refinance": "/refinance-calculator",
  "/legal/privacy": "/privacy",
  "/legal/terms": "/terms",
  "/blog": "/knowledge",
  "/legal/cookies": "/cookies",
  "/legal/accessibility": "/accessibility",
};

export function crumbsFor(path: string): Crumb[] {
  const trail: Crumb[] = [];
  let cur: StaticPageMeta | undefined = staticPageMap[path];
  while (cur) {
    trail.unshift({ name: cur.label, path: cur.path });
    if (cur.path === "/") break;
    cur = staticPageMap[cur.parent ?? "/"];
  }
  return trail;
}
