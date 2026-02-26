import { useDashboardCase } from "@/hooks/useDashboardCase";
import StepPersonal from "@/components/intake/StepPersonal";
import { Loader2 } from "lucide-react";
import type { PersonalData } from "@/types/intake";

export default function DashboardPersonal() {
  const { intakeData, loading, saving, saveStepAndNavigate } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <StepPersonal
      defaultValues={(intakeData.personal || {}) as Partial<PersonalData>}
      onNext={(data) => saveStepAndNavigate("personal", data, "/dashboard/property")}
      saving={saving}
    />
  );
}
