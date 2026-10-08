import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useDashboardCase() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseType, setCaseType] = useState<"new" | "refi">("new");
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("cases")
        .select("id, case_type, intake_data, current_step, intake_complete")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCaseId(data.id);
        setCaseType(data.case_type as "new" | "refi");
        setIntakeData((data.intake_data as Record<string, any>) || {});
        setIntakeComplete(!!data.intake_complete);
      } else {
        toast({ title: "אין תיק פעיל", description: "פתח תיק חדש כדי להתחיל", variant: "destructive" });
        navigate("/intake");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const saveStep = useCallback(async (stepKey: string, stepData: any) => {
    if (!caseId) return;
    setSaving(true);
    try {
      const updated = { ...intakeData, [stepKey]: stepData };
      setIntakeData(updated);
      await supabase.rpc("update_case_safe", { _case_id: caseId, _intake_data: updated });
      if (stepKey === "personal") {
        supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "case_opened" } }).catch(console.error);
      }
      const requiredKeys = caseType === "refi"
        ? ["personal", "refi_goal", "current_mortgage", "refi_property", "income", "liabilities", "refi_preferences", "declarations", "consent"]
        : ["personal", "property", "equity", "income", "liabilities", "mortgage_request", "preferences", "declarations", "consent"];
      // Documents are deliberately NOT part of intake completion. A customer may pay first
      // and return with documents later; operational SLA readiness is tracked separately.
      if (!intakeComplete && requiredKeys.every((k) => updated[k] && Object.keys(updated[k]).length > 0)) {
        const { error: subErr } = await supabase.rpc("submit_case_safe" as any, { _case_id: caseId });
        if (!subErr) {
          setIntakeComplete(true);
          supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "intake_complete" } }).catch(console.error);
          supabase.functions.invoke("generate-financial-score", { body: { case_id: caseId } }).catch(console.error);
        }
      }

      // Fire webhook
      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "intake_updated", case_id: caseId, payload: { step: stepKey } },
      });
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }, [caseId, caseType, intakeData, intakeComplete]);

  const saveStepAndNavigate = useCallback(async (stepKey: string, stepData: any, nextPath: string) => {
    await saveStep(stepKey, stepData);
    toast({ title: "נשמר בהצלחה " });
    navigate(nextPath);
  }, [saveStep, navigate]);

  // Auto-save with debounce
  const autoSave = useCallback((stepKey: string, stepData: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveStep(stepKey, stepData);
    }, 2000);
  }, [saveStep]);

  return {
    caseId,
    caseType,
    intakeData,
    intakeComplete,
    loading,
    saving,
    saveStep,
    saveStepAndNavigate,
    autoSave,
  };
}
