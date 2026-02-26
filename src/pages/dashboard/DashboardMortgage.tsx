import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mortgageRequestSchema } from "@/types/intake";
import { z } from "zod";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type MortgageData = z.infer<typeof mortgageRequestSchema>;

export default function DashboardMortgage() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleSubmit = async (data: MortgageData) => {
    await saveStep("mortgage_request", data);
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, mortgage_request: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "משכנתא מבוקשת");
    window.location.href = "/dashboard/declarations";
  };

  return <MortgageForm defaults={intakeData.mortgage_request || {}} saving={saving} onSubmit={handleSubmit} />;
}

function MortgageForm({ defaults, saving, onSubmit }: { defaults: Partial<MortgageData>; saving: boolean; onSubmit: (d: MortgageData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MortgageData>({
    resolver: zodResolver(mortgageRequestSchema),
    defaultValues: defaults as any,
  });

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">משכנתא מבוקשת</h2>
        <p className="text-sm text-muted-foreground">סכום, תקופה ויעדים</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="סכום משכנתא מבוקש (₪) *" error={errors.requestedAmount?.message}>
          <Input {...register("requestedAmount", { valueAsNumber: true })} type="number" dir="ltr" placeholder="1,000,000" />
        </Field>
        <Field label="החזר חודשי רצוי (₪)">
          <Input {...register("desiredPayment", { valueAsNumber: true })} type="number" dir="ltr" placeholder="5,000" />
        </Field>
        <Field label="החזר חודשי מקסימלי (₪)">
          <Input {...register("maxPayment", { valueAsNumber: true })} type="number" dir="ltr" placeholder="7,000" />
        </Field>
        <Field label="תקופה רצויה (שנים)">
          <Input {...register("desiredYears", { valueAsNumber: true })} type="number" dir="ltr" min={4} max={30} placeholder="25" />
        </Field>
        <Field label="יעד מרכזי">
          <select {...register("goal")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="lower_payment">הורדת החזר חודשי</option>
            <option value="total_savings">חיסכון בעלות כוללת</option>
            <option value="stability">יציבות</option>
            <option value="combined">שילוב</option>
          </select>
        </Field>
        <Field label="רמת סיכון מועדפת">
          <select {...register("riskLevel")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="low">נמוכה – שמרנית</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה – אגרסיבית</option>
          </select>
        </Field>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={() => window.history.back()}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "כמעט שם! המשך להצהרות →"}</Button>
      </div>
    </motion.form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
