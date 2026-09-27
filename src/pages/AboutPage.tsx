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
    title: "שקיפות מלאה",
    desc: "אנחנו לא מסתירים כלום. כל מספר, כל חישוב, כל עמלה, שקוף לחלוטין.",
  },
  {
    icon: TrendingDown,
    title: "חיסכון אמיתי",
    desc: "הלקוחות שלנו חוסכים בממוצע ₪847,000 על פני חיי המשכנתא.",
  },
  {
    icon: Shield,
    title: "ללא קונפליקט אינטרסים",
    desc: "אנחנו לא מקבלים עמלות מבנקים. האינטרס היחיד שלנו, החיסכון שלך.",
  },
  {
    icon: Clock,
    title: "מהירות",
    desc: "72 שעות מרגע התשלום ויש לך דוח מקצועי מלא עם 3 תמהילים.",
  },
];

const founder = {
  name: "שי אליס",
  role: "מייסד EASY MORTE",
  bio: "שי אליס מגיע מהחיבור שבין פיננסים, טכנולוגיה ועסקים. בעל תואר ראשון במנהל עסקים וניסיון בעולמות שוק ההון, המימון, מערכות פיננסיות והייעוץ העסקי, עם התמחות בהפיכת מספרים ותהליכים מורכבים להחלטות עסקיות ברורות. לאחר שנים של עבודה עם עסקים וחברות, הקים את EasyMorte מתוך מטרה פשוטה, לקחת תהליך משכנתא מסורבל ולהפוך אותו לתהליך דיגיטלי, ברור, מהיר ומקצועי.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
              אנחנו <span className="text-gradient-gold">EASY MORTE</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              הקמנו את EASY MORTE כי נמאס לנו לראות ישראלים משלמים יותר מדי על המשכנתא שלהם.
              אנחנו מאמינים שכל אדם ראוי לדעת בדיוק כמה הוא יכול לחסוך, בלי שיחות מכירה,
              בלי לחץ, ובלי קונפליקט אינטרסים.
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
              לתת לכל ישראלי את הכלים לקבל את ההחלטה הפיננסית הכי חשובה בחייו, בצורה חכמה,
              מבוססת נתונים, ושקופה. אנחנו לא יועצים שמקבלים עמלה מהבנק. אנחנו בצד שלך.
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

      {/* Numbers */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "4,200+", label: "לקוחות מרוצים" },
              { value: "₪847K", label: "חיסכון ממוצע" },
              { value: "15+", label: "שנות ניסיון" },
              { value: "98%", label: "שביעות רצון" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-display text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-5xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
              המייסד
            </h2>
            <p className="text-lg text-muted-foreground">
              האדם שעומד מאחורי EASY MORTE
            </p>
          </motion.div>

          <motion.div
            className="bg-card rounded-3xl shadow-card overflow-hidden border border-border/60"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-3">
                <img
                  src={founderImage}
                  alt="שי אליס, מייסד EASY MORTE"
                  className="w-full h-64 md:h-full object-cover"
                  loading="lazy"
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

      {/* CTA */}
      <section className="bg-hero py-16 md:py-20">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              מוכן לחסוך על המשכנתא?
            </h2>
            <p className="text-foreground/70 mb-8 max-w-md mx-auto">
              בדיקה חינמית תוך דקה. בלי התחייבות.
            </p>
            <Link to="/calculators">
              <Button variant="hero" size="xl">בדוק עכשיו, חינם</Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
