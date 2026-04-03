import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

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

  const employmentStatus = watch("employmentStatus");
  const hasAdditional = watch("hasAdditionalIncome");
  const b2HasAdditional = watch("b2HasAdditionalIncome");
  const income1 = Number(watch("monthlyNetIncome")) || 0;
  const income2 = hasBorrower2 ? (Number(watch("b2MonthlyNetIncome")) || 0) : 0;
  
  // Sum all additional income sources
  const rentalIncome = hasAdditional === "yes" ? (Number(watch("rentalIncome")) || 0) : 0;
  const benefitsIncome = hasAdditional === "yes" ? (Number(watch("benefitsIncome")) || 0) : 0;
  const alimonyIncome = hasAdditional === "yes" ? (Number(watch("alimonyIncome")) || 0) : 0;
  const investmentIncome = hasAdditional === "yes" ? (Number(watch("investmentIncome")) || 0) : 0;
  const otherIncome = hasAdditional === "yes" ? (Number(watch("otherIncome")) || 0) : 0;
  const b2AdditionalIncome = b2HasAdditional === "yes" ? (Number(watch("b2AdditionalIncomeAmount")) || 0) : 0;
  const totalIncome = income1 + income2 + rentalIncome + benefitsIncome + alimonyIncome + investmentIncome + otherIncome + b2AdditionalIncome;

  const employmentOptions = [
    { value: "salaried", label: "שכיר/ה" },
    { value: "self_employed", label: "עצמאי/ת" },
    { value: "company_owner", label: "בעל שליטה" },
    { value: "pensioner", label: "פנסיונר/ית" },
    { value: "unemployed", label: "לא עובד/ת" },
  ];

  const isSalaried = employmentStatus === "salaried" || employmentStatus === "company_owner";
  const isSelfEmployed = employmentStatus === "self_employed" || employmentStatus === "company_owner";

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
          <Field label="סוג עיסוק *" error={errors.employmentStatus?.message}>
            <select {...register("employmentStatus")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              {employmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="תחום עיסוק *" error={errors.occupation?.message}>
            <Input {...register("occupation")} placeholder="הנדסת תוכנה" />
          </Field>
        </div>

        {/* Salaried fields */}
        {isSalaried && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="מקום עבודה">
              <Input {...register("employer")} placeholder="שם מעסיק" />
            </Field>
            <Field label="ותק (חודשים)">
              <Input {...register("workSeniority", { valueAsNumber: true })} type="number" dir="ltr" placeholder="36" />
            </Field>
            <Field label="סוג חוזה">
              <select {...register("contractType")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">בחר...</option>
                <option value="permanent">קבוע</option>
                <option value="temporary">זמני</option>
              </select>
            </Field>
            <Field label="שכר ברוטו (₪)">
              <Input {...register("grossSalary", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="שכר נטו ממוצע 3 חודשים (₪)">
              <Input {...register("averageNet3Months", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="בונוסים ממוצעים (₪)">
              <Input {...register("averageBonuses", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="רכב ליסינג?">
              <select {...register("hasLeasingCar")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">בחר...</option>
                <option value="no">לא</option>
                <option value="yes">כן</option>
              </select>
            </Field>
          </div>
        )}

        {/* Self-employed fields */}
        {isSelfEmployed && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="תחום פעילות">
                <Input {...register("businessField")} placeholder="ייעוץ עסקי" />
              </Field>
              <Field label="ותק עסק (חודשים)">
                <Input {...register("businessSeniority", { valueAsNumber: true })} type="number" dir="ltr" />
              </Field>
              <Field label="הכנסה שנתית אחרונה (₪)">
                <Input {...register("annualIncome", { valueAsNumber: true })} type="number" dir="ltr" />
              </Field>
              <Field label="הכנסה ממוצעת חודשית (₪)">
                <Input {...register("monthlyAvgSelfEmployed", { valueAsNumber: true })} type="number" dir="ltr" />
              </Field>
              <Field label="חובות מס פתוחים?">
                <select {...register("hasOpenTaxDebts")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">בחר...</option>
                  <option value="no">לא</option>
                  <option value="yes">כן</option>
                </select>
              </Field>
            </div>

            {/* Smart warnings for self-employed */}
            {(Number(watch("businessSeniority")) || 0) > 0 && (Number(watch("businessSeniority")) || 0) < 24 && (
              <motion.div
                className="flex items-start gap-3 bg-[hsl(var(--warning))]/10 rounded-lg p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <AlertTriangle size={18} className="text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-[hsl(var(--warning))]">ותק עסקי נמוך</strong>
                  <p className="text-muted-foreground">פחות מ-2 שנים כעצמאי עלול לגרום לדחייה בבנקים. בנקים דורשים לפחות 2 שנות דוחות.</p>
                </div>
              </motion.div>
            )}

            {(Number(watch("annualIncome")) || 0) > 0 && (Number(watch("monthlyAvgSelfEmployed")) || 0) > 0 && (() => {
              const annual = Number(watch("annualIncome")) || 0;
              const monthlyAvg = Number(watch("monthlyAvgSelfEmployed")) || 0;
              const impliedAnnual = monthlyAvg * 12;
              const variance = Math.abs(annual - impliedAnnual) / Math.max(annual, impliedAnnual) * 100;
              if (variance > 20) {
                return (
                  <motion.div
                    className="flex items-start gap-3 bg-[hsl(var(--warning))]/10 rounded-lg p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <AlertTriangle size={18} className="text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong className="text-[hsl(var(--warning))]">שונות בהכנסה בין השנים</strong>
                      <p className="text-muted-foreground">הפרש משמעותי בין הכנסה שנתית לממוצע חודשי עלול לדרוש נימוק מול הבנק. יש לנו טכניקות להציג את זה נכון.</p>
                    </div>
                  </motion.div>
                );
              }
              return null;
            })()}
          </div>
        )}

        <Field label="הכנסה נטו חודשית כוללת (₪) *" error={errors.monthlyNetIncome?.message}>
          <Input {...register("monthlyNetIncome", { valueAsNumber: true })} type="number" dir="ltr" placeholder="15,000" />
        </Field>

        {/* Additional income */}
        <Field label="הכנסות נוספות? *" error={errors.hasAdditionalIncome?.message}>
          <select {...register("hasAdditionalIncome")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        {hasAdditional === "yes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
            <Field label="שכירות (₪)">
              <Input {...register("rentalIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="קצבאות (₪)">
              <Input {...register("benefitsIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="מזונות (₪)">
              <Input {...register("alimonyIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="השקעות (₪)">
              <Input {...register("investmentIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="אחר (₪)">
              <Input {...register("otherIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="פרט מקור">
              <Input {...register("otherIncomeSource")} placeholder="תיאור מקור" />
            </Field>
          </div>
        )}
      </div>

      {/* Borrower 2 */}
      {hasBorrower2 && (
        <motion.div className="space-y-4 pt-4 border-t-2 border-gold/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="font-display font-bold text-foreground text-lg">לווה 2</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="סוג עיסוק">
              <select {...register("b2EmploymentStatus")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">בחר...</option>
                {employmentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="תחום עיסוק">
              <Input {...register("b2Occupation")} />
            </Field>
            <Field label="מקום עבודה">
              <Input {...register("b2Employer")} />
            </Field>
            <Field label="הכנסה נטו חודשית (₪)">
              <Input {...register("b2MonthlyNetIncome", { valueAsNumber: true })} type="number" dir="ltr" />
            </Field>
            <Field label="ותק (חודשים)">
              <Input {...register("b2WorkSeniority", { valueAsNumber: true })} type="number" dir="ltr" />
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
        <span className="text-sm font-semibold text-foreground">סה״כ הכנסה נטו משק בית:</span>
        <span className="font-display text-2xl font-black text-gold mr-3">₪{totalIncome.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground mr-2">(מחושב אוטומטית)</span>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "סיים שלב וקבל תוצאה →"}</Button>
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
