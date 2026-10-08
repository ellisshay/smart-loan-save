import { useDashboardCase } from "@/hooks/useDashboardCase";
import { showCompletionToast } from "@/lib/completionToast";
import StepPersonal from "@/components/intake/StepPersonal";
import { Loader2 } from "lucide-react";
import type { PersonalData } from "@/types/intake";

export default function DashboardPersonal() {
  const { caseId, caseType, intakeData, loading, saving, saveStep } = useDashboardCase();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const handleNext = async (data: PersonalData) => {
    const ok = await saveStep("personal", data);
    if (!ok) return;
    const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
    const updated = { ...intakeData, personal: data };
    const done = keys.filter(k => updated[k] && Object.keys(updated[k]).length > 0).length;
    const progress = Math.round((done / keys.length) * 100);
    showCompletionToast(progress, "פרטים אישיים");
    window.location.href = `/dashboard/property?caseId=${caseId}`;
  };

  return (
    <StepPersonal
      defaultValues={(intakeData.personal || {}) as Partial<PersonalData>}
      onNext={handleNext}
      saving={saving}
    />
  );
}
