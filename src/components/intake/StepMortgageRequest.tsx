import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mortgageRequestSchema } from "@/types/intake";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MortgageRequestData = z.infer<typeof mortgageRequestSchema>;

interface Props {
  defaultValues: Partial<MortgageRequestData>;
  suggestedAmount?: number;
  suggestedMaxPayment?: number;
  onNext: (data: MortgageRequestData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepMortgageRequest({ defaultValues, suggestedAmount = 0, suggestedMaxPayment = 0, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<MortgageRequestData>({
    resolver: zodResolver(mortgageRequestSchema),
    defaultValues: {
      requestedAmount: defaultValues.requestedAmount ?? suggestedAmount,
      maxPayment: defaultValues.maxPayment ?? (suggestedMaxPayment || undefined),
      ...defaultValues,
    } as any,
  });

  return (
    <motion.form onSubmit={handleSubmit(onNext, () => { document.querySelector(".text-destructive")?.scrollIntoView({ behavior: "smooth", block: "center" }); toast({ title: "חסרים פרטים בשלב הזה", description: "השדות המסומנים באדום חייבים מילוי.", variant: "destructive" }); })} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">המשכנתא המבוקשת</h2>
        <p className="text-sm text-muted-foreground">נגדיר את הסכום, ההחזר והיעד לפני בניית התמהיל</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="סכום משכנתא מבוקש (₪) *" error={errors.requestedAmount?.message}>
          <Input {...register("requestedAmount", { valueAsNumber: true })} type="number" dir="ltr" />
        </Field>
        <Field label="החזר חודשי רצוי (₪)">
          <Input {...register("desiredPayment", { setValueAs: (v) => v === "" ? undefined : Number(v) })} type="number" dir="ltr" />
        </Field>
        <Field label="החזר חודשי מקסימלי (₪)">
          <Input {...register("maxPayment", { setValueAs: (v) => v === "" ? undefined : Number(v) })} type="number" dir="ltr" />
        </Field>
        <Field label="תקופה רצויה בשנים">
          <Input {...register("desiredYears", { setValueAs: (v) => v === "" ? undefined : Number(v) })} type="number" min={4} max={30} dir="ltr" />
        </Field>
        <Field label="המטרה המרכזית">
          <select {...register("goal")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="lower_payment">החזר חודשי נמוך</option>
            <option value="total_savings">חיסכון בעלות הכוללת</option>
            <option value="stability">יציבות</option>
            <option value="combined">שילוב</option>
          </select>
        </Field>
        <Field label="רמת סיכון">
          <select {...register("riskLevel")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
          </select>
        </Field>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "שמור והמשך ←"}</Button>
      </div>
    </motion.form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div>
    <Label className="text-sm font-medium text-foreground mb-1.5 block">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>;
}
