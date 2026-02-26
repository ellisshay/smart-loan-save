import { useDashboardCase } from "@/hooks/useDashboardCase";
import StepIncome from "@/components/intake/StepIncome";
import { Loader2 } from "lucide-react";

export default function DashboardIncome() {
  const { intakeData, loading, saving, saveStepAndNavigate } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const hasBorrower2 = intakeData.personal?.borrowerCount === "2";

  return (
    <StepIncome
      defaultValues={intakeData.income || {}}
      onNext={(data) => saveStepAndNavigate("income", data, "/dashboard/liabilities")}
      onBack={() => window.history.back()}
      saving={saving}
      hasBorrower2={hasBorrower2}
    />
  );
}
