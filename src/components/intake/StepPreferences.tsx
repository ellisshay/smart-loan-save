import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preferencesSchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type PreferencesData = z.infer<typeof preferencesSchema>;

interface Props {
  defaultValues: Partial<PreferencesData>;
  onNext: (data: PreferencesData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepPreferences({ defaultValues, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { stabilityPriority: 3, ...defaultValues } as any,
  });

  const stability = watch("stabilityPriority") || 3;

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">העדפות תמהיל</h2>
        <p className="text-sm text-muted-foreground">מה חשוב לך בתמהיל המשכנתא?</p>
      </div>

      <div className="space-y-6">
        {/* Stability Priority Slider */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">
            עדיפות יציבות: <span className="text-gold font-bold">{stability}/5</span>
          </Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue("stabilityPriority", v)}
                className={`flex-1 h-12 rounded-lg font-bold transition-all ${
                  v <= stability
                    ? "bg-gold-gradient text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>גמיש</span>
            <span>מאוד יציב</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="נכונות לחשיפה לפריים *" error={errors.primeExposure?.message}>
            <select {...register("primeExposure")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
          </Field>
          <Field label="נכונות לחשיפה למדד *" error={errors.indexExposure?.message}>
            <select {...register("indexExposure")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
          </Field>
          <Field label="אופק אחזקה בנכס *" error={errors.holdingHorizon?.message}>
            <select {...register("holdingHorizon")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="under_5">פחות מ-5 שנים</option>
              <option value="5_to_10">5-10 שנים</option>
              <option value="over_10">10+ שנים</option>
              <option value="unknown">לא יודע/ת</option>
            </select>
          </Field>
          <Field label="צפויה מכירה מוקדמת? *" error={errors.expectEarlySale?.message}>
            <select {...register("expectEarlySale")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
          </Field>
          <Field label="חשוב קנס יציאה נמוך? *" error={errors.lowExitPenaltyImportant?.message}>
            <select {...register("lowExitPenaltyImportant")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
          </Field>
        </div>
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
