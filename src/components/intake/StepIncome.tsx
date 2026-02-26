import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type IncomeData = z.infer<typeof incomeSchema>;

interface Props {
  defaultValues: Partial<IncomeData>;
  onNext: (data: IncomeData) => void;
  onBack: () => void;
  saving: boolean;
  hasBorrower2: boolean;
}

export default function StepIncome({ defaultValues, onNext, onBack, saving, hasBorrower2 }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<IncomeData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: defaultValues as any,
  });

  const hasAdditional = watch("hasAdditionalIncome");
  const b2HasAdditional = watch("b2HasAdditionalIncome");
  const income1 = watch("monthlyNetIncome") || 0;
  const income2 = hasBorrower2 ? (watch("b2MonthlyNetIncome") || 0) : 0;
  const additionalIncome = hasAdditional === "yes" ? (watch("additionalIncomeAmount") || 0) : 0;
  const b2AdditionalIncome = b2HasAdditional === "yes" ? (watch("b2AdditionalIncomeAmount") || 0) : 0;
  const totalIncome = income1 + income2 + additionalIncome + b2AdditionalIncome;

  const employmentOptions = [
    { value: "salaried", label: "שכיר/ה" },
    { value: "self_employed", label: "עצמאי/ת" },
    { value: "both", label: "גם וגם" },
    { value: "maternity", label: "חל״ת" },
    { value: "unemployed", label: "לא עובד/ת" },
  ];

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">הכנסות ותעסוקה</h2>
        <p className="text-sm text-muted-foreground">פרטי ההכנסה שלך {hasBorrower2 && "ושל לווה 2"}</p>
      </div>

      {/* Borrower 1 */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-foreground text-lg">לווה 1</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="סטטוס תעסוקה *" error={errors.employmentStatus?.message}>
            <select {...register("employmentStatus")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              {employmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="הכנסה נטו חודשית (₪) *" error={errors.monthlyNetIncome?.message}>
            <Input {...register("monthlyNetIncome", { valueAsNumber: true })} type="number" dir="ltr" placeholder="15,000" />
          </Field>
          <Field label="ותק (חודשים) *" error={errors.workSeniority?.message}>
            <Input {...register("workSeniority", { valueAsNumber: true })} type="number" dir="ltr" placeholder="36" />
          </Field>
          <Field label="תחום עיסוק *" error={errors.occupation?.message}>
            <Input {...register("occupation")} placeholder="הנדסת תוכנה" />
          </Field>
          <Field label="הכנסות נוספות? *" error={errors.hasAdditionalIncome?.message}>
            <select {...register("hasAdditionalIncome")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
          </Field>
          {hasAdditional === "yes" && (
            <>
              <Field label="מקור">
                <Input {...register("additionalIncomeSource")} placeholder="שכירות, קצבאות..." />
              </Field>
              <Field label="סכום חודשי (₪)">
                <Input {...register("additionalIncomeAmount", { valueAsNumber: true })} type="number" dir="ltr" />
              </Field>
            </>
          )}
        </div>
      </div>

      {/* Borrower 2 */}
      {hasBorrower2 && (
        <motion.div className="space-y-4 pt-4 border-t-2 border-gold/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="font-display font-bold text-foreground text-lg">לווה 2</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="סטטוס תעסוקה">
              <select {...register("b2EmploymentStatus")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">בחר...</option>
                {employmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="הכנסה נטו חודשית (₪)">
              <Input {...register("b2MonthlyNetIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="ותק (חודשים)">
              <Input {...register("b2WorkSeniority", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="תחום עיסוק">
              <Input {...register("b2Occupation")} />
            </Field>
            <Field label="הכנסות נוספות?">
              <select {...register("b2HasAdditionalIncome")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">בחר...</option>
                <option value="no">לא</option>
                <option value="yes">כן</option>
              </select>
            </Field>
            {b2HasAdditional === "yes" && (
              <>
                <Field label="מקור">
                  <Input {...register("b2AdditionalIncomeSource")} />
                </Field>
                <Field label="סכום חודשי (₪)">
                  <Input {...register("b2AdditionalIncomeAmount", { valueAsNumber: true })} type="number" dir="ltr" />
                </Field>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="bg-muted rounded-lg p-4">
        <span className="text-sm font-semibold text-foreground">סיכום הכנסות משק בית:</span>
        <span className="font-display text-2xl font-black text-gold mr-3">₪{totalIncome.toLocaleString()}</span>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "שמור והמשך →"}</Button>
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
