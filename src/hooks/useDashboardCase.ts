import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useDashboardCase() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseType, setCaseType] = useState<"new" | "refi">("new");
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("cases")
        .select("id, case_type, intake_data, current_step")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCaseId(data.id);
        setCaseType(data.case_type as "new" | "refi");
        setIntakeData((data.intake_data as Record<string, any>) || {});
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

      // Fire webhook
      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "intake_updated", case_id: caseId, payload: { step: stepKey } },
      });
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }, [caseId, intakeData]);

  const saveStepAndNavigate = useCallback(async (stepKey: string, stepData: any, nextPath: string) => {
    await saveStep(stepKey, stepData);
    toast({ title: "נשמר בהצלחה ✓" });
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
    loading,
    saving,
    saveStep,
    saveStepAndNavigate,
    autoSave,
  };
}
