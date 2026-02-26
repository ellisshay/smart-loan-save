import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntakeSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-success" />
        </div>

        <h1 className="font-display text-3xl font-black text-foreground mb-3">
          התיק הוגש בהצלחה! 🎉
        </h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          קיבלנו את כל הפרטים שלך. הצוות שלנו מתחיל לעבוד על התיק.
        </p>

        <div className="bg-card rounded-xl p-6 border border-border mb-6 text-right">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={20} className="text-gold" />
            <span className="font-display font-bold text-foreground">מה קורה עכשיו?</span>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>השלמת תשלום (אם טרם בוצע)</li>
            <li>ניתוח הנתונים על ידי הצוות</li>
            <li>הפקת 3 תמהילים מותאמים אישית</li>
            <li>שליחה לבנקים וקבלת הצעות</li>
          </ol>
          <div className="mt-4 bg-gold/10 rounded-lg p-3 text-sm text-gold font-semibold">
            ⏱️ SLA: 48 שעות מרגע השלמת מסמכים ותשלום
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft size={16} />
              חזרה לדף הבית
            </Button>
          </Link>
          <Link to="/my-cases" className="flex-1">
            <Button variant="cta" className="w-full">
              צפה בתיקים שלי
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
