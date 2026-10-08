import { createContext, createElement, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isDocSettled } from "@/lib/docValidation";
import type { CaseStatus } from "@/types/admin";

function useDashboardCaseState() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedCaseId = params.get("caseId");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseType, setCaseType] = useState<"new" | "refi">("new");
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [status, setStatus] = useState<CaseStatus>("Draft");
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settledDocTypes, setSettledDocTypes] = useState<string[]>([]);
  const refreshDocuments = useCallback(async (id: string) => {
    const { data } = await supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", id);
    if (data) setSettledDocTypes(data.filter(d => isDocSettled(d.ai_extracted_data)).map(d => d.doc_type));
  }, []);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      setLoading(true);
      let query = supabase
        .from("cases")
        .select("id, case_type, intake_data, current_step, intake_complete, status, payment_succeeded")
        .eq("user_id", user.id);
      if (requestedCaseId) query = query.eq("id", requestedCaseId);
      const { data } = await query.order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCaseId(data.id);
        refreshDocuments(data.id);
        setCaseType(data.case_type as "new" | "refi");
        setIntakeData((data.intake_data as Record<string, any>) || {});
        setIntakeComplete(!!data.intake_complete);
        setStatus(data.status);
        setPaymentSucceeded(data.payment_succeeded);
      } else {
        toast({ title: "אין תיק פעיל", description: "פתח תיק חדש כדי להתחיל", variant: "destructive" });
        navigate("/intake");
      }
      setLoading(false);
    };
    load();
  }, [navigate, requestedCaseId]);

  const saveStep = useCallback(async (stepKey: string, stepData: any) => {
    if (!caseId) return false;
    setSaving(true);
    try {
      const updated = { ...intakeData, [stepKey]: stepData };
      const { error } = await supabase.rpc("update_case_safe", { _case_id: caseId, _intake_data: updated });
      if (error) throw error;
      setIntakeData(updated);
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
          if (status === "Draft") setStatus("WaitingForPayment");
          supabase.functions.invoke("case-email", { body: { case_id: caseId, event: "intake_complete" } }).catch(console.error);
          supabase.functions.invoke("generate-financial-score", { body: { case_id: caseId } }).catch(console.error);
        }
      }

      // Fire webhook
      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "intake_updated", case_id: caseId, payload: { step: stepKey } },
      });
      return true;
    } catch (e) {
      console.error("Save error:", e);
      toast({ title: "השמירה נכשלה", description: "הנתונים לא נשמרו. נסה שוב לפני מעבר לשלב הבא.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [caseId, caseType, intakeData, intakeComplete, status]);

  const saveStepAndNavigate = useCallback(async (stepKey: string, stepData: any, nextPath: string) => {
    const ok = await saveStep(stepKey, stepData);
    if (!ok) return;
    toast({ title: "נשמר בהצלחה " });
    navigate(`${nextPath}?caseId=${caseId}`);
  }, [saveStep, navigate, caseId]);

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
    status,
    paymentSucceeded,
    loading,
    saving,
    saveStep,
    saveStepAndNavigate,
    autoSave,
    settledDocTypes,
    refreshDocuments,
  };
}

const DashboardCaseContext = createContext<ReturnType<typeof useDashboardCaseState> | null>(null);

export function DashboardCaseProvider({ children }: { children: ReactNode }) {
  const value = useDashboardCaseState();
  return createElement(DashboardCaseContext.Provider, { value }, children);
}

export function useDashboardCase() {
  const value = useContext(DashboardCaseContext);
  if (!value) throw new Error("Dashboard pages must use DashboardCaseProvider");
  return value;
}
