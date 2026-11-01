import { Loader2 } from "lucide-react";
import { useMortgageModel } from "@/hooks/useMortgageModel";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";
import NextActionCard from "@/components/mortgage/NextActionCard";
import CaseProgress from "@/components/mortgage/CaseProgress";
import { Section } from "@/components/mortgage/primitives";

/** Full case progress for the selected case (?caseId=), with the next step on top. */
export default function DashboardStatus() {
  const { model, caseId, loading, shared } = useMortgageModel();
  if (loading || !model) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="טוען" /></div>;
  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl" dir="rtl">
      <h1 className="font-display text-2xl font-bold text-foreground">התקדמות התיק</h1>
      <NextActionCard next={model.next} caseId={caseId} statusLabel={CASE_STATUSES[shared.status as CaseStatus]?.label} />
      <Section title="כל השלבים" subtitle="מה הושלם, מה בתהליך ומה מחכה לכם">
        <CaseProgress steps={model.progress} />
      </Section>
    </div>
  );
}
