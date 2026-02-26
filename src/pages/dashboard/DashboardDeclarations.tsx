import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { declarationsSchema } from "@/types/intake";
import { z } from "zod";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

type DeclarationsData = z.infer<typeof declarationsSchema>;

export default function DashboardDeclarations() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleSubmit = async (data: DeclarationsData) => {
    await saveStep("declarations", data);
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, declarations: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "הצהרות");
    window.location.href = "/dashboard/documents";
  };

  return <DeclarationsForm defaults={intakeData.declarations || {}} saving={saving} onSubmit={handleSubmit} />;
}

function DeclarationsForm({ defaults, saving, onSubmit }: { defaults: Partial<DeclarationsData>; saving: boolean; onSubmit: (d: DeclarationsData) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DeclarationsData>({
    resolver: zodResolver(declarationsSchema),
    defaultValues: defaults as any,
  });

  const questions = [
    { key: "hasExecutionFile" as const, label: "האם נפתח נגדך תיק הוצאה לפועל?" },
    { key: "hasLegalProceedings" as const, label: "האם יש הליך משפטי תלוי ועומד?" },
    { key: "hasBankruptcy" as const, label: "האם הכרזת על חדלות פירעון?" },
    { key: "hasRestrictedAccount" as const, label: "האם יש לך חשבון מוגבל?" },
    { key: "hasBouncedChecks" as const, label: "האם יש צ'קים חוזרים ב-12 חודשים אחרונים?" },
  ];

  const confirmTruthful = watch("confirmTruthful");

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Shield size={22} className="text-gold" />
          הצהרות בנקאיות
        </h2>
        <p className="text-sm text-muted-foreground">יש להשיב בכנות – הנתונים משמשים לבדיקת התכנות</p>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
            <span className="text-sm font-medium text-foreground">{q.label}</span>
            <select
              {...register(q.key)}
              className="w-24 h-9 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="">בחר</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
          </div>
        ))}
        {errors && Object.entries(errors).filter(([k]) => k !== "confirmTruthful").map(([k, v]) => (
          <p key={k} className="text-xs text-destructive">{(v as any)?.message}</p>
        ))}
      </div>

      {/* Any "yes" warning */}
      {questions.some(q => watch(q.key) === "yes") && (
        <motion.div className="flex items-start gap-3 bg-warning/10 text-warning rounded-lg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>שים לב:</strong> תשובה חיובית לא בהכרח פוסלת אישור, אך עשויה להשפיע על תנאי המשכנתא.
          </div>
        </motion.div>
      )}

      {/* Truthfulness confirmation */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${confirmTruthful ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
        <Checkbox
          checked={confirmTruthful === true}
          onCheckedChange={(v) => setValue("confirmTruthful", v === true ? true : undefined as any, { shouldValidate: true })}
          className="mt-1"
        />
        <div>
          <span className="font-semibold text-sm text-foreground">אני מצהיר/ה שכל המידע שמסרתי הוא אמת ומלא</span>
          <p className="text-xs text-muted-foreground mt-1">מידע לא נכון עלול לגרום לפסילת הבקשה</p>
        </div>
      </div>
      {errors.confirmTruthful && <p className="text-xs text-destructive">{errors.confirmTruthful.message}</p>}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={() => window.history.back()}>← חזרה</Button>
        <Button type="submit" variant="cta" size="lg" disabled={saving}>{saving ? "שומר..." : "סיים תיק וקבל תוצאה ✓"}</Button>
      </div>
    </motion.form>
  );
}
