import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

type PropertyData = z.infer<typeof propertySchema>;

interface Props {
  defaultValues: Partial<PropertyData>;
  onNext: (data: PropertyData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepProperty({ defaultValues, onNext, onBack, saving }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertyData>({
    resolver: zodResolver(propertySchema),
    defaultValues: defaultValues as any,
  });

  const purchasePrice = watch("purchasePrice") || 0;
  const ownEquity = watch("ownEquity") || 0;
  const requestedMortgage = watch("requestedMortgage") || (purchasePrice - ownEquity);
  const ltv = purchasePrice > 0 ? Math.round((requestedMortgage / purchasePrice) * 100) : 0;
  const transactionType = watch("transactionType");

  return (
    <motion.form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">נכס ועסקה</h2>
        <p className="text-sm text-muted-foreground">פרטי הנכס ותנאי העסקה</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="סוג עסקה *" error={errors.transactionType?.message} className="sm:col-span-2">
          <select {...register("transactionType")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="second_hand">דירה יד שנייה</option>
            <option value="new_build">דירה מקבלן</option>
            <option value="land_build">קרקע + בנייה</option>
          </select>
        </Field>

        <Field label="עיר הנכס *" error={errors.propertyCity?.message}>
          <Input {...register("propertyCity")} placeholder="תל אביב" />
        </Field>
        <Field label="כתובת הנכס">
          <Input {...register("propertyAddress")} placeholder="רחוב ומספר" />
        </Field>

        <Field label="מחיר/שווי רכישה (₪) *" error={errors.purchasePrice?.message}>
          <Input {...register("purchasePrice", { valueAsNumber: true })} type="number" placeholder="1,500,000" dir="ltr" />
        </Field>
        <Field label="הון עצמי זמין (₪) *" error={errors.ownEquity?.message}>
          <Input {...register("ownEquity", { valueAsNumber: true })} type="number" placeholder="500,000" dir="ltr" />
        </Field>

        <Field label="סכום משכנתא מבוקש (₪) *" error={errors.requestedMortgage?.message}>
          <Input {...register("requestedMortgage", { valueAsNumber: true })} type="number" placeholder={String(purchasePrice - ownEquity)} dir="ltr" />
        </Field>

        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-3 flex-1">
            <span className="text-xs text-muted-foreground block">אחוז מימון (LTV)</span>
            <span className={`font-display text-2xl font-black ${ltv > 75 ? "text-destructive" : "text-foreground"}`}>
              {ltv}%
            </span>
          </div>
        </div>
      </div>

      {ltv > 75 && (
        <motion.div
          className="flex items-start gap-3 bg-destructive/10 text-destructive rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>אחוז מימון גבוה!</strong>
            <p>ייתכן קושי באישור, נדרשת בדיקת היתכנות מיוחדת.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="חוזה חתום?">
          <select {...register("hasSignedContract")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="yes">כן</option>
            <option value="no">לא</option>
          </select>
        </Field>
        <Field label="תאריך חתימה צפוי">
          <Input {...register("signingDate")} type="date" dir="ltr" />
        </Field>
        <Field label="משכנתא קיימת על נכס אחר?">
          <select {...register("hasExistingMortgage")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="yes">כן</option>
            <option value="no">לא</option>
          </select>
        </Field>
        {transactionType === "new_build" && (
          <Field label="מועד מסירה (חודש/שנה)">
            <Input {...register("deliveryDate")} type="month" dir="ltr" />
          </Field>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>
          {saving ? "שומר..." : "המשך ותן לנו לבנות תמהיל →"}
        </Button>
      </div>
    </motion.form>
  );
}

function Field({ label, error, children, className }: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-foreground mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
