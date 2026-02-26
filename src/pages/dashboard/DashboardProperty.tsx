import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import StepProperty from "@/components/intake/StepProperty";
import { Loader2 } from "lucide-react";

export default function DashboardProperty() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleNext = async (data: any) => {
    await saveStep("property", data);
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, property: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "נכס ועסקה");
    window.location.href = "/dashboard/income";
  };

  return (
    <StepProperty
      defaultValues={intakeData.property || {}}
      onNext={handleNext}
      onBack={() => window.history.back()}
      saving={saving}
    />
  );
}
