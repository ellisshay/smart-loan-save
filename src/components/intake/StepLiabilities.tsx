import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { liabilitiesSchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type LiabilitiesData = z.infer<typeof liabilitiesSchema>;

interface Props {
  defaultValues: Partial<LiabilitiesData>;
  onNext: (data: LiabilitiesData) => void;
  onBack: () => void;
  saving: boolean;
  totalIncome: number;
}

export default function StepLiabilities({ defaultValues, onNext, onBack, saving, totalIncome }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LiabilitiesData>({
    resolver: zodResolver(liabilitiesSchema),
    defaultValues: defaultValues as any,
  });

  const hasCards = watch("hasSignificantCreditCards");
  const incomeChange = watch("incomeChangeExpected");
  const existingPayments = watch("existingLoanPayments") || 0;
  const cardMonthly = hasCards === "yes" ? (watch("creditCardMonthly") || 0) : 0;
  const maxPayment = watch("maxDesiredPayment") || 0;
  
  const totalLiabilities = existingPayments + cardMonthly;
  const dti = totalIncome > 0 ? Math.round(((totalLiabilities + maxPayment) / totalIncome) * 100) : 0;

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">התחייבויות ומסגרת סיכון</h2>
        <p className="text-sm text-muted-foreground">הלוואות קיימות והעדפות</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="החזרי הלוואות חודשיים קיימים (₪) *" error={errors.existingLoanPayments?.message}>
          <Input {...register("existingLoanPayments", { valueAsNumber: true })} type="number" dir="ltr" placeholder="0" />
        </Field>
        <Field label="כרטיסי אשראי בהו״ק משמעותיות? *" error={errors.hasSignificantCreditCards?.message}>
          <select {...register("hasSignificantCreditCards")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        {hasCards === "yes" && (
          <Field label="סכום חודשי (₪)">
            <Input {...register("creditCardMonthly", { valueAsNumber: true })} type="number" dir="ltr" />
          </Field>
        )}
        <Field label="חובות בפיגור? *" error={errors.hasDelinquentDebt?.message}>
          <select {...register("hasDelinquentDebt")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        <Field label="הליכים משפטיים/הוצל״פ? *" error={errors.hasLegalProceedings?.message}>
          <select {...register("hasLegalProceedings")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="font-display font-bold text-foreground mb-4">העדפות</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="החזר חודשי מקסימלי רצוי (₪) *" error={errors.maxDesiredPayment?.message}>
            <Input {...register("maxDesiredPayment", { valueAsNumber: true })} type="number" dir="ltr" placeholder="5,000" />
          </Field>
          <Field label="יעד מרכזי *" error={errors.mainGoal?.message}>
            <select {...register("mainGoal")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="lower_payment">הורדת החזר</option>
              <option value="total_savings">חיסכון כולל</option>
              <option value="stability">יציבות</option>
              <option value="shorter_term">קיצור תקופה</option>
            </select>
          </Field>
          <Field label="רמת סיכון *" error={errors.riskLevel?.message}>
            <select {...register("riskLevel")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
          </Field>
          <Field label="צפי שינוי בהכנסה ב-24 חודשים">
            <select {...register("incomeChangeExpected")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="up">עולה</option>
              <option value="down">יורדת</option>
              <option value="none">לא צפוי שינוי</option>
            </select>
          </Field>
          {incomeChange && incomeChange !== "none" && (
            <Field label="פירוט קצר">
              <Input {...register("incomeChangeDetails")} placeholder="תיאור השינוי הצפוי" />
            </Field>
          )}
        </div>
      </div>

      {/* DTI Summary */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
        <div>
          <span className="text-sm text-muted-foreground block">יחס החזר משוער (DTI)</span>
          <span className={`font-display text-2xl font-black ${dti > 40 ? "text-destructive" : dti > 30 ? "text-warning" : "text-success"}`}>
            {dti}%
          </span>
        </div>
        {dti > 40 && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle size={16} />
            יחס גבוה
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "עוד צעד קטן לניתוח →"}</Button>
      </div>
    </motion.form>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-foreground mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
