import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  BarChart3,
  Send,
  CheckCircle2,
  Clock,
  Shield,
  ArrowLeft,
  Smartphone,
  Zap,
} from "lucide-react";

const steps = [
  {
    num: "01",
    icon: BarChart3,
    title: "בדוק את המשכנתא שלך — חינם",
    desc: "הזן את פרטי המשכנתא הנוכחית שלך באחד מהמחשבונים החכמים שלנו. תוך דקה תקבל ציון בזבוז, סימולציית חיסכון, או השוואת תמהילים — הכל חינם וללא רישום.",
    details: [
      "3 מחשבונים: מדד בזבוז, סימולטור מיחזור, השוואת תמהילים",
      "תוצאות מיידיות עם מספרים אמיתיים",
      "ללא שיחות מכירה — רק נתונים",
    ],
  },
  {
    num: "02",
    icon: Smartphone,
    title: "מלא טופס דיגיטלי קצר",
    desc: "אם אתה רוצה דוח מקצועי מלא — פתח תיק פרימיום. מלא טופס דיגיטלי עם פרטי הנכס, ההכנסות וההתחייבויות שלך. הכל אונליין, בלי פגישות ובלי לחכות.",
    details: [
      "טופס אינטייק מתקדם — פרטי נכס, הכנסות, התחייבויות",
      "בחירת יעד: הורדת החזר חודשי או קיצור תקופה",
      "הגדרת רמת סיכון: שמרני, מאוזן, או אגרסיבי",
    ],
  },
  {
    num: "03",
    icon: Upload,
    title: "העלה מסמכים בקליק",
    desc: "העלה את המסמכים הנדרשים ישירות מהנייד או מהמחשב — דוח יתרות, תלושי שכר ותעודת זהות. המערכת מנהלת הכל בצורה מאובטחת.",
    details: [
      "העלאה מהירה — גרור ושחרר",
      "הצפנה מלאה של כל המסמכים",
      "מעקב בזמן אמת על סטטוס המסמכים",
    ],
  },
  {
    num: "04",
    icon: Zap,
    title: "אנחנו בונים לך 3 תמהילים",
    desc: "הצוות המקצועי שלנו מנתח את הנתונים ומייצר 3 תמהילי משכנתא מותאמים אישית — שמרני, מאוזן ואגרסיבי — עם ניתוח רגישות, יתרונות וחסרונות, והמלצה.",
    details: [
      "תמהיל שמרני — יציבות מקסימלית",
      "תמהיל מאוזן — איזון בין חיסכון לסיכון",
      "תמהיל אגרסיבי — חיסכון מקסימלי",
      "ניתוח רגישות: מה קורה אם פריים עולה?",
    ],
  },
  {
    num: "05",
    icon: FileText,
    title: "קבל דוח PDF מקצועי",
    desc: "תוך 48 שעות מרגע העלאת המסמכים, מקבל דוח מקצועי הכולל את כל הניתוח — טבלאות, גרפים, חיסכון צפוי, והמלצה מנומקת.",
    details: [
      "דוח בעברית עם עיצוב מקצועי",
      "3 תמהילים + טבלאות השוואה",
      "ניתוח רגישות וסיכונים",
      "המלצה אישית מנומקת",
    ],
  },
  {
    num: "06",
    icon: Send,
    title: "נשלח לבנקים + מקבלים הצעה",
    desc: "אנחנו שולחים את הדוח והתמהיל המומלץ ישירות לבנקים, מלווים אותך עד קבלת הצעה רשמית, ומוודאים שהחיסכון שלך מתקיים בפועל.",
    details: [
      "שליחה ישירה לבנקים מובילים",
      "ליווי צמוד עד קבלת הצעה",
      "השוואת הצעות שהתקבלו",
      "עדכונים בזמן אמת באזור הלקוח",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
              <Clock size={14} />
              תהליך מלא תוך 48 שעות
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">
              איך זה <span className="text-gradient-gold">עובד?</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-xl mx-auto">
              טופס דיגיטלי קצר, העלאת מסמכים, ותוך 48 שעות יש לך דוח מקצועי עם 3 תמהילים
              + הצעה מהבנק. בלי פגישות, בלי שיחות מכירה, בלי לחכות.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl">
          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="relative bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border"
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <step.icon className="text-gold" size={24} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-4xl font-black text-muted-foreground/15">{step.num}</span>
                    <h3 className="font-display text-xl font-bold text-foreground">{step.title}</h3>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-4">{step.desc}</p>

                <ul className="space-y-2">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 size={16} className="text-gold shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute -bottom-6 right-10 w-0.5 h-6 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Bar */}
      <section className="py-12 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Smartphone className="text-gold" size={24} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">הכל דיגיטלי</h3>
              <p className="text-sm text-muted-foreground">ללא פגישות, ללא ניירת. הכל אונליין מהנייד או מהמחשב.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="text-gold" size={24} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">48 שעות</h3>
              <p className="text-sm text-muted-foreground">מרגע התשלום והעלאת מסמכים עד לדוח מלא.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="text-gold" size={24} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">מאובטח לחלוטין</h3>
              <p className="text-sm text-muted-foreground">כל המידע והמסמכים מוצפנים ומאובטחים.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero py-16 md:py-20">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-primary-foreground mb-4">
              מוכן להתחיל?
            </h2>
            <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
              בדיקה חינמית תוך דקה. דוח מקצועי תוך 48 שעות.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/calculators">
                <Button variant="hero" size="xl">בדוק חינם עכשיו</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline-light" size="xl">
                  פתח תיק פרימיום
                  <ArrowLeft size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
