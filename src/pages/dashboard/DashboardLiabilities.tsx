import { useDashboardCase } from "@/hooks/useDashboardCase";
import StepLiabilities from "@/components/intake/StepLiabilities";
import { Loader2 } from "lucide-react";

export default function DashboardLiabilities() {
  const { intakeData, loading, saving, saveStepAndNavigate } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalIncome = Number(intakeData.income?.monthlyNetIncome || 0) +
    (intakeData.personal?.borrowerCount === "2" ? Number(intakeData.income?.b2MonthlyNetIncome || 0) : 0);

  return (
    <StepLiabilities
      defaultValues={intakeData.liabilities || {}}
      onNext={(data) => saveStepAndNavigate("liabilities", data, "/dashboard/mortgage")}
      onBack={() => window.history.back()}
      saving={saving}
      totalIncome={totalIncome}
    />
  );
}
