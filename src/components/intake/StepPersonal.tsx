import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalSchema } from "@/types/intake";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

type PersonalData = z.infer<typeof personalSchema>;

interface Props {
  defaultValues: Partial<PersonalData>;
  onNext: (data: PersonalData) => void;
  saving: boolean;
}

export default function StepPersonal({ defaultValues, onNext, saving }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
    defaultValues: defaultValues as any,
  });

  const borrowerCount = watch("borrowerCount");

  return (
    <motion.form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">פרטי לקוח וזיהוי</h2>
        <p className="text-sm text-muted-foreground">מלא את הפרטים האישיים שלך</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="שם פרטי *" error={errors.firstName?.message}>
          <Input {...register("firstName")} placeholder="דני" />
        </Field>
        <Field label="שם משפחה *" error={errors.lastName?.message}>
          <Input {...register("lastName")} placeholder="כהן" />
        </Field>
        <Field label="תעודת זהות *" error={errors.idNumber?.message}>
          <Input {...register("idNumber")} placeholder="123456789" dir="ltr" maxLength={9} />
        </Field>
        <Field label="טלפון *" error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="0501234567" dir="ltr" maxLength={10} />
        </Field>
        <Field label="אימייל *" error={errors.email?.message} className="sm:col-span-2">
          <Input {...register("email")} type="email" placeholder="example@email.com" dir="ltr" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="מצב משפחתי *" error={errors.maritalStatus?.message}>
          <select {...register("maritalStatus")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="single">יחיד/ה</option>
            <option value="married">נשוי/אה</option>
            <option value="common_law">ידועים בציבור</option>
            <option value="divorced">גרוש/ה</option>
            <option value="widowed">אלמן/ה</option>
          </select>
        </Field>
        <Field label="מספר לווים *" error={errors.borrowerCount?.message}>
          <select {...register("borrowerCount")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </Field>
        <Field label="האם יש ערבים? *" error={errors.hasGuarantor?.message}>
          <select {...register("hasGuarantor")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="yes">כן</option>
            <option value="no">לא</option>
          </select>
        </Field>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
        <Field label="כתובת מגורים" error={errors.address?.message}>
          <Input {...register("address")} placeholder="רחוב ומספר" />
        </Field>
        <Field label="עיר" error={errors.city?.message}>
          <Input {...register("city")} placeholder="תל אביב" />
        </Field>
        <Field label="תאריך לידה" error={errors.birthDate?.message}>
          <Input {...register("birthDate")} type="date" dir="ltr" />
        </Field>
        <Field label="אזרחות נוספת?" error={errors.additionalCitizenship?.message}>
          <select {...register("additionalCitizenship")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
      </div>

      {/* Borrower 2 */}
      {borrowerCount === "2" && (
        <motion.div
          className="space-y-4 pt-4 border-t-2 border-gold/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <h3 className="font-display font-bold text-foreground">פרטי לווה 2</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="שם פרטי">
              <Input {...register("borrower2FirstName")} placeholder="מיכל" />
            </Field>
            <Field label="שם משפחה">
              <Input {...register("borrower2LastName")} placeholder="כהן" />
            </Field>
            <Field label="ת.ז.">
              <Input {...register("borrower2IdNumber")} placeholder="987654321" dir="ltr" maxLength={9} />
            </Field>
            <Field label="טלפון">
              <Input {...register("borrower2Phone")} placeholder="0521234567" dir="ltr" maxLength={10} />
            </Field>
          </div>
        </motion.div>
      )}

      <div className="flex justify-start pt-4">
        <Button type="submit" variant="cta" size="lg" disabled={saving}>
          {saving ? "שומר..." : "שמור והמשך →"}
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
