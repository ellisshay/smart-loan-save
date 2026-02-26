import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { CaseType } from "@/types/intake";

export function useIntakeForm(caseType: CaseType) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create or load case
  useEffect(() => {
    const initCase = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for existing draft
        const { data: existing } = await supabase
          .from("cases")
          .select("*")
          .eq("user_id", user.id)
          .eq("case_type", caseType)
          .eq("status", "Draft")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          setCaseId(existing.id);
          setCurrentStep(existing.current_step || 0);
          setIntakeData((existing.intake_data as Record<string, any>) || {});
        } else {
          const { data: newCase, error } = await supabase
            .from("cases")
            .insert({
              user_id: user.id,
              case_type: caseType,
              status: "Draft",
            })
            .select()
            .single();

          if (error) throw error;
          setCaseId(newCase.id);
          
          // Fire webhook
          await fireWebhook("case_created", newCase.id, { case_type: caseType });
        }
      } catch (error: any) {
        console.error("Error initializing case:", error);
        toast({ title: "שגיאה", description: "לא ניתן לפתוח תיק", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    initCase();
  }, [caseType]);

  // Auto-save draft
  const saveDraft = useCallback(async (stepKey: string, stepData: any) => {
    if (!caseId) return;
    setSaving(true);
    try {
      const updatedData = { ...intakeData, [stepKey]: stepData };
      setIntakeData(updatedData);

      await supabase
        .from("cases")
        .update({
          intake_data: updatedData,
          current_step: currentStep,
        })
        .eq("id", caseId);
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSaving(false);
    }
  }, [caseId, intakeData, currentStep]);

  // Navigate steps
  const goToStep = (step: number) => setCurrentStep(step);
  
  const nextStep = async (stepKey: string, stepData: any) => {
    await saveDraft(stepKey, stepData);
    await fireWebhook("intake_step_completed", caseId!, { step: stepKey });
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  // Submit case
  const submitCase = async (goal: string) => {
    if (!caseId) return;
    setLoading(true);
    try {
      await supabase
        .from("cases")
        .update({
          intake_data: intakeData,
          intake_complete: true,
          goal,
          status: "WaitingForPayment",
        })
        .eq("id", caseId);

      await fireWebhook("case_submitted", caseId, {});
      toast({ title: "התיק הוגש בהצלחה! 🎉" });
    } catch (error) {
      console.error("Error submitting case:", error);
      toast({ title: "שגיאה בהגשה", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return {
    caseId,
    currentStep,
    intakeData,
    loading,
    saving,
    goToStep,
    nextStep,
    prevStep,
    saveDraft,
    submitCase,
  };
}

async function fireWebhook(eventName: string, caseId: string, payload: Record<string, any>) {
  try {
    await supabase.functions.invoke("webhook-handler", {
      body: { event_name: eventName, case_id: caseId, payload },
    });
  } catch (error) {
    console.error("Webhook fire error:", error);
  }
}
