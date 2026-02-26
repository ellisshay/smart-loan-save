import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refiGoalSchema, REFI_REASONS } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

type RefiGoalData = z.infer<typeof refiGoalSchema>;

interface Props {
  defaultValues: Partial<RefiGoalData>;
  onNext: (data: RefiGoalData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepRefiGoal({ defaultValues, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RefiGoalData>({
    resolver: zodResolver(refiGoalSchema),
    defaultValues: { refiReasons: [], ...defaultValues } as any,
  });

  const reasons = watch("refiReasons") || [];
  const wantsIncrease = watch("wantsIncrease");

  const toggleReason = (value: string) => {
    const current = reasons;
    const updated = current.includes(value)
      ? current.filter((r) => r !== value)
      : [...current, value];
    setValue("refiReasons", updated, { shouldValidate: true });
  };

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">מטרת המיחזור</h2>
        <p className="text-sm text-muted-foreground">למה אתה רוצה למחזר?</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">בחר סיבות (ניתן לבחור מספר) *</Label>
        {errors.refiReasons && <p className="text-xs text-destructive mb-2">{errors.refiReasons.message}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REFI_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => toggleReason(r.value)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-sm text-right transition-all ${
                reasons.includes(r.value)
                  ? "bg-gold/10 border-gold/40 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-gold/20"
              }`}
            >
              <Checkbox checked={reasons.includes(r.value)} />
              <span className="font-medium">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-1.5 block">הגדלת משכנתא? *</Label>
          <select {...register("wantsIncrease")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </div>
        {wantsIncrease === "yes" && (
          <>
            <div>
              <Label className="text-sm font-medium text-foreground mb-1.5 block">סכום הגדלה (₪)</Label>
              <Input {...register("increaseAmount", { valueAsNumber: true })} type="number" dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-foreground mb-1.5 block">מטרת ההגדלה</Label>
              <Input {...register("increasePurpose")} placeholder="שיפוץ, סגירת הלוואות..." />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "שמור והמשך →"}</Button>
      </div>
    </motion.form>
  );
}
