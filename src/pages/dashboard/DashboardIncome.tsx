import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import StepIncome from "@/components/intake/StepIncome";
import { Loader2 } from "lucide-react";

export default function DashboardIncome() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const hasBorrower2 = intakeData.personal?.borrowerCount === "2";

  const handleNext = async (data: any) => {
    await saveStep("income", data);
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, income: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "הכנסות");
    window.location.href = "/dashboard/liabilities";
  };

  return (
    <StepIncome
      defaultValues={intakeData.income || {}}
      onNext={handleNext}
      onBack={() => window.history.back()}
      saving={saving}
      hasBorrower2={hasBorrower2}
    />
  );
}
