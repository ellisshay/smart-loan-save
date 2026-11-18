import { useIntakeValidation } from "./useIntakeValidation";
import { useStepAutosave } from "./IntakeAutosave";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { declarationsSchema } from "@/types/intake";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DECLARATION_QUESTIONS } from "@/lib/declarationQuestions";

type DeclarationsData = z.infer<typeof declarationsSchema>;

interface Props {
  defaultValues: Partial<DeclarationsData>;
  onNext: (data: DeclarationsData) => void;
  onBack: () => void;
  saving: boolean;
}

const questions = DECLARATION_QUESTIONS;

export default function StepDeclarations({ defaultValues, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DeclarationsData>({
    resolver: zodResolver(declarationsSchema),
    defaultValues: defaultValues as any,
  });
  useStepAutosave("declarations", watch);
  const confirmed = watch("confirmTruthful");

  const { formRef, onInvalid, validationAlert } = useIntakeValidation(errors);

  return (
    <motion.form ref={formRef} noValidate onSubmit={handleSubmit(onNext, onInvalid)} className="space-y-6 [&_[aria-invalid=true]]:border-destructive [&_[aria-invalid=true]]:ring-2 [&_[aria-invalid=true]]:ring-destructive/30" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {validationAlert}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">הצהרות בנקאיות</h2>
        <p className="text-sm text-muted-foreground">המטרה היא לזהות מראש דברים שעלולים לעכב את הבנק, לא לפסול אתכם אוטומטית.</p>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.key} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium">{q.label}</p>
            {q.hint && <p className="text-xs text-muted-foreground mt-1 mb-3">{q.hint}</p>}
            {!q.hint && <div className="mb-3" />}
            <select {...register(q.key)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
            {errors[q.key] && <p className="text-xs text-destructive mt-1">{String(errors[q.key]?.message || "")}</p>}
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 cursor-pointer">
        <Checkbox data-validation-name="confirmTruthful" checked={confirmed === true} onCheckedChange={(v) => setValue("confirmTruthful", (v === true ? true : undefined) as any, { shouldValidate: true })} className="mt-0.5" />
        <span className="text-sm leading-relaxed">אני מאשר/ת שהמידע שמסרתי נכון ומלא לפי ידיעתי, ושידוע לי שמידע חסר או לא מדויק עלול להשפיע על בדיקת הבנק.</span>
      </label>
      {errors.confirmTruthful && <p className="text-xs text-destructive">{errors.confirmTruthful.message}</p>}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "שמור והמשך ←"}</Button>
      </div>
    </motion.form>
  );
}
