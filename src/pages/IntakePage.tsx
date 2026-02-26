import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIntakeForm } from "@/hooks/useIntakeForm";
import {
  NEW_CASE_STEPS, REFI_CASE_STEPS, SERVICE_GOALS,
  REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI,
  type CaseType, type CaseTypeSelection,
} from "@/types/intake";
import IntakeProgressBar from "@/components/intake/IntakeProgressBar";
import StepPersonal from "@/components/intake/StepPersonal";
import StepProperty from "@/components/intake/StepProperty";
import StepIncome from "@/components/intake/StepIncome";
import StepLiabilities from "@/components/intake/StepLiabilities";
import StepPreferences from "@/components/intake/StepPreferences";
import StepDocuments from "@/components/intake/StepDocuments";
import StepConsent from "@/components/intake/StepConsent";
import StepSummary from "@/components/intake/StepSummary";
import StepRefiGoal from "@/components/intake/StepRefiGoal";
import StepCurrentMortgage from "@/components/intake/StepCurrentMortgage";
import StepRefiProperty from "@/components/intake/StepRefiProperty";
import StepRefiPreferences from "@/components/intake/StepRefiPreferences";
import { Home, RefreshCw, TrendingUp, Save } from "lucide-react";

export default function IntakePage() {
  const navigate = useNavigate();
  const [, setUser] = useState<any>(null);
  const [caseTypeSelection, setCaseTypeSelection] = useState<CaseTypeSelection | null>(null);
  const [goal, setGoal] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  // Derive DB case type and pre-set increase flag
  const caseType: CaseType | null = caseTypeSelection === "new" ? "new" : caseTypeSelection ? "refi" : null;
  const presetIncrease = caseTypeSelection === "refi_plus";

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
      else setUser(user);
    });
  }, [navigate]);

  // Case type selection screen
  if (!caseType) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-3xl font-black text-foreground mb-2">פתיחת תיק חדש</h1>
            <p className="text-muted-foreground">בחר את סוג השירות המבוקש</p>
          </motion.div>

          {/* Case Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <TypeCard
              icon={Home}
              title="משכנתא חדשה"
              subtitle="רכישת נכס חדש"
              selected={caseTypeSelection === "new"}
              onClick={() => setCaseTypeSelection("new")}
            />
            <TypeCard
              icon={RefreshCw}
              title="מיחזור"
              subtitle="משכנתא קיימת"
              selected={caseTypeSelection === "refi"}
              onClick={() => setCaseTypeSelection("refi")}
            />
            <TypeCard
              icon={TrendingUp}
              title="מיחזור + הגדלה"
              subtitle="מיחזור עם סכום נוסף"
              selected={caseTypeSelection === "refi_plus"}
              onClick={() => setCaseTypeSelection("refi_plus")}
            />
          </div>

          {/* Goal */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-foreground mb-4">מטרת השירות *</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-xl border text-sm text-right transition-all ${
                    goal === g.value
                      ? "bg-gold/10 border-gold/40 text-foreground font-semibold"
                      : "bg-card border-border text-muted-foreground hover:border-gold/20"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <IntakeFormFlow
      caseType={caseType}
      goal={goal}
      uploadedDocs={uploadedDocs}
      setUploadedDocs={setUploadedDocs}
      presetIncrease={presetIncrease}
    />
  );
}

function IntakeFormFlow({
  caseType,
  goal,
  uploadedDocs,
  setUploadedDocs,
  presetIncrease,
}: {
  caseType: CaseType;
  goal: string;
  uploadedDocs: any[];
  setUploadedDocs: (docs: any[]) => void;
  presetIncrease: boolean;
}) {
  const navigate = useNavigate();
  const { caseId, currentStep, intakeData, loading, saving, goToStep, nextStep, prevStep, submitCase } =
    useIntakeForm(caseType);

  const steps = caseType === "new" ? NEW_CASE_STEPS : REFI_CASE_STEPS;
  const docs = caseType === "new" ? REQUIRED_DOCS_NEW : REQUIRED_DOCS_REFI;

  const hasBorrower2 = intakeData.personal?.borrowerCount === "2";
  const totalIncome =
    (intakeData.income?.monthlyNetIncome || 0) +
    (hasBorrower2 ? (intakeData.income?.b2MonthlyNetIncome || 0) : 0) +
    (intakeData.income?.hasAdditionalIncome === "yes" ? (
      (intakeData.income?.rentalIncome || 0) +
      (intakeData.income?.benefitsIncome || 0) +
      (intakeData.income?.alimonyIncome || 0) +
      (intakeData.income?.investmentIncome || 0) +
      (intakeData.income?.otherIncome || 0)
    ) : 0);
  const totalBalance = intakeData.current_mortgage?.totalBalance || 0;

  // Pre-set increase flag for refi_plus
  useEffect(() => {
    if (presetIncrease && caseType === "refi" && intakeData.refi_goal && !intakeData.refi_goal.wantsIncrease) {
      // Will be set when user reaches refi_goal step
    }
  }, [presetIncrease, caseType, intakeData]);

  const handleSubmit = async () => {
    await submitCase(goal);
    navigate("/intake/success");
  };

  const renderStep = () => {
    const stepKey = steps[currentStep]?.key;
    const defaults = intakeData[stepKey] || {};

    if (caseType === "new") {
      switch (stepKey) {
        case "personal": return <StepPersonal defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} saving={saving} />;
        case "property": return <StepProperty defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} />;
        case "income": return <StepIncome defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} hasBorrower2={hasBorrower2} />;
        case "liabilities": return <StepLiabilities defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} totalIncome={totalIncome} />;
        case "preferences": return <StepPreferences defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} />;
        case "documents": return <StepDocuments docs={docs} caseId={caseId} uploadedDocs={uploadedDocs} onUploaded={(d) => setUploadedDocs([...uploadedDocs, d])} onNext={() => nextStep(stepKey, { completed: true })} onBack={prevStep} />;
        case "consent": return <StepConsent onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} />;
        case "summary": return <StepSummary steps={steps} intakeData={intakeData} onEdit={goToStep} onSubmit={handleSubmit} loading={loading} />;
        // New steps (equity, mortgage_request, declarations) - pass through for now
        default: return <PlaceholderStep stepKey={stepKey} onNext={() => nextStep(stepKey, { completed: true })} onBack={prevStep} />;
      }
    } else {
      switch (stepKey) {
        case "personal": return <StepPersonal defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} saving={saving} />;
        case "refi_goal": {
          const refiDefaults = presetIncrease ? { ...defaults, wantsIncrease: defaults.wantsIncrease || "yes" } : defaults;
          return <StepRefiGoal defaultValues={refiDefaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} />;
        }
        case "current_mortgage": return <StepCurrentMortgage defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} />;
        case "refi_property": return <StepRefiProperty defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} totalBalance={totalBalance} />;
        case "income": return <StepIncome defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} hasBorrower2={hasBorrower2} />;
        case "liabilities": return <StepLiabilities defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} totalIncome={totalIncome} />;
        case "refi_preferences": return <StepRefiPreferences defaultValues={defaults} onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} saving={saving} />;
        case "documents": return <StepDocuments docs={docs} caseId={caseId} uploadedDocs={uploadedDocs} onUploaded={(d) => setUploadedDocs([...uploadedDocs, d])} onNext={() => nextStep(stepKey, { completed: true })} onBack={prevStep} />;
        case "consent": return <StepConsent onNext={(d) => nextStep(stepKey, d)} onBack={prevStep} />;
        case "summary": return <StepSummary steps={steps} intakeData={intakeData} onEdit={goToStep} onSubmit={handleSubmit} loading={loading} />;
        default: return <PlaceholderStep stepKey={stepKey} onNext={() => nextStep(stepKey, { completed: true })} onBack={prevStep} />;
      }
    }
  };

  if (loading && !caseId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען תיק...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        {saving && (
          <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-card px-3 py-2 rounded-lg shadow-lg border border-border text-xs text-muted-foreground">
            <Save size={12} className="animate-spin" />
            שומר טיוטה...
          </div>
        )}

        <IntakeProgressBar steps={steps} currentStep={currentStep} onStepClick={goToStep} />

        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Placeholder for steps not yet built
function PlaceholderStep({ stepKey, onNext, onBack }: { stepKey: string; onNext: () => void; onBack: () => void }) {
  return (
    <motion.div className="space-y-6 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-xl font-bold text-foreground">שלב: {stepKey}</h2>
      <p className="text-muted-foreground">שלב זה ייבנה בהמשך</p>
      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg border border-border text-sm">← חזרה</button>
        <button onClick={onNext} className="px-4 py-2 rounded-lg bg-gold-gradient text-accent-foreground text-sm font-bold">המשך →</button>
      </div>
    </motion.div>
  );
}

function TypeCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 text-right transition-all ${
        selected
          ? "bg-gold/10 border-gold shadow-gold"
          : "bg-card border-border hover:border-gold/30"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={28} className={selected ? "text-gold" : "text-muted-foreground"} />
      <h3 className="font-display text-lg font-bold text-foreground mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.button>
  );
}
