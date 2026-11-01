import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Target,
  TrendingDown,
  Clock,
} from "lucide-react";
import founderImage from "@/assets/shay-ellis-founder.png";

const values = [
  {
    icon: Target,
    title: "שקיפות",
    desc: "מחיר קבוע וגלוי של 3,450 ₪, והסבר בשפה פשוטה מאחורי כל חישוב והשוואה.",
  },
  {
    icon: TrendingDown,
    title: "העלות הכוללת, לא רק הריבית",
    desc: "אנחנו בוחנים את העלות הכוללת, התמהיל והסיכון, ולא מסתפקים בריבית אחת או בהחזר הראשון.",
  },
  {
    icon: Shield,
    title: "בלי עמלות מהבנקים",
    desc: "אנחנו לא מקבלים עמלות מהבנקים. את השירות משלמים לקוחות, במחיר קבוע.",
  },
  {
    icon: Clock,
    title: "חלון טיפול ברור",
    desc: "בתוך עד 72 שעות מרגע שהתיק מלא והתשלום התקבל, מוכנה בדיקה מקצועית עם 3 תמהילים. זמני הבנקים אינם בשליטתנו.",
  },
];

const founder = {
  name: "שי אליס",
  role: "מייסד EASY MORTE",
  bio: "בעל תואר ראשון במנהל עסקים, עם רקע בפיננסים, שוק ההון, ייעוץ עסקי וטכנולוגיה, וניסיון במערכות פיננסיות ובתהליכים דיגיטליים. את EasyMorte הקים כדי לקחת תהליך משכנתא מסורבל ולהפוך אותו לתהליך דיגיטלי, ברור ומסודר.",
};

const weDo = [
  "מרכזים את הפרטים והמסמכים של התיק במקום אחד",
  "בודקים כושר החזר ובונים תמהילים",
  "פונים לעד 3 בנקים רלוונטיים ומשווים בין ההצעות",
  "מציגים באזור האישי איפה התיק עומד ומה השלב הבא",
];
const weDont = [
  "אנחנו לא בנק ולא מאשרים משכנתאות",
  "אנחנו לא מקבלים עמלות מהבנקים",
  "אנחנו לא מבטיחים אישור, ריבית או תנאים מסוימים",
];

export default function AboutPage() {
  return (
    <>
      {/* Founder */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
              המייסד
            </h1>
            <p className="text-lg text-muted-foreground">
              האדם שעומד מאחורי EASY MORTE
            </p>
          </motion.div>

          <motion.div
            className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/60"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-3">
                <img
                  src={founderImage}
                  alt="שי אליס, מייסד EASY MORTE"
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center text-center md:text-right">
                <h3 className="font-display font-black text-2xl text-foreground">
                  {founder.name}
                </h3>
                <p className="text-gold font-semibold text-sm mb-4">{founder.role}</p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {founder.bio}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
              אנחנו <span className="text-gradient-gold">EASY MORTE</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              EasyMorte מרכזת את תהליך המשכנתא מולכם ומול הגורמים הרלוונטיים: פותחים תיק פעם אחת,
              מעלים פרטים ומסמכים במקום אחד, ורואים בכל רגע איפה הדברים עומדים.
              בלי שיחות מכירה ובלי לחץ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              המשימה שלנו
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              לעזור לכם לקבל החלטה על המשכנתא בצורה מסודרת, מבוססת נתונים ושקופה.
              אנחנו לא מקבלים עמלות מהבנקים. את השירות אתם משלמים, במחיר קבוע.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                className="flex gap-4 bg-card rounded-2xl p-6 shadow-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <v.icon className="text-gold" size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do / don't + business identity */}
      <section className="py-16 md:py-20 bg-secondary/50">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-black text-foreground mb-8 text-center">מה אנחנו עושים, ומה לא</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl p-6 shadow-card space-y-2">
              <p className="font-bold text-foreground mb-1">מה אנחנו עושים</p>
              {weDo.map((t) => <p key={t} className="text-sm text-foreground">✓ {t}</p>)}
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-card space-y-2">
              <p className="font-bold text-foreground mb-1">מה אנחנו לא</p>
              {weDont.map((t) => <p key={t} className="text-sm text-muted-foreground">✕ {t}</p>)}
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            אליס שירותי ייעוץ · ע.מ 049025836 · טרומפלדור 11, כפר סבא · <Link to="/contact" className="text-primary underline">צור קשר</Link>
          </p>
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
              10 דקות באתר. ואנחנו נכנסים לעבודה.
            </h2>
            <p className="text-foreground/70 mb-8 max-w-md mx-auto">
              מחיר קבוע 3,450 ₪. הבדיקה הראשונית חינם וללא התחייבות.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/intake"><Button variant="hero" size="xl" className="w-full sm:w-auto">פתיחת תיק</Button></Link>
              <Link to="/mortgage-check"><Button variant="outline" size="xl" className="w-full sm:w-auto">בדיקת המשכנתא שלי בחינם</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
