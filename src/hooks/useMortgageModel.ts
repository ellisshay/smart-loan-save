import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { buildMortgageModel, type MortgageModel, type RawCaseData } from "@/lib/mortgage/model";

type Extra = Pick<RawCaseData, "caseTrackRows" | "rates" | "tender" | "documents" | "slaDueAt">;

/**
 * Read-only data for the Mortgage Command Center, always for the selected case
 * (useDashboardCase honours ?caseId=). Nothing here writes to the database.
 */
export function useMortgageModel() {
  const shared = useDashboardCase();
  const { caseId, caseType, intakeData, intakeComplete, status, paymentSucceeded, loading: caseLoading } = shared;
  const [extra, setExtra] = useState<Extra | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!caseId) { setLoading(false); return; }
    setLoading(true);
    const db = supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
    const [caseRow, tracks, rates, tender, docs] = await Promise.all([
      supabase.from("cases").select("sla_due_at").eq("id", caseId).maybeSingle(),
      caseType === "refi" ? supabase.from("case_tracks").select("*").eq("case_id", caseId) : Promise.resolve({ data: [] }),
      supabase.from("market_rates").select("prime,fixed_not_linked,fixed_linked,variable_5,cpi_annual,updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      db.rpc("get_client_tender", { _case_id: caseId }),
      supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", caseId),
    ]);
    setExtra({
      slaDueAt: (caseRow.data as { sla_due_at?: string | null } | null)?.sla_due_at ?? null,
      caseTrackRows: (tracks.data as RawCaseData["caseTrackRows"]) || [],
      rates: (rates.data as RawCaseData["rates"]) || null,
      tender: tender.data || null,
      documents: (docs.data as RawCaseData["documents"]) || [],
    });
    setLoading(false);
  }, [caseId, caseType]);

  useEffect(() => { if (!caseLoading) load(); }, [caseLoading, load]);

  const model: MortgageModel | null = useMemo(() => {
    if (!caseId || !extra) return null;
    return buildMortgageModel({ caseType, intakeData, intakeComplete, status, paymentSucceeded, ...extra });
  }, [caseId, caseType, intakeData, intakeComplete, status, paymentSucceeded, extra]);

  return { model, caseId, loading: caseLoading || loading, reload: load, shared };
}
