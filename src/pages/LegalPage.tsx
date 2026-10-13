import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { TERMS, PRIVACY, COOKIES, ACCESS_INTRO, ACCESS_OUTRO } from "@/data/legalTexts";

const ACCESS_ITEMS = `1. תמיכה בניווט מקלדת מלא, כולל קישור "דלג לתוכן הראשי".
2. תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver).
3. מבנה HTML סמנטי עם תגיות ARIA מתאימות.
4. ניגודיות צבעים בהתאם לתקן (יחס 4.5:1 לפחות).
5. אפשרות להגדלת טקסט עד 200% ללא אובדן תוכן.
6. תמונות עם טקסט חלופי (alt text).
7. טפסים עם תוויות (labels) מתאימות.
8. תפריט נגישות צף המאפשר התאמה אישית (הגדלת טקסט, ניגודיות גבוהה, מצב כהה, הדגשת קישורים, סמן גדול, גופן קריא).
9. האתר מותאם לתצוגה במגוון מכשירים ורזולוציות (responsive design).`;

const pages: Record<string, { title: string; content: string }> = {
  terms: { title: "תנאי שימוש", content: TERMS },
  privacy: { title: "מדיניות פרטיות", content: PRIVACY },
  cookies: { title: "מדיניות עוגיות", content: COOKIES },
  accessibility: { title: "הצהרת נגישות", content: `${ACCESS_INTRO}\n${ACCESS_ITEMS}\n\n${ACCESS_OUTRO}` },
};

export default function LegalPage({ page: pageProp }: { page?: string } = {}) {
  const params = useParams<{ page: string }>();
  const page = pageProp ?? params.page;
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
