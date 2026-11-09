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
    title: "בדוק את המשכנתא שלך, חינם",
    desc: "הזן את פרטי המשכנתא הנוכחית שלך באחד מהמחשבונים החכמים שלנו. תוך דקות תקבל השוואה לריביות השוק, הערכת חיסכון או השוואת תמהילים. המחשבונים חינם וללא הרשמה. הבדיקה המהירה חינם ומבקשת שם וטלפון לפני הצגת התוצאה.",
    details: [
      "3 מחשבונים: מדד בזבוז, סימולטור מיחזור, השוואת תמהילים",
      "תוצאות מיידיות עם מספרים אמיתיים",
      "ללא שיחות מכירה, רק נתונים",
    ],
  },
  {
    num: "02",
    icon: Smartphone,
    title: "מלא טופס דיגיטלי קצר",
    desc: "כשרוצים טיפול מלא, פותחים תיק. כ-10 דקות לפתיחת התיק והשלמת הפרטים הראשוניים: פרטי הנכס, ההכנסות וההתחייבויות. התהליך מול EasyMorte מתנהל אונליין, בלי פגישות מיותרות.",
    details: [
      "טופס אינטייק מתקדם, פרטי נכס, הכנסות, התחייבויות",
      "בחירת יעד: הורדת החזר חודשי או קיצור תקופה",
      "הגדרת רמת סיכון: שמרני, מאוזן, או אגרסיבי",
    ],
  },
  {
    num: "03",
    icon: Upload,
    title: "העלה מסמכים בקליק",
    desc: "העלה את המסמכים הנדרשים ישירות מהנייד או מהמחשב, דוח יתרות, תלושי שכר ותעודת זהות. המסמכים נשמרים באחסון פרטי עם הרשאות גישה.",
    details: [
      "העלאה מהירה, גרור ושחרר",
      "אחסון פרטי עם הרשאות גישה",
      "מעקב אחרי סטטוס כל מסמך באזור האישי",
    ],
  },
  {
    num: "04",
    icon: Zap,
    title: "אנחנו בונים לך 3 תמהילים",
    desc: "אנחנו מנתחים את הנתונים ובונים 3 תמהילי משכנתא מותאמים אישית, שמרני, מאוזן ואגרסיבי, עם ניתוח רגישות, יתרונות וחסרונות, והמלצה.",
    details: [
      "תמהיל שמרני, יציבות מקסימלית",
      "תמהיל מאוזן, איזון בין חיסכון לסיכון",
      "תמהיל אגרסיבי, חיסכון מקסימלי",
      "ניתוח רגישות: מה קורה אם פריים עולה?",
    ],
  },
  {
    num: "05",
    icon: FileText,
    title: "התיק עובר בדיקה מקצועית",
    desc: "מרגע שהתיק מלא והתשלום התקבל מתחיל חלון טיפול של עד 72 שעות להכנת הניתוח, בדיקת התמהיל והכנת התיק למכרז בנקים.",
    details: [
      "סיכום מקצועי ברור באזור האישי",
      "3 תמהילים + טבלאות השוואה",
      "ניתוח רגישות וסיכונים",
      "המלצה אישית מנומקת",
    ],
  },
  {
    num: "06",
    icon: Send,
    title: "מוציאים את הבנקים למכרז",
    desc: "אחרי בדיקה מקצועית אנחנו מעבירים את התיק לבנקים הרלוונטיים בערוצים הזמינים, מרכזים את ההצעות ומנהלים השוואה ומשא ומתן. זמן התגובה והאישור של הבנקים עצמם אינו בשליטת EasyMorte.",
    details: [
      "העברת תיק מסודר לעד 3 בנקים רלוונטיים",
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
              טיפול מקצועי בתוך עד 72 שעות מתיק מלא ותשלום
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
              איך זה <span className="text-gradient-gold">עובד?</span>
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
              טופס דיגיטלי, מסמכים במקום אחד, בדיקה מקצועית ומכרז בנקים. חלון הטיפול שלנו הוא עד 72 שעות מרגע שהתיק מלא ושולם. זמני האישור של הבנק משתנים.
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
              <h3 className="font-display font-bold text-foreground mb-1">תהליך EasyMorte דיגיטלי</h3>
              <p className="text-sm text-muted-foreground">בלי פגישות מיותרות. פותחים תיק ומנהלים את התהליך אונליין. ייתכן שהבנק ידרוש זיהוי או חתימה מולו.</p>
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
              <h3 className="font-display font-bold text-foreground mb-1">עד 72 שעות לטיפול שלנו</h3>
              <p className="text-sm text-muted-foreground">מרגע שהתיק מלא ושולם ועד לסיום הטיפול המקצועי שלנו.</p>
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
              <h3 className="font-display font-bold text-foreground mb-1">פרטיות ואבטחה</h3>
              <p className="text-sm text-muted-foreground">אחסון פרטי עם הרשאות גישה, חיבור מוצפן (HTTPS), וצפייה במסמכים נרשמת ביומן ביקורת.</p>
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
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              מוכן להתחיל?
            </h2>
            <p className="text-foreground/70 mb-8 max-w-md mx-auto">
              בדיקה ראשונית חינם. הטיפול המקצועי שלנו מתבצע בתוך עד 72 שעות מרגע שהתיק מלא והתשלום התקבל.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/intake">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">פתיחת תיק</Button>
              </Link>
              <Link to="/mortgage-check">
                <Button variant="outline-light" size="xl" className="w-full sm:w-auto h-auto min-h-14 py-3 whitespace-normal">
                  בדיקת המשכנתא שלי בחינם
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
