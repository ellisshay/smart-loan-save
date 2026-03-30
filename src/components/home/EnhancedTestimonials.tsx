import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "דנה ורועי כהן",
    city: "ראשון לציון",
    savings: "₪22,000",
    text: "קיבלנו 3 הצעות תוך יומיים. חסכנו ₪22,000 על הריבית. התהליך היה פשוט ולא דרש מאיתנו שום מאמץ מיוחד.",
    initials: "דר",
    role: "רכישת דירה ראשונה",
  },
  {
    name: "משה לוי",
    city: "תל אביב",
    savings: "₪18,500",
    text: "הייתי בטוח שצריך יועץ יקר. בסוף קיבלתי הצעות טובות יותר דרך הפלטפורמה, בלי לשלם שקל.",
    initials: "מל",
    role: "מיחזור משכנתא",
  },
  {
    name: "תמר מזרחי",
    city: "חיפה",
    savings: "₪31,000",
    text: "כעצמאית חשבתי שיהיה לי קשה. הפתעתי כשקיבלתי הצעה מעולה תוך 48 שעות. ממליצה בחום!",
    initials: "תמ",
    role: "עצמאית — דירה שנייה",
  },
  {
    name: "יוסי ומיכל אברהם",
    city: "באר שבע",
    savings: "₪27,000",
    text: "השוואת ההצעות הייתה ברורה ופשוטה. ידענו בדיוק מה אנחנו בוחרים ולמה. חסכנו הרבה כסף וזמן.",
    initials: "ימ",
    role: "שדרוג דירה",
  },
];

export default function EnhancedTestimonials() {
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container">
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">מה אומרים עלינו</span>
        </motion.div>
        <motion.h2
          className="font-display text-3xl md:text-5xl font-black text-foreground text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          אלפי משפחות כבר חסכו
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center mb-14 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          הלקוחות שלנו חוסכים בממוצע ₪24,000 על המשכנתא — בלי לצאת מהבית
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="relative bg-card rounded-2xl p-8 shadow-card border border-border hover:border-gold/25 transition-all duration-300 hover:shadow-lg group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Quote size={32} className="absolute top-6 left-6 text-gold/10 group-hover:text-gold/20 transition-colors" />

              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-gold text-gold" />
                ))}
              </div>

              <p className="text-foreground leading-relaxed mb-6 relative z-10">"{t.text}"</p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center font-display font-bold text-gold text-sm ring-2 ring-gold/10">
                  {t.initials}
                </div>
                <div className="flex-1">
                  <div className="font-display font-bold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role} • {t.city}</div>
                </div>
                <span className="bg-gold/10 text-gold text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                  חסכו {t.savings}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
