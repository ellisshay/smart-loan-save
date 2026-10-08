import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import StepRefiProperty from "@/components/intake/StepRefiProperty";
import StepProperty from "@/components/intake/StepProperty";
import { Loader2 } from "lucide-react";

export default function DashboardProperty() {
  const { caseId, caseType, intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const stepKey = caseType === "refi" ? "refi_property" : "property";
  const Step = caseType === "refi" ? StepRefiProperty : StepProperty;
  const handleNext = async (data: any) => {
    const ok = await saveStep(stepKey, data);
    if (!ok) return;
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, property: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "נכס ועסקה");
    window.location.href = `/dashboard/income?caseId=${caseId}`;
  };

  return (
    <Step
      defaultValues={intakeData[stepKey] || {}}
      onNext={handleNext}
      onBack={() => window.history.back()}
      saving={saving}
      totalBalance={Number(intakeData.current_mortgage?.totalBalance || 0)}
    />
  );
}
