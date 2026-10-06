import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { currentMortgageSchema, ISRAELI_BANKS } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

type MortgageData = z.infer<typeof currentMortgageSchema>;

interface Props {
  defaultValues: Partial<MortgageData>;
  onNext: (data: MortgageData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepCurrentMortgage({ defaultValues, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<MortgageData>({
    resolver: zodResolver(currentMortgageSchema),
    defaultValues: {
      ...defaultValues,
      tracks: defaultValues.tracks?.length ? defaultValues.tracks : [],
    } as any,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "tracks" });

  const hasRateChange = watch("hasUpcomingRateChange");
  const hasPenalties = watch("hasExitPenalties");

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">פרטי משכנתא קיימת</h2>
        <p className="text-sm text-muted-foreground">ספר לנו על המשכנתא הנוכחית שלך</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="בנק נוכחי *" error={errors.currentBank?.message}>
          <select {...register("currentBank")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר בנק...</option>
            {ISRAELI_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="יתרה כוללת לסילוק (₪) *" error={errors.totalBalance?.message}>
          <Input {...register("totalBalance", { valueAsNumber: true })} type="number" dir="ltr" />
        </Field>
        <Field label="החזר חודשי נוכחי (₪) *" error={errors.currentMonthlyPayment?.message}>
          <Input {...register("currentMonthlyPayment", { valueAsNumber: true })} type="number" dir="ltr" />
        </Field>
        <Field label="שנים שנותרו *" error={errors.remainingYears?.message}>
          <Input {...register("remainingYears", { valueAsNumber: true })} type="number" dir="ltr" step="0.5" />
        </Field>
        <Field label="מסלולים משתנים בקרוב?">
          <select {...register("hasUpcomingRateChange")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        {hasRateChange === "yes" && (
          <Field label="מתי? (חודש/שנה)">
            <Input {...register("rateChangeDate")} type="month" dir="ltr" />
          </Field>
        )}
        <Field label="קנסות פירעון ידועים?">
          <select {...register("hasExitPenalties")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        {hasPenalties === "yes" && (
          <Field label="סכום משוער (₪)">
            <Input {...register("exitPenaltyEstimate", { valueAsNumber: true })} type="number" dir="ltr" />
          </Field>
        )}
      </div>


      <div className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-foreground">מסלולי המשכנתא הקיימת</h3>
            <p className="text-xs text-muted-foreground mt-1">
              אם יש לכם דוח יתרות, העתיקו את המסלולים ממנו. המידע הזה מאפשר לנו לנתח מחזור אמיתי ולא רק את הממוצע של כל המשכנתא.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ trackType: "prime", principalBalance: 0, interestRate: 0, isIndexed: "no", remainingYears: 0, exitPenalty: 0 })}
          >
            <Plus size={15} /> הוסף מסלול
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground text-center">
            עדיין לא הוזנו מסלולים. אפשר להוסיף ידנית עכשיו, או להעלות דוח יתרות בשלב המסמכים והמערכת תחלץ אותם.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border p-3 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <Field label="מסלול" className="col-span-2 md:col-span-2">
                  <select {...register(`tracks.${index}.trackType`)} className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm">
                    <option value="prime">פריים</option>
                    <option value="fixed_nl">קבועה לא צמודה</option>
                    <option value="fixed_l">קבועה צמודה</option>
                    <option value="variable_nl">משתנה לא צמודה</option>
                    <option value="variable_l">משתנה צמודה</option>
                    <option value="eligibility">זכאות</option>
                    <option value="other">אחר</option>
                  </select>
                </Field>
                <Field label="יתרה (₪)">
                  <Input {...register(`tracks.${index}.principalBalance`, { valueAsNumber: true })} type="number" dir="ltr" />
                </Field>
                <Field label="ריבית (%)">
                  <Input {...register(`tracks.${index}.interestRate`, { valueAsNumber: true })} type="number" step="0.01" dir="ltr" />
                </Field>
                <Field label="שנים">
                  <Input {...register(`tracks.${index}.remainingYears`, { valueAsNumber: true })} type="number" step="0.5" dir="ltr" />
                </Field>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="צמוד למדד?">
                      <select {...register(`tracks.${index}.isIndexed`)} className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm">
                        <option value="no">לא</option>
                        <option value="yes">כן</option>
                      </select>
                    </Field>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label="הסר מסלול" onClick={() => remove(index)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                <Field label="עמלת יציאה משוערת (₪)" className="col-span-2 md:col-span-2">
                  <Input {...register(`tracks.${index}.exitPenalty`, { valueAsNumber: true })} type="number" dir="ltr" />
                </Field>
                <Field label="תחנת יציאה / שינוי" className="col-span-2 md:col-span-2">
                  <Input {...register(`tracks.${index}.exitDate`)} type="date" dir="ltr" />
                </Field>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "שמור והמשך ←"}</Button>
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
