import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Zap, FileSearch, Landmark, Headphones } from "lucide-react";

const plans = [
  {
    name: "בדיקה ראשונית",
    price: "₪0",
    desc: "להבין אם יש טעם להתקדם לפני שמוציאים כסף",
    features: [
      "מחשבונים ובדיקות ראשוניות",
      "בדיקת משכנתא קיימת לפי נתוני התיק",
      "ללא התחייבות וללא שיחת מכירה חובה",
    ],
    cta: "בדוק את המשכנתא שלי",
    href: "/mortgage-check",
    featured: false,
  },
  {
    name: "EasyMorte מלא",
    price: "₪3,450",
    desc: "תהליך מקצועי מקצה לקצה במחיר קבוע",
    features: [
      "אינטייק פיננסי מלא ואימות מסמכים",
      "ניתוח מקצועי ובניית 3 תמהילים",
      "מכרז והשוואה מול עד 3 בנקים רלוונטיים",
      "משא ומתן והשוואת הצעות",
      "אזור אישי ומעקב אחרי התיק",
      "ליווי עד בחירת הצעה והתקדמות מול הבנק",
    ],
    cta: "פתח תיק",
    href: "/intake",
    featured: true,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <main className="py-16 md:py-24 relative" dir="rtl">
      <div className="absolute inset-0 bg-hero" />
      <div className="container max-w-5xl relative z-10">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            תמחור <span className="text-gradient-gold">פשוט ושקוף</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            מתחילים בחינם. אם רוצים שניקח את התיק עד למכרז בנקים, המחיר הוא 3,450 ₪ חד פעמי.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className={plan.featured ? "border-2 border-gold shadow-gold h-full" : "border border-border h-full"}>
                <CardContent className="p-7 md:p-8 h-full flex flex-col">
                  {plan.featured && (
                    <div className="inline-flex self-start items-center gap-1.5 rounded-full bg-gold/10 text-gold text-xs font-bold px-3 py-1 mb-4">
                      <Zap size={13} />
                      השירות המלא
                    </div>
                  )}
                  <h2 className="font-display text-2xl font-black text-foreground">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">{plan.desc}</p>
                  <div className="font-display text-5xl font-black text-foreground mb-6">{plan.price}</div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                        <CheckCircle2 size={17} className="text-gold shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.featured ? "cta" : "outline"}
                    size="lg"
                    className="w-full"
                    onClick={() => navigate(plan.href)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          {[
            { icon: FileSearch, title: "לא משלמים על סימולציה", text: "אפשר לבדוק ולהבין את הכיוון לפני פתיחת התיק המלא." },
            { icon: Landmark, title: "לא מוכרים ליד", text: "EasyMorte מנהלת את התהליך ומרכזת את העבודה מול הבנקים." },
            { icon: Headphones, title: "72 שעות שלנו", text: "ה-SLA מתחיל רק אחרי שהתיק מלא והתשלום התקבל. זמן הבנק עצמו משתנה." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card/80 p-4">
              <item.icon size={19} className="text-gold mb-2" />
              <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-8 flex items-start gap-3 rounded-xl bg-card border border-border p-4">
          <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            תשלום אינו הבטחת אישור או ריבית מסוימת. החלטת האשראי, התנאים וזמני המענה נקבעים על ידי הבנקים.
          </p>
        </div>
      </div>
    </main>
  );
}
