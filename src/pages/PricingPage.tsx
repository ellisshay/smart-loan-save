import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Star,
  Shield,
  Clock,
  Users,
  TrendingDown,
  Check,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CalcResult {
  displaySavingsMain: number;
  monthlyLoss: number;
  wasteScore: number;
}

const urgencyVariants = [
  { opened: 6, remaining: 2 },
  { opened: 8, remaining: 3 },
  { opened: 5, remaining: 1 },
  { opened: 7, remaining: 2 },
  { opened: 9, remaining: 3 },
  { opened: 4, remaining: 1 },
  { opened: 6, remaining: 3 },
  { opened: 8, remaining: 2 },
];

function UrgencyBadge() {
  const variant = useMemo(() => {
    const sixHourBlock = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return urgencyVariants[sixHourBlock % urgencyVariants.length];
  }, []);

  return (
    <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4 text-center">
      <p className="text-sm font-semibold text-destructive flex items-center justify-center gap-1.5">
        <Zap size={14} />
        נפתחו {variant.opened} תיקים להיום · נותרו {variant.remaining} מקומות לניתוח מהיר
      </p>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [calcData, setCalcData] = useState<CalcResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("calc_savings");
      if (stored) setCalcData(JSON.parse(stored));
    } catch {}
  }, []);

  const savings = calcData?.displaySavingsMain || 120000;
  const monthlyLoss = calcData?.monthlyLoss || Math.round(savings / 120);
  const roiPercent = ((3800 / savings) * 100).toFixed(1);

  const handleCheckout = () => setShowModal(true);
  const handleConfirm = () => {
    setShowModal(false);
    navigate("/intake");
  };

  const plans = [
    {
      name: "בדיקה בסיסית",
      price: "₪0",
      desc: "סימולציה ראשונית בלבד",
      features: [
        "מחשבון חיסכון בסיסי",
        "ציון בזבוז מיידי",
        "גרף השוואה כללי",
        "ללא ניתוח מעמיק",
      ],
      cta: "בדיקה בסיסית בלבד",
      href: "/calculators",
      featured: false,
      tier: "free" as const,
    },
    {
      name: "תיק פרימיום 48 שעות",
      price: "₪3,800",
      desc: "ניתוח מקצועי + שליחה לבנקים",
      features: [
        "ניתוח דוח יתרות אמיתי",
        "3 תמהילים מותאמים אישית",
        "ניתוח רגישות לריבית",
        "דוח PDF מקצועי מלא",
        "שליחה ישירה לבנקים",
        "ליווי עד קבלת הצעה",
        "אזור לקוח אישי",
      ],
      cta: "התחל עכשיו",
      href: "/intake",
      featured: true,
      tier: "premium" as const,
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
      tier: "full" as const,
    },
  ];

  const comparisonRows = [
    { label: "סימולציה בסיסית", free: true, premium: true },
    { label: "ניתוח דוח יתרות אמיתי", free: false, premium: true },
    { label: "שליחה לבנקים", free: false, premium: true },
    { label: "דוח PDF מקצועי", free: false, premium: true },
    { label: "ליווי עד הצעה", free: false, premium: true },
  ];

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-hero" />
      <div className="container max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            תמחור <span className="text-gradient-gold">פשוט ושקוף</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            בדיקה חינמית. שלם רק כשאתה רוצה ניתוח מקצועי מלא.
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 shadow-card border-2 transition-all flex flex-col ${
                plan.featured
                  ? "border-gold shadow-gold md:scale-105 z-10"
                  : "border-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Premium: urgency + popular badge */}
              {plan.featured && (
                <>
                  <div className="absolute -top-3 right-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} />
                    הכי פופולרי
                  </div>
                  <UrgencyBadge />
                </>
              )}

              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {plan.name}
              </h2>
              <p className="text-base text-muted-foreground mb-4">{plan.desc}</p>

              {/* Price */}
              <div className="font-display text-5xl font-black text-foreground mb-2">
                {plan.price}
                {plan.originalPrice && (
                  <span className="text-lg line-through text-muted-foreground mr-2">
                    {plan.originalPrice}
                  </span>
                )}
                {plan.price !== "₪0" && (
                  <span className="text-sm font-normal text-muted-foreground mr-1">
                    חד-פעמי
                  </span>
                )}
              </div>

              {/* ROI under 3,800 */}
              {plan.featured && (
                <div className="bg-gradient-to-r from-gold/10 to-gold-dark/10 border border-gold/20 rounded-lg p-3 mb-4">
                  <p className="text-base text-foreground">
                    אם החיסכון שלך הוא{" "}
                    <span className="font-bold text-gold">
                      {savings.toLocaleString()} ₪
                    </span>
                  </p>
                  <p className="text-base text-muted-foreground">
                    השירות עולה פחות מ-
                    <span className="font-bold text-gold">{roiPercent}%</span>{" "}
                    מהחיסכון
                  </p>
                </div>
              )}

              {/* Who is it for - premium */}
              {plan.featured && (
                <div className="bg-secondary/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                    <Users size={14} className="text-gold" />
                    למי זה מתאים?
                  </p>
                  <p>
                    יתרת משכנתא מעל{" "}
                    <span className="font-bold text-foreground">400,000 ₪</span>{" "}
                    או החזר מעל{" "}
                    <span className="font-bold text-foreground">3,500 ₪</span>
                  </p>
                </div>
              )}

              {/* Features */}
              <ul className="space-y-3 mb-4 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-base text-foreground"
                  >
                    <CheckCircle2 size={18} className="text-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Guarantee - premium */}
              {plan.featured && (
                <div className="border border-gold/20 rounded-lg p-3 mb-4 text-sm text-muted-foreground flex items-start gap-2">
                  <Shield size={16} className="text-gold shrink-0 mt-0.5" />
                  <span>
                    אם לא תזוהה הזדמנות חיסכון אמיתית, תקבל דוח מפורט ללא
                    עלות נוספת
                  </span>
                </div>
              )}

              {/* CTA */}
              {plan.featured ? (
                <Button
                  variant="cta"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                >
                  {plan.cta}
                </Button>
              ) : (
                <Link to={plan.href}>
                  <Button
                    variant={plan.tier === "free" ? "ghost" : "outline"}
                    size={plan.tier === "free" ? "default" : "lg"}
                    className={`w-full ${
                      plan.tier === "free"
                        ? "text-muted-foreground text-sm"
                        : ""
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}

              {/* Micro-copy under premium CTA */}
              {plan.featured && (
                <div className="mt-3 space-y-1 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Shield size={10} /> תשלום מאובטח · ללא התחייבות להמשך
                  </p>
                  <p className="text-xs text-gold/80">
                    הסכום מתקזז בליווי מלא
                  </p>
                  {/* Monthly loss */}
                  <p className="text-xs text-destructive/80 mt-2 flex items-center justify-center gap-1">
                    <TrendingDown size={10} />
                    כל חודש שאתה מחכה עלול לעלות לך כ-
                    {monthlyLoss.toLocaleString()} ₪
                  </p>
                </div>
              )}

              {/* Anchor price for full tier */}
              {plan.tier === "full" && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  כולל הכל מתיק פרימיום + ליווי אישי מלא
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          className="mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-6">
            השוואה ברורה
          </h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-secondary/50 p-4 text-sm font-semibold text-foreground">
              <span></span>
              <span className="text-center">חינמי</span>
              <span className="text-center text-gold">תיק 48 שעות</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 p-4 text-sm ${
                  i % 2 === 0 ? "bg-card" : "bg-secondary/20"
                }`}
              >
                <span className="text-foreground">{row.label}</span>
                <span className="text-center">
                  {row.free ? (
                    <Check size={16} className="inline text-success" />
                  ) : (
                    <X size={16} className="inline text-muted-foreground/40" />
                  )}
                </span>
                <span className="text-center">
                  <Check size={16} className="inline text-gold" />
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: Users, label: "4,200+ לקוחות" },
            { icon: TrendingDown, label: "חיסכון ממוצע 84,000 ₪" },
            { icon: Clock, label: "ניתוח תוך 48 שעות" },
            { icon: Star, label: "98% שביעות רצון" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 justify-center bg-card rounded-xl border border-border p-3"
            >
              <Icon size={18} className="text-gold shrink-0" />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Legal */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-md mx-auto">
          החישוב מבוסס סימולציה והערכות שוק, אינו מהווה התחייבות להצעה בנקאית.
        </p>
      </div>

      {/* Micro-commitment modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              האם תרצה שנבדוק לעומק את הנתונים שלך?
            </DialogTitle>
            <DialogDescription className="mt-2">
              נזהה חיסכון פוטנציאלי אמיתי ונשלח את התוצאות ישירות לבנקים.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button variant="cta" size="lg" onClick={handleConfirm}>
              כן, המשך לבדיקה מלאה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              חזור לתוצאה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
