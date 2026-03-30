import { useState, useMemo } from "react";
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
  CreditCard,
  Building2,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Advisor Plans ── */
const advisorPlans = [
  {
    name: "בסיסי",
    price: "₪299",
    period: "לחודש",
    leads: "5 לידים",
    features: [
      "5 לידים בחודש",
      "גישה לשוק הלידים",
      "הגשת הצעות ללקוחות",
      "פרופיל יועץ בסיסי",
    ],
    missing: ["הופעה מועדפת", "לידים ללא הגבלה", "תמיכה ייעודית"],
    featured: false,
    tier: "basic" as const,
  },
  {
    name: "מקצועי",
    price: "₪599",
    period: "לחודש",
    leads: "15 לידים ⭐",
    features: [
      "15 לידים בחודש",
      "גישה מלאה לשוק הלידים",
      "הגשת הצעות ללקוחות",
      "פרופיל יועץ מורחב",
      "סטטיסטיקות ודוחות",
      "תמיכה בעדיפות",
    ],
    missing: ["הופעה מועדפת"],
    featured: true,
    tier: "pro" as const,
  },
  {
    name: "פרימיום",
    price: "₪999",
    period: "לחודש",
    leads: "ללא הגבלה",
    features: [
      "לידים ללא הגבלה",
      "הופעה מועדפת בשוק",
      "הגשת הצעות ללקוחות",
      "פרופיל יועץ פרימיום",
      "סטטיסטיקות מתקדמות",
      "תמיכה ייעודית 24/7",
      "באנר מותאם אישית",
    ],
    missing: [],
    featured: false,
    tier: "premium" as const,
  },
];

/* ── Client Plans ── */
const clientPlans = [
  {
    name: "בדיקה בסיסית",
    price: "₪0",
    period: "",
    desc: "סימולציה ראשונית בלבד",
    features: [
      "מחשבון חיסכון בסיסי",
      "ציון בזבוז מיידי",
      "גרף השוואה כללי",
    ],
    missing: ["ניתוח דוח יתרות", "שליחה לבנקים", "ליווי אישי"],
    featured: false,
    tier: "free" as const,
  },
  {
    name: "תיק פרימיום 48 שעות",
    price: "₪3,800",
    period: "חד-פעמי",
    desc: "ניתוח מקצועי + שליחה לבנקים",
    features: [
      "ניתוח דוח יתרות אמיתי",
      "3 תמהילים מותאמים אישית",
      "דוח PDF מקצועי מלא",
      "שליחה ישירה לבנקים",
      "ליווי עד קבלת הצעה",
      "אזור לקוח אישי",
    ],
    missing: [],
    featured: true,
    tier: "premium-client" as const,
  },
  {
    name: "ליווי מלא",
    price: "₪7,000",
    period: "חד-פעמי",
    desc: "ליווי אישי מקצה לקצה",
    features: [
      "כל הכלול בתיק פרימיום",
      "יועץ משכנתאות אישי",
      "משא ומתן מול הבנקים",
      "ליווי עד חתימת הסכם",
      "תמיכה טלפונית ללא הגבלה",
    ],
    missing: [],
    featured: false,
    tier: "full" as const,
  },
];

/* ── Advisor comparison rows ── */
const advisorComparisonRows = [
  { label: "לידים בחודש", basic: "5", pro: "15", premium: "ללא הגבלה" },
  { label: "גישה לשוק הלידים", basic: true, pro: true, premium: true },
  { label: "הגשת הצעות", basic: true, pro: true, premium: true },
  { label: "סטטיסטיקות", basic: false, pro: true, premium: true },
  { label: "הופעה מועדפת", basic: false, pro: false, premium: true },
  { label: "תמיכה ייעודית", basic: false, pro: false, premium: true },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"clients" | "advisors">("clients");
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = () => {
    setShowModal(false);
    navigate("/intake");
  };

  return (
    <section className="py-16 md:py-24 relative" dir="rtl">
      <div className="absolute inset-0 bg-hero" />
      <div className="container max-w-5xl relative z-10">
        {/* Header */}
        <motion.div className="text-center mb-8" {...fadeUp}>
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            תמחור <span className="text-gradient-gold">פשוט ושקוף</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-6">
            ללקוחות — חינם לחלוטין. ליועצים — מנוי חודשי או רכישה בודדת.
          </p>

          {/* Tab switcher */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="inline-flex">
            <TabsList className="bg-secondary/60">
              <TabsTrigger value="clients" className="gap-1.5">
                <Users size={14} /> לקוחות
              </TabsTrigger>
              <TabsTrigger value="advisors" className="gap-1.5">
                <Building2 size={14} /> יועצים
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* ════════════ ADVISORS TAB ════════════ */}
        {tab === "advisors" && (
          <>
            {/* Per-lead banner */}
            <motion.div
              className="bg-card border border-border rounded-xl p-4 mb-8 text-center max-w-lg mx-auto"
              {...fadeUp}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-muted-foreground mb-1">מעדיף לא להתחייב?</p>
              <p className="text-lg font-display font-bold text-foreground">
                רכישת ליד בודד — <span className="text-gold">₪200</span> לליד
              </p>
              <p className="text-xs text-muted-foreground mt-1">Pay per lead · ללא מנוי</p>
            </motion.div>

            {/* Advisor plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {advisorPlans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  className={`relative bg-card rounded-2xl p-8 shadow-card border-2 transition-all flex flex-col ${
                    plan.featured
                      ? "border-gold shadow-gold md:scale-105 z-10"
                      : "border-transparent"
                  }`}
                  {...fadeUp}
                  transition={{ delay: i * 0.1 }}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 right-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} /> הכי פופולרי
                    </div>
                  )}

                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                    {plan.name}
                  </h2>
                  <p className="text-sm text-gold font-semibold mb-4">{plan.leads}</p>

                  <div className="font-display text-5xl font-black text-foreground mb-1">
                    {plan.price}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.period}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 size={16} className="text-gold shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                        <X size={16} className="shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth">
                    <Button
                      variant={plan.featured ? "cta" : "outline"}
                      size="lg"
                      className="w-full"
                    >
                      {plan.featured ? "התחל עכשיו" : "בחר תוכנית"}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Featured listing upsell */}
            <motion.div
              className="mt-8 bg-card border border-gold/20 rounded-xl p-6 max-w-lg mx-auto text-center"
              {...fadeUp}
              transition={{ delay: 0.4 }}
            >
              <Award size={24} className="text-gold mx-auto mb-2" />
              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                Featured Listing
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                הופעה מועדפת בראש רשימת היועצים — נראות מקסימלית ללקוחות
              </p>
              <p className="text-2xl font-display font-black text-gold">₪500<span className="text-sm font-normal text-muted-foreground mr-1"> / חודש</span></p>
            </motion.div>

            {/* Advisor comparison table */}
            <motion.div
              className="mt-12 max-w-3xl mx-auto"
              {...fadeUp}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-display font-bold text-center text-foreground mb-6">
                השוואת תוכניות
              </h2>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-4 bg-secondary/50 p-4 text-sm font-semibold text-foreground">
                  <span></span>
                  <span className="text-center">בסיסי</span>
                  <span className="text-center text-gold">מקצועי</span>
                  <span className="text-center">פרימיום</span>
                </div>
                {advisorComparisonRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-4 p-4 text-sm ${
                      i % 2 === 0 ? "bg-card" : "bg-secondary/20"
                    }`}
                  >
                    <span className="text-foreground">{row.label}</span>
                    {(["basic", "pro", "premium"] as const).map((tier) => (
                      <span key={tier} className="text-center">
                        {typeof row[tier] === "boolean" ? (
                          row[tier] ? (
                            <Check size={16} className="inline text-gold" />
                          ) : (
                            <X size={16} className="inline text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="font-semibold text-foreground">{row[tier]}</span>
                        )}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ════════════ CLIENTS TAB ════════════ */}
        {tab === "clients" && (
          <>
            {/* Client plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
              {clientPlans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  className={`relative bg-card rounded-2xl p-8 shadow-card border-2 transition-all flex flex-col ${
                    plan.featured
                      ? "border-gold shadow-gold md:scale-105 z-10"
                      : "border-transparent"
                  }`}
                  {...fadeUp}
                  transition={{ delay: i * 0.1 }}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 right-4 bg-gold-gradient text-accent-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} /> הכי פופולרי
                    </div>
                  )}

                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                    {plan.name}
                  </h2>
                  <p className="text-base text-muted-foreground mb-4">{plan.desc}</p>

                  <div className="font-display text-5xl font-black text-foreground mb-1">
                    {plan.price}
                  </div>
                  {plan.period && (
                    <p className="text-sm text-muted-foreground mb-6">{plan.period}</p>
                  )}

                  <ul className="space-y-3 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 size={16} className="text-gold shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                        <X size={16} className="shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.featured ? (
                    <Button variant="cta" size="lg" className="w-full" onClick={() => setShowModal(true)}>
                      התחל עכשיו
                    </Button>
                  ) : (
                    <Link to={plan.tier === "free" ? "/calculators" : "/intake"}>
                      <Button
                        variant={plan.tier === "free" ? "ghost" : "outline"}
                        size={plan.tier === "free" ? "default" : "lg"}
                        className="w-full"
                      >
                        {plan.tier === "free" ? "בדיקה חינמית" : "בחר ליווי מלא"}
                      </Button>
                    </Link>
                  )}

                  {plan.featured && (
                    <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                      <Shield size={10} /> תשלום מאובטח · ללא התחייבות להמשך
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Client info */}
            <motion.div
              className="mt-10 bg-card border border-gold/20 rounded-xl p-6 max-w-lg mx-auto text-center"
              {...fadeUp}
              transition={{ delay: 0.4 }}
            >
              <Users size={24} className="text-gold mx-auto mb-2" />
              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                הלקוח לא משלם כלום
              </h3>
              <p className="text-sm text-muted-foreground">
                מלא פרופיל, העלה מסמכים, וקבל עד 3 הצעות תחרותיות מיועצים מורשים — בחינם לחלוטין.
              </p>
            </motion.div>
          </>
        )}

        {/* Trust badges */}
        <motion.div
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          {...fadeUp}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: Users, label: "4,200+ לקוחות" },
            { icon: TrendingDown, label: "חיסכון ממוצע 84,000 ₪" },
            { icon: Clock, label: "הצעות תוך 48 שעות" },
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

        <p className="text-xs text-muted-foreground text-center mt-8 max-w-md mx-auto">
          המחירים כוללים מע״מ. ניתן לבטל מנוי בכל עת.
        </p>
      </div>

      {/* Client checkout modal */}
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
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
              חזור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
