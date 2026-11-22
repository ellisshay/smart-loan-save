import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { CaseType } from "@/types/intake";

export function useIntakeForm(caseType: CaseType, existingCaseId?: string | null) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const intakeRef = useRef(intakeData); intakeRef.current = intakeData;

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
          if (prefill.personal?.borrower1) merged.personal.borrower1 = { ...prefill.personal.borrower1, ...(cur.personal?.borrower1 || {}) };
          setIntakeData(merged);
          if (Object.keys(prefill).length) {
            await supabase.rpc("update_case_safe", { _case_id: existing.id, _intake_data: merged });
            localStorage.removeItem("easymort_quiz"); localStorage.removeItem("easymort_quick_check"); localStorage.removeItem("easymort_balance_check");
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
            localStorage.removeItem("easymort_quiz"); localStorage.removeItem("easymort_quick_check"); localStorage.removeItem("easymort_balance_check");
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
  const savePatch = useCallback(async (patch: Record<string, any>, step?: number) => {
    if (!caseId) return false;
    setSaving(true);
    const updatedData = { ...intakeRef.current, ...patch };
    intakeRef.current = updatedData;
    setIntakeData(updatedData);
    try {
      const { error } = await supabase.rpc("update_case_safe", {
        _case_id: caseId,
        _intake_data: updatedData,
        _current_step: step ?? currentStep,
      });
      if (error) throw error;
      if ("personal" in patch) {
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

  const saveDraft = useCallback(
    (stepKey: string, stepData: any, step?: number) => savePatch({ [stepKey]: stepData }, step),
    [savePatch]
  );


  // Silent save while typing: no emails/webhooks, never moves the step or completes the case.
  const autosaveStep = useCallback(async (stepKey: string, stepData: any) => {
    if (!caseId) return;
    const updated = { ...intakeRef.current, [stepKey]: stepData };
    intakeRef.current = updated;
    setIntakeData(updated);
    const { error } = await supabase.rpc("update_case_safe", { _case_id: caseId, _intake_data: updated });
    if (error) console.error("Autosave failed:", error);
  }, [caseId]);

  // Navigate steps
  const goToStep = (step: number) => setCurrentStep(step);
  
  const nextStep = async (stepKey: string, stepData: any) => {
    const next = currentStep + 1;
    const ok = await saveDraft(stepKey, stepData, next);
    if (!ok) return;

    // Keep refinance tracks in a normalized table as well as intake_data.
    // This powers analytics, bank-tender comparisons and future learning from actual outcomes.
    if (stepKey === "current_mortgage" && caseId && Array.isArray(stepData?.tracks)) {
      try {
        await supabase.from("case_tracks").delete().eq("case_id", caseId);
        const rows = stepData.tracks
          .filter((t: any) => Number(t.principalBalance) > 0)
          .map((t: any) => ({
            case_id: caseId,
            track_type: t.trackType,
            principal_balance: Number(t.principalBalance) || 0,
            interest_rate: Number(t.interestRate) || 0,
            remaining_years: Number(t.remainingYears) || 0,
            is_indexed: t.isIndexed === "yes",
            exit_date: t.exitDate || null,
            exit_penalty: Number(t.exitPenalty) || 0,
          }));
        if (rows.length) {
          const { error: tracksError } = await supabase.from("case_tracks").insert(rows);
          if (tracksError) throw tracksError;
        }
      } catch (tracksError) {
        console.error("Could not sync refinance tracks:", tracksError);
        toast({
          title: "פרטי המשכנתא נשמרו",
          description: "חלק מנתוני המסלולים ייבדקו שוב מהדוח שתעלה בהמשך.",
        });
      }
    }

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
      supabase.functions.invoke("generate-financial-score", { body: { case_id: caseId } }).catch(console.error);
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
    savePatch,
    autosaveStep,

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
/** Prefill for a new case from the quick check / quiz, plus a saved balance check (#52), if any. */
export function quizToIntake(): ReturnType<typeof quizAnswersToIntake> {
  const out = quizAnswersToIntake();
  let bc: { id?: unknown; analysis_id?: unknown; report_status?: unknown; goal?: unknown; tracks?: unknown; saved_at?: unknown } | null = null;
  try { bc = JSON.parse(localStorage.getItem("easymort_balance_check") || "null"); } catch { /* ignore */ }
  if (bc && typeof bc.id === "string" && Array.isArray(bc.tracks) && bc.tracks.length) {
    out.balance_check = { id: bc.id, analysis_id: typeof bc.analysis_id === "string" ? bc.analysis_id : null, report_status: typeof bc.report_status === "string" ? bc.report_status : null, goal: typeof bc.goal === "string" ? bc.goal.slice(0, 20) : null, tracks: bc.tracks.slice(0, 12), saved_at: typeof bc.saved_at === "string" ? bc.saved_at : null };
    const cm = balanceTracksToCurrentMortgage(bc.tracks.slice(0, 12));
    if (cm) out.current_mortgage = cm;
  }
  return out;
}

// Balance check track type -> intake track type. "unknown" is not guessed: the user picks it in the intake.
const BALANCE_TO_INTAKE_TRACK: Record<string, string> = { prime: "prime", fixed_nl: "fixed_nl", fixed_l: "fixed_l", var5: "variable_nl", var_l: "variable_l" };
const LINKED_INTAKE_TRACKS = new Set(["fixed_l", "variable_l"]);

/**
 * Prefill the intake "current mortgage" step from the tracks the user already entered in the balance check (#52),
 * so they are not typed twice. Only known values are filled; a missing value stays empty, never 0.
 * The total balance is filled only when every track's balance is known. The monthly payment and the bank are not
 * collected by the balance check, so they stay for the user to fill.
 */
export function balanceTracksToCurrentMortgage(tracks: unknown[]): Record<string, any> | null {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);
  const rows = tracks
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => {
      const trackType = typeof t.type === "string" ? BALANCE_TO_INTAKE_TRACK[t.type] : undefined;
      return {
        trackType: trackType ?? "",
        principalBalance: num(t.balance),
        interestRate: num(t.rate),
        isIndexed: trackType ? (LINKED_INTAKE_TRACKS.has(trackType) ? "yes" : "no") : undefined,
        remainingYears: num(t.years),
      };
    })
    .filter((r) => r.trackType || r.principalBalance !== undefined || r.interestRate !== undefined || r.remainingYears !== undefined);
  if (!rows.length) return null;
  const balances = rows.map((r) => r.principalBalance);
  const years = rows.map((r) => r.remainingYears).filter((y): y is number => y !== undefined);
  const out: Record<string, any> = { tracks: rows.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined))) };
  if (balances.every((b) => b !== undefined)) out.totalBalance = balances.reduce((s, b) => s + (b as number), 0);
  if (years.length) out.remainingYears = Math.max(...years);
  return out;
}

function quizAnswersToIntake(): Record<string, any> {
  const clean = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  let qc: any = null;
  try { qc = JSON.parse(localStorage.getItem("easymort_quick_check") || "null"); } catch { /* ignore */ }
  if (qc?.answers) {
    const a = qc.answers; const refi = a.goal === "refi";
    const out: Record<string, any> = {};
    const b1 = clean({ firstName: a.firstName, phone: typeof a.phone === "string" ? a.phone.replace(/[\s()-]/g, "").replace(/^\+972/, "0") : undefined, email: a.email });
    const personal = clean({ borrowerCount: a.borrowers === "1" ? "1" : a.borrowers ? "2" : undefined });
    if (Object.keys(b1).length) personal.borrower1 = b1;
    if (Object.keys(personal).length) out.personal = personal;
    if (!refi) {
      const property = clean({ propertyCity: a.city, purchasePrice: a.value || undefined, ownEquity: a.equity || undefined,
        requestedMortgage: a.value && a.equity ? a.value - a.equity : undefined });
      if (Object.keys(property).length) out.property = property;
    }
    // The quick check asks for the household's estimated income. With one borrower it is that borrower's
    // income; with two it must not land in borrower 1's field, where borrower 2's income would be added to it.
    const income = clean({ monthlyNetIncome: a.borrowers === "1" ? a.income || undefined : undefined });
    if (Object.keys(income).length) out.income = income;
    // A target payment from the quick check prefills the same question in the liabilities step (asked once).
    if (typeof a.targetPayment === "number" && a.targetPayment > 0) out.liabilities = { maxDesiredPayment: a.targetPayment };
    out.quick_check = { answers: a, ltv: qc.ltv ?? null, dti: qc.dti ?? null, mixes: qc.mixes || [], saved_at: new Date().toISOString() };
    return out;
  }
  let q: any;
  try { q = JSON.parse(localStorage.getItem("easymort_quiz") || "null"); } catch { return {}; }
  if (!q) return {};
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
