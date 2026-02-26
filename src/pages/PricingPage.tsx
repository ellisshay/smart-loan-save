import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star } from "lucide-react";

const plans = [
  {
    name: "בדיקה חינמית",
    price: "₪0",
    desc: "בדוק את המשכנתא שלך עכשיו",
    features: [
      "3 מחשבונים חכמים",
      "ציון בזבוז מיידי",
      "סימולציית מיחזור",
      "השוואת תמהילים",
    ],
    cta: "התחל חינם",
    href: "/calculators",
    featured: false,
  },
  {
    name: "תיק פרימיום 48 שעות",
    price: "₪3,800",
    desc: "דוח מקצועי + שליחה לבנקים",
    features: [
      "כל הכלול בבדיקה חינמית",
      "דוח PDF מקצועי",
      "3 תמהילים מותאמים אישית",
      "ניתוח רגישות לריבית",
      "שליחה ישירה לבנקים",
      "ליווי עד קבלת הצעה",
      "אזור לקוח אישי",
    ],
    cta: "התחל עכשיו",
    href: "/checkout",
    featured: true,
  },
  {
    name: "ליווי מלא",
    price: "₪7,000",
    originalPrice: "₪8,500",
    desc: "ליווי אישי מקצה לקצה עד חתימה",
    features: [
      "כל הכלול בתיק פרימיום",
      "יועץ משכנתאות אישי",
      "משא ומתן מול הבנקים",
      "ליווי עד חתימת הסכם",
      "בדיקת מסמכים משפטית",
      "תמיכה טלפונית ללא הגבלה",
      "עדכונים שוטפים בזמן אמת",
    ],
    cta: "בחר ליווי מלא",
    href: "/checkout?plan=full",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            תמחור <span className="text-gradient-gold">פשוט ושקוף</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            בדיקה חינמית. שלם רק כשאתה רוצה דוח מקצועי מלא.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 shadow-card border-2 transition-all ${
                plan.featured ? "border-gold shadow-gold" : "border-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.featured && (
                <div className="absolute -top-3 right-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} />
                  הכי פופולרי
                </div>
              )}

              <h2 className="font-display text-xl font-bold text-foreground mb-1">{plan.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>

              <div className="font-display text-4xl font-black text-foreground mb-6">
                {plan.price}
                {plan.originalPrice && (
                  <span className="text-lg line-through text-muted-foreground mr-2">{plan.originalPrice}</span>
                )}
                {plan.price !== "₪0" && <span className="text-sm font-normal text-muted-foreground mr-1">חד-פעמי</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={16} className="text-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link to={plan.href}>
                <Button
                  variant={plan.featured ? "cta" : "outline"}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
