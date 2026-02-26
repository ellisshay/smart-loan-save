import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import StepLiabilities from "@/components/intake/StepLiabilities";
import { Loader2 } from "lucide-react";

export default function DashboardLiabilities() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalIncome = Number(intakeData.income?.monthlyNetIncome || 0) +
    (intakeData.personal?.borrowerCount === "2" ? Number(intakeData.income?.b2MonthlyNetIncome || 0) : 0);

  const handleNext = async (data: any) => {
    await saveStep("liabilities", data);
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, liabilities: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    showCompletionToast(Math.round((done / keys.length) * 100), "התחייבויות");
    window.location.href = "/dashboard/mortgage";
  };

  return (
    <StepLiabilities
      defaultValues={intakeData.liabilities || {}}
      onNext={handleNext}
      onBack={() => window.history.back()}
      saving={saving}
      totalIncome={totalIncome}
    />
  );
}
