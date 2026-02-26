import { useDashboardCase } from "@/hooks/useDashboardCase";
import StepProperty from "@/components/intake/StepProperty";
import { Loader2 } from "lucide-react";

export default function DashboardProperty() {
  const { intakeData, loading, saving, saveStepAndNavigate } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <StepProperty
      defaultValues={intakeData.property || {}}
      onNext={(data) => saveStepAndNavigate("property", data, "/dashboard/income")}
      onBack={() => window.history.back()}
      saving={saving}
    />
  );
}
