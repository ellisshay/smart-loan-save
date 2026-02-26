import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refiPropertySchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type RefiPropertyData = z.infer<typeof refiPropertySchema>;

interface Props {
  defaultValues: Partial<RefiPropertyData>;
  onNext: (data: RefiPropertyData) => void;
  onBack: () => void;
  saving: boolean;
  totalBalance: number;
}

export default function StepRefiProperty({ defaultValues, onNext, onBack, saving, totalBalance }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RefiPropertyData>({
    resolver: zodResolver(refiPropertySchema),
    defaultValues: defaultValues as any,
  });

  const estimatedValue = watch("estimatedValue") || 0;
  const isInvestment = watch("isInvestment");
  const ltv = estimatedValue > 0 ? Math.round((totalBalance / estimatedValue) * 100) : 0;

  return (
    <motion.form onSubmit={handleSubmit(onNext)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">נתוני נכס נוכחי</h2>
        <p className="text-sm text-muted-foreground">פרטי הנכס שעליו רשומה המשכנתא</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="שווי נכס משוער (₪) *" error={errors.estimatedValue?.message}>
          <Input {...register("estimatedValue", { valueAsNumber: true })} type="number" dir="ltr" />
        </Field>
        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-3 flex-1">
            <span className="text-xs text-muted-foreground block">LTV נוכחי</span>
            <span className={`font-display text-2xl font-black ${ltv > 75 ? "text-destructive" : "text-foreground"}`}>
              {ltv}%
            </span>
          </div>
        </div>
        <Field label="שמאות עדכנית?">
          <select {...register("hasRecentAppraisal")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        <Field label="עיר הנכס *" error={errors.propertyCity?.message}>
          <Input {...register("propertyCity")} placeholder="תל אביב" />
        </Field>
        <Field label="כתובת">
          <Input {...register("propertyAddress")} placeholder="רחוב ומספר" />
        </Field>
        <Field label="נכס להשקעה?">
          <select {...register("isInvestment")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
        {isInvestment === "yes" && (
          <Field label="הכנסה משכירות (₪)">
            <Input {...register("rentalIncome", { valueAsNumber: true })} type="number" dir="ltr" />
          </Field>
        )}
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
