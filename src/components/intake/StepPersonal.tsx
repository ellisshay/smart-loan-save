import { useIntakeValidation } from "./useIntakeValidation";
import { useStepAutosave } from "./IntakeAutosave";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalSchema, type PersonalData } from "@/types/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  defaultValues: Partial<PersonalData>;
  onNext: (data: PersonalData) => void;
  saving: boolean;
  /** False when staff edit someone else's case — never prefill from the signed-in account. */
  prefillFromAccount?: boolean;
}

export default function StepPersonal({ defaultValues, onNext, saving, prefillFromAccount = true }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PersonalData>({
    resolver: zodResolver(personalSchema),
    defaultValues: defaultValues as any,
  });
  useStepAutosave("personal", watch);

  // Prefill main contact (borrower1 only) from account/profile; never overwrite what is already filled.
  useEffect(() => {
    if (!prefillFromAccount) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("first_name,last_name,phone,email").eq("user_id", user.id).maybeSingle();
      const fill: Record<string, string | null | undefined> = {
        firstName: p?.first_name, lastName: p?.last_name, phone: p?.phone?.replace(/[\s-]/g, ""), email: p?.email || user.email,
      };
      for (const [k, v] of Object.entries(fill)) {
        const path = `borrower1.${k}` as any;
        if (v && !getValues(path)) setValue(path, v);
      }
    })().catch(console.error);
  }, [getValues, setValue, prefillFromAccount]);

  const borrowerCount = watch("borrowerCount");
  const b1Divorced = watch("borrower1.isDivorced");
  const b1MaritalStatus = watch("borrower1.maritalStatus");
  const b2Divorced = watch("borrower2.isDivorced");
  const b2MaritalStatus = watch("borrower2.maritalStatus");

  const showB1Alimony = b1Divorced === "yes" || b1MaritalStatus === "divorced";
  const showB2Alimony = b2Divorced === "yes" || b2MaritalStatus === "divorced";
  const showB1Prenup = b1MaritalStatus === "married" || b1MaritalStatus === "common_law";
  const showB2Prenup = b2MaritalStatus === "married" || b2MaritalStatus === "common_law";

  const { formRef, onInvalid, validationAlert } = useIntakeValidation(errors);

  return (
    <motion.form ref={formRef} noValidate
      onSubmit={handleSubmit(onNext, onInvalid)}
      className="space-y-6 [&_[aria-invalid=true]]:border-destructive [&_[aria-invalid=true]]:ring-2 [&_[aria-invalid=true]]:ring-destructive/30"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {validationAlert}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">פרטי לווים</h2>
        <p className="text-sm text-muted-foreground">מלא את הפרטים האישיים של כל הלווים</p>
      </div>

      {/* Borrower count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* ── Borrower 1 ── */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-display font-bold text-foreground text-lg">לווה 1 · איש הקשר הראשי</h3>
        <p className="text-xs text-muted-foreground -mt-2">המייל והטלפון כאן משמשים להתחברות, עדכוני התיק, אישורי תשלום ומסמכים. פרטים שכבר מסרת מולאו מראש וניתנים לעריכה.</p>
        <BorrowerFields prefix="borrower1" register={register} errors={errors.borrower1 || {}} watch={watch}
          showAlimony={showB1Alimony} showPrenup={showB1Prenup} />
      </div>

      {/* ── Borrower 2 ── */}
      {borrowerCount === "2" && (
        <motion.div
          className="space-y-4 pt-4 border-t-2 border-gold/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <h3 className="font-display font-bold text-foreground text-lg">לווה 2</h3>
          <BorrowerFields prefix="borrower2" register={register} errors={errors.borrower2 || {}} watch={watch}
            showAlimony={showB2Alimony} showPrenup={showB2Prenup} />
        </motion.div>
      )}

      <div className="flex justify-start pt-4">
        <Button type="submit" variant="cta" size="lg" disabled={saving}>
          {saving ? "שומר..." : "עוד דקה ואתה מסיים ←"}
        </Button>
      </div>
    </motion.form>
  );
}

function BorrowerFields({
  prefix,
  register,
  errors,
  watch,
  showAlimony,
  showPrenup,
}: {
  prefix: "borrower1" | "borrower2";
  register: any;
  errors: any;
  watch: any;
  showAlimony: boolean;
  showPrenup: boolean;
}) {
  const additionalCitizenship = watch(`${prefix}.additionalCitizenship`);
  const isRequired = prefix === "borrower1";
  const star = " *";

  return (
    <div className="space-y-4">
      {/* Core identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={`שם פרטי${star}`} error={errors?.firstName?.message}>
          <Input {...register(`${prefix}.firstName`)} placeholder="דני" />
        </Field>
        <Field label={`שם משפחה${star}`} error={errors?.lastName?.message}>
          <Input {...register(`${prefix}.lastName`)} placeholder="כהן" />
        </Field>
        <Field label={`תעודת זהות${star}`} error={errors?.idNumber?.message}>
          <Input {...register(`${prefix}.idNumber`)} placeholder="123456789" dir="ltr" maxLength={9} />
        </Field>
        <Field label={`תאריך לידה${star}`} error={errors?.birthDate?.message}>
          <Input {...register(`${prefix}.birthDate`)} type="date" dir="ltr" />
        </Field>
        <Field label={`טלפון${star}`} error={errors?.phone?.message}>
          <Input {...register(`${prefix}.phone`)} placeholder="0501234567" dir="ltr" maxLength={10} />
        </Field>
        {isRequired && (
          <Field label={`אימייל איש הקשר הראשי${star}`} error={errors?.email?.message}>
            <Input {...register(`${prefix}.email`)} type="email" placeholder="example@email.com" dir="ltr" />
          </Field>
        )}
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label={`מצב משפחתי${star}`} error={errors?.maritalStatus?.message}>
          <select {...register(`${prefix}.maritalStatus`)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="single">רווק/ה</option>
            <option value="married">נשוי/אה</option>
            <option value="common_law">ידועים בציבור</option>
            <option value="divorced">גרוש/ה</option>
            <option value="widowed">אלמן/ה</option>
          </select>
        </Field>
        <Field label="מספר ילדים תלויים">
          <Input {...register(`${prefix}.dependents`, { valueAsNumber: true })} type="number" min="0" dir="ltr" placeholder="0" />
        </Field>
        <Field label="אזרחות נוספת?">
          <select {...register(`${prefix}.additionalCitizenship`)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
      </div>

      {additionalCitizenship === "yes" && (
        <Field label="פרט אזרחות נוספת">
          <Input {...register(`${prefix}.citizenshipDetails`)} placeholder="מדינה" />
        </Field>
      )}

      {/* Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="כתובת מגורים">
          <Input {...register(`${prefix}.address`)} placeholder="רחוב ומספר" />
        </Field>
        <Field label="עיר">
          <Input {...register(`${prefix}.city`)} placeholder="תל אביב" />
        </Field>
      </div>

      {/* Prenup */}
      {showPrenup && (
        <Field label="הסכם ממון?">
          <select {...register(`${prefix}.hasPrenup`)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="">בחר...</option>
            <option value="no">לא</option>
            <option value="yes">כן</option>
          </select>
        </Field>
      )}

      {/* Divorce / Alimony */}
      {showAlimony && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="האם משולמים מזונות?">
            <select {...register(`${prefix}.hasAlimony`)} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">בחר...</option>
              <option value="no">לא</option>
              <option value="yes">כן</option>
            </select>
          </Field>
          <Field label="סכום מזונות חודשי (₪)">
            <Input {...register(`${prefix}.alimonyAmount`, { valueAsNumber: true })} type="number" dir="ltr" placeholder="2,500" />
          </Field>
        </div>
      )}
    </div>
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
