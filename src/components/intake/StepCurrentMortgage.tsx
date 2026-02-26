import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { currentMortgageSchema, ISRAELI_BANKS } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type MortgageData = z.infer<typeof currentMortgageSchema>;

interface Props {
  defaultValues: Partial<MortgageData>;
  onNext: (data: MortgageData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepCurrentMortgage({ defaultValues, onNext, onBack, saving }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MortgageData>({
    resolver: zodResolver(currentMortgageSchema),
    defaultValues: defaultValues as any,
  });

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
