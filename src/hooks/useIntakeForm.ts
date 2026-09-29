import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { CaseType } from "@/types/intake";

export function useIntakeForm(caseType: CaseType, existingCaseId?: string | null) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create or load case
  useEffect(() => {
    let cancelled = false;
    const initCase = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Resume a specific case when requested, otherwise the latest draft of this type
        let existing: any = null;
        if (existingCaseId) {
          const { data } = await supabase
            .from("cases")
            .select("*")
            .eq("id", existingCaseId)
            .eq("user_id", user.id)
            .maybeSingle();
          existing = data;
        }
        if (!existing) {
          const { data } = await supabase
            .from("cases")
            .select("*")
            .eq("user_id", user.id)
            .eq("case_type", caseType)
            .eq("status", "Draft")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          existing = data;
        }

        const prefill = quizToIntake();
        if (existing) {
          if (cancelled) return;
          setCaseId(existing.id);
          setCurrentStep(existing.current_step || 0);
          const cur = (existing.intake_data as Record<string, any>) || {};
          const merged = { ...prefill, ...cur };
          for (const k of Object.keys(prefill)) merged[k] = { ...prefill[k], ...(cur[k] || {}) };
          setIntakeData(merged);
          if (Object.keys(prefill).length) {
            await supabase.rpc("update_case_safe", { _case_id: existing.id, _intake_data: merged });
            localStorage.removeItem("easymort_quiz");
          }
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
          if (cancelled) return;
          setCaseId(newCase.id);
          if (Object.keys(prefill).length) {
            setIntakeData(prefill);
            await supabase.rpc("update_case_safe", { _case_id: newCase.id, _intake_data: prefill });
            localStorage.removeItem("easymort_quiz");
          }
          
          // Fire webhook
          await fireWebhook("case_created", newCase.id, { case_type: caseType });
          supabase.functions.invoke("case-email", { body: { case_id: newCase.id, event: "case_opened" } }).catch(console.error);
        }
      } catch (error: any) {
        console.error("Error initializing case:", error);
        toast({ title: "שגיאה", description: "לא ניתן לפתוח תיק", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initCase();
    return () => { cancelled = true; };
  }, [caseType, existingCaseId]);

  // Auto-save draft (persists the step too, so the client can resume exactly where they stopped)
  const saveDraft = useCallback(async (stepKey: string, stepData: any, step?: number) => {
    if (!caseId) return false;
    setSaving(true);
    const updatedData = { ...intakeData, [stepKey]: stepData };
    setIntakeData(updatedData);
    try {
      const { error } = await supabase.rpc("update_case_safe", {
        _case_id: caseId,
        _intake_data: updatedData,
        _current_step: step ?? currentStep,
      });
      if (error) throw error;
      if (stepKey === "personal") {
        supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "case_opened" } }).catch(console.error);
      }
      return true;
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        title: "השמירה נכשלה",
        description: "בדוק את החיבור לאינטרנט ונסה שוב. הנתונים שמילאת עדיין מוצגים במסך.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [caseId, intakeData, currentStep]);

  // Navigate steps
  const goToStep = (step: number) => setCurrentStep(step);
  
  const nextStep = async (stepKey: string, stepData: any) => {
    const next = currentStep + 1;
    const ok = await saveDraft(stepKey, stepData, next);
    if (!ok) return;
    fireWebhook("intake_step_completed", caseId!, { step: stepKey }).catch(console.error);
    setCurrentStep(next);
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1));


  // Submit case
  const submitCase = async (goal: string): Promise<boolean> => {
    if (!caseId) return false;
    setLoading(true);
    try {
      await supabase.rpc("update_case_safe", { _case_id: caseId, _intake_data: intakeData });
      const { error: submitErr } = await supabase.rpc("submit_case_safe" as any, { _case_id: caseId, _goal: goal });
      if (submitErr) throw submitErr;
      supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "intake_complete" } }).catch(console.error);
      // Side notifications must never block the client
      Promise.allSettled([
        fireWebhook("case_submitted", caseId, {}),
        fireWebhook("lead_created", caseId, {
          property_area: intakeData.property?.area || intakeData.property_area || "",
          purpose: goal || caseType,
          income_range: intakeData.income?.monthly_income || intakeData.monthly_income || "",
        }),
        supabase.functions.invoke("notify-on-intake-complete", { body: { case_id: caseId } }),
      ]).catch(console.error);
      toast({ title: "התיק הוגש בהצלחה!" });
      return true;
    } catch (error: any) {
      console.error("Error submitting case:", error);
      toast({ title: "שגיאה בהגשה", description: error?.message || "נסה שוב בעוד רגע.", variant: "destructive" });
      return false;
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

// Map the homepage quick questionnaire into intake sections so the user doesn't retype it
function quizToIntake(): Record<string, any> {
  let q: any;
  try { q = JSON.parse(localStorage.getItem("easymort_quiz") || "null"); } catch { return {}; }
  if (!q) return {};
  const clean = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  const out: Record<string, any> = {};
  const personal = clean({ borrowerCount: q.co_borrower === true ? "2" : q.co_borrower === false ? "1" : undefined });
  if (Object.keys(personal).length) out.personal = personal;
  const property = clean({ propertyCity: q.property_area, purchasePrice: q.property_price, ownEquity: q.equity_amount,
    requestedMortgage: q.property_price && q.equity_amount ? q.property_price - q.equity_amount : undefined });
  if (Object.keys(property).length) out.property = property;
  const income = clean({ monthlyNetIncome: q.salary_net, b2MonthlyNetIncome: q.salary_net_2, businessField: q.business_field,
    annualIncome: q.annual_income_y1 });
  if (Object.keys(income).length) out.income = income;
  out.quiz_answers = q;
  return out;
}
