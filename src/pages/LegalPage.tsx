import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";

const pages: Record<string, { title: string; content: string }> = {
  terms: {
    title: "תנאי שימוש",
    content: `ברוכים הבאים ל-EasyMorte. השימוש באתר ובשירותים שלנו כפוף לתנאים אלו.\n\n1. השירות מספק ניתוח משכנתאות ואינו מהווה ייעוץ פיננסי מוסמך.\n2. התוצאות המוצגות הן הערכות בלבד ואינן מחייבות.\n3. תשלום עבור שירות פרימיום הוא חד-פעמי ואינו ניתן להחזרה לאחר מתן השירות.\n4. אנו שומרים על הזכות לעדכן תנאים אלו.\n5. כל המידע המוזן על ידי המשתמש מאובטח ומוצפן.\n\nלשאלות: info@easymortgage.co.il`,
  },
  privacy: {
    title: "מדיניות פרטיות",
    content: `EasyMorte מחויבת להגנה על פרטיותך.\n\n1. אנו אוספים מידע שאתה מספק לנו באופן ישיר (פרטי קשר, נתוני משכנתא).\n2. המידע משמש אך ורק לצורך מתן השירות.\n3. לא נעביר את המידע שלך לצד שלישי ללא הסכמתך, למעט לבנקים במסגרת השירות.\n4. המידע מאובטח בהצפנה בתעבורה ובמנוחה.\n5. תוכל לבקש מחיקת המידע שלך בכל עת.\n6. אנו משתמשים בעוגיות לשיפור חוויית המשתמש.\n\nלבקשות מחיקת מידע: privacy@easymortgage.co.il`,
  },
  accessibility: {
    title: "הצהרת נגישות",
    content: `EasyMorte מחויבת להנגשת האתר והשירותים הדיגיטליים לכלל האוכלוסייה, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ"ח-1998, ולתקנות הנגישות לשירותי אינטרנט, תשע"ג-2013.

תאריך עדכון אחרון: פברואר 2026

רמת הנגישות:
האתר עומד בדרישות תקן WCAG 2.1 ברמה AA, כנדרש בחוק הישראלי.

התאמות נגישות שבוצעו:
1. תמיכה בניווט מקלדת מלא — כולל קישור "דלג לתוכן הראשי".
2. תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver).
3. מבנה HTML סמנטי עם תגיות ARIA מתאימות.
4. ניגודיות צבעים בהתאם לתקן (יחס 4.5:1 לפחות).
5. אפשרות להגדלת טקסט עד 200% ללא אובדן תוכן.
6. תמונות עם טקסט חלופי (alt text).
7. טפסים עם תוויות (labels) מתאימות.
8. תפריט נגישות צף המאפשר התאמה אישית (הגדלת טקסט, ניגודיות גבוהה, מצב כהה, הדגשת קישורים, סמן גדול, גופן קריא).
9. האתר מותאם לתצוגה במגוון מכשירים ורזולוציות (responsive design).

דרכי פנייה בנושא נגישות:
אם נתקלת בבעיית נגישות באתר, נשמח לסייע.
• אימייל: accessibility@easymortgage.co.il
• טלפון: 03-1234567
• רכז/ת נגישות: מחלקת שירות לקוחות EasyMorte

אנו ממשיכים לפעול לשיפור נגישות האתר באופן שוטף.`,
  },
  cookies: {
    title: "מדיניות עוגיות",
    content: `האתר משתמש בעוגיות לצורך:\n\n1. שמירת העדפות משתמש\n2. ניתוח תעבורה ושיפור השירות\n3. התאמת תוכן\n\nניתן לנהל את העוגיות בהגדרות הדפדפן שלך.`,
  },
};

export default function LegalPage() {
  const { page } = useParams<{ page: string }>();
  const data = pages[page || ""];

  if (!data) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">עמוד לא נמצא</h1>
        <Link to="/" className="text-gold mt-4 inline-block">חזרה לדף הבית</Link>
      </div>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-8">{data.title}</h1>
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <div className="text-foreground leading-relaxed whitespace-pre-line">{data.content}</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
