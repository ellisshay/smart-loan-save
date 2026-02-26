import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Target,
  Award,
  Heart,
  TrendingDown,
  Clock,
  CheckCircle2,
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "שקיפות מלאה",
    desc: "אנחנו לא מסתירים כלום. כל מספר, כל חישוב, כל עמלה — שקוף לחלוטין.",
  },
  {
    icon: TrendingDown,
    title: "חיסכון אמיתי",
    desc: "הלקוחות שלנו חוסכים בממוצע ₪847,000 על פני חיי המשכנתא.",
  },
  {
    icon: Shield,
    title: "ללא קונפליקט אינטרסים",
    desc: "אנחנו לא מקבלים עמלות מבנקים. האינטרס היחיד שלנו — החיסכון שלך.",
  },
  {
    icon: Clock,
    title: "מהירות",
    desc: "48 שעות מרגע התשלום ויש לך דוח מקצועי מלא עם 3 תמהילים.",
  },
];

const team = [
  {
    name: "רון כהן",
    role: "מייסד ומנכ\"ל",
    desc: "15+ שנות ניסיון בייעוץ משכנתאות. עבד עם מעל 5,000 משפחות.",
  },
  {
    name: "שירה לוי",
    role: "ראשת ניתוח פיננסי",
    desc: "כלכלנית בהכשרתה עם התמחות בשוק המשכנתאות הישראלי.",
  },
  {
    name: "אלון ברק",
    role: "מנהל טכנולוגיה",
    desc: "בונה את המנוע האלגוריתמי שמייצר תמהילים חכמים ומותאמים.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero py-20 md:py-28">
        <div className="container max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black text-primary-foreground mb-4">
              אנחנו <span className="text-gradient-gold">EasyMorte</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 leading-relaxed max-w-xl mx-auto">
              הקמנו את EasyMorte כי נמאס לנו לראות ישראלים משלמים יותר מדי על המשכנתא שלהם.
              אנחנו מאמינים שכל אדם ראוי לדעת בדיוק כמה הוא יכול לחסוך — בלי שיחות מכירה,
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
              לתת לכל ישראלי את הכלים לקבל את ההחלטה הפיננסית הכי חשובה בחייו — בצורה חכמה,
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

      {/* Team */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
              הצוות שלנו
            </h2>
            <p className="text-lg text-muted-foreground">
              אנשי מקצוע שמבינים משכנתאות — ודואגים שתחסוך.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className="bg-card rounded-2xl p-6 shadow-card text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="text-gold" size={28} />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{member.name}</h3>
                <p className="text-sm text-gold font-semibold mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.desc}</p>
              </motion.div>
            ))}
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
              מוכן לחסוך על המשכנתא?
            </h2>
            <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
              בדיקה חינמית תוך דקה. בלי התחייבות.
            </p>
            <Link to="/calculators">
              <Button variant="hero" size="xl">בדוק עכשיו — חינם</Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
