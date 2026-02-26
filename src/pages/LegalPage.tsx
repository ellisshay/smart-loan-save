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
    content: `EasyMorte מחויבת להנגשת האתר לכלל האוכלוסייה.\n\n1. האתר עומד בתקן WCAG 2.1 ברמה AA.\n2. האתר תומך בקורא מסך ובניווט מקלדת.\n3. האתר מותאם לתצוגה בגדלים שונים.\n4. לדיווח על בעיית נגישות: accessibility@easymortgage.co.il`,
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
