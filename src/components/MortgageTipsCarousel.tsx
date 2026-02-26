import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const tips = [
  "לפני שאתה לוקח משכנתא — דע מה ההחזר המקסימלי שאתה יכול להרשות לעצמך (עד 30% מההכנסה נטו).",
  "אל תיקח 100% פריים. זה זול היום אבל מסוכן מחר.",
  "שלב לפחות 3 מסלולים שונים בתמהיל שלך לפיזור סיכון.",
  "בדוק כמה עולה לך לצאת מהמשכנתא — קנס יציאה יכול לבטל את החיסכון.",
  "השווה הצעות מלפחות 3 בנקים לפני שאתה חותם.",
  "ריבית קבועה נותנת שקט. ריבית משתנה נותנת חיסכון. שלב את שתיהן.",
  "מדד עולה = ההחזר שלך עולה. שים לב לחלק הצמוד למדד.",
  "אל תשכח עלויות נלוות: שמאי, עו\"ד, ביטוח, מס רכישה.",
  "מיחזור משכנתא כדאי כשהריבית יורדת ב-0.5% ומעלה.",
  "ככל שתקופת המשכנתא ארוכה יותר — ההחזר נמוך יותר אבל סה\"כ תשלמו הרבה יותר.",
  "פריים + 0 לא תמיד הכי טוב. בדוק את העלות הכוללת.",
  "ביטוח חיים למשכנתא — השווה מחירים מחוץ לבנק, זה יכול לחסוך אלפים.",
  "העדף החזר מוקדם של הקרן בשנים הראשונות.",
  "אם אתה מתכנן למכור תוך 5-7 שנים — שקול תמהיל עם יותר משתנה.",
  "אל תתפתה ל'מבצע בנקאי' בלי לבדוק את העלות הכוללת.",
  "פגישה עם יועץ משכנתאות עצמאי שווה כל שקל.",
  "תמיד בקש טבלת סילוקין (לוח סילוקין) לפני שאתה חותם.",
  "אם ההכנסה שלך צפויה לעלות — שקול תקופה קצרה יותר.",
  "אל תשתמש בכל ההון העצמי. השאר כרית ביטחון.",
  "מסלול 'משתנה כל 5 שנים' הוא פשרה טובה בין קבועה למשתנה.",
  "שים לב: ריבית נמוכה על סכום קטן = חיסכון קטן. עדיף ריבית נמוכה על סכום גדול.",
  "אם יש לך הלוואות אחרות — שקול לאחד אותן עם המשכנתא.",
  "בדוק האם אתה זכאי למשכנתא מסובסדת (זכאות משרד השיכון).",
  "כשהריבית במשק עולה — המסלולים הקבועים נהיים יקרים יותר. תזמון חשוב.",
  "אל תתעלם מעמלת פירעון מוקדם — היא יכולה להגיע לעשרות אלפי שקלים.",
  "אם אתה עצמאי — הכן מסמכים ל-2 שנים אחרונות מראש.",
  "תמיד קרא את האותיות הקטנות. במיוחד סעיף הפרשי הצמדה.",
  "צמוד מדד + ריבית נמוכה לא בהכרח זול. תלוי באינפלציה.",
  "אם המשכנתא שלך מעל 5 שנים — בדוק מחדש כל שנתיים אם כדאי למחזר.",
  "לפני חתימה — וודא שהבנת כל סעיף. אין שאלות טיפשיות כשמדובר במשכנתא.",
];

export default function MortgageTipsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - 10);
    setCanScrollLeft(Math.abs(el.scrollLeft) > 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);

      if (currentScroll >= maxScroll - 10) {
        // Reset to start
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Scroll one card (RTL: negative)
        el.scrollBy({ left: -300, behavior: "smooth" });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? 320 : -320;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section
      className="py-16 md:py-20 overflow-hidden relative"
      style={{
        background: `
          linear-gradient(135deg, hsl(210 55% 8% / 0.95) 0%, hsl(210 45% 14% / 0.92) 50%, hsl(210 40% 18% / 0.95) 100%),
          url("data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2300d4aa' stop-opacity='0.08'/%3E%3Cstop offset='100%25' stop-color='%23fbbf24' stop-opacity='0.05'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='hsl(210,50%25,10%25)' width='600' height='400'/%3E%3Ccircle cx='100' cy='300' r='180' fill='url(%23g1)'/%3E%3Ccircle cx='500' cy='100' r='160' fill='url(%23g1)'/%3E%3Cpath d='M50 200 Q150 100 300 180 Q450 260 550 150' stroke='%2300d4aa' stroke-opacity='0.06' stroke-width='2' fill='none'/%3E%3Cpath d='M0 300 Q200 220 400 280 Q500 310 600 250' stroke='%23fbbf24' stroke-opacity='0.05' stroke-width='1.5' fill='none'/%3E%3Cpath d='M80 50 L120 180 L200 120 L280 200 L360 90 L440 160 L520 80' stroke='%2300d4aa' stroke-opacity='0.07' stroke-width='1' fill='none'/%3E%3Ctext x='460' y='350' font-size='60' fill='%23fbbf24' fill-opacity='0.04' font-family='sans-serif' font-weight='bold'%3E₪%3C/text%3E%3Ctext x='60' y='80' font-size='40' fill='%2300d4aa' fill-opacity='0.04' font-family='sans-serif'%3E%%3C/text%3E%3C/svg%3E")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-1">
              💡 30 טיפים למשכנתא מנצחת
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              title={isPaused ? "המשך" : "עצור"}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              className="min-w-[280px] max-w-[300px] bg-card rounded-2xl p-5 shadow-card border border-border hover:border-gold/20 transition-colors flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center mb-3">
                  <Lightbulb size={20} className="text-yellow-400 fill-yellow-400/40" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{tip}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gold/20" />
          ))}
        </div>
      </div>
    </section>
  );
}
