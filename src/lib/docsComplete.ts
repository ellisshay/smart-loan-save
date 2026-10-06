import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { isDocSettled } from "@/lib/docValidation";

interface MissingDocsOptions {
  /** Use true only for UI progress where "אשלח מאוחר יותר" may count as acknowledged. */
  deferredCountsAsComplete?: boolean;
}

/**
 * Returns the number of required documents that are not actually usable yet.
 * For operational readiness / SLA use deferredCountsAsComplete=false, because a promise
 * to send a document later is not a complete mortgage file.
 */
export async function countMissingDocs(
  caseId: string,
  caseType: "new" | "refi",
  options: MissingDocsOptions = {},
): Promise<number> {
  const { deferredCountsAsComplete = true } = options;
  const [{ data: docs }, { data: caseRow }] = await Promise.all([
    supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", caseId),
    supabase.from("cases").select("intake_data").eq("id", caseId).single(),
  ]);

  const settled = (docs || [])
    .filter((d) => isDocSettled(d.ai_extracted_data))
    .map((d) => d.doc_type);

  const deferred: string[] = deferredCountsAsComplete
    ? (((caseRow?.intake_data as any)?.deferred_docs ?? []) as string[])
    : [];

  const required = (caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required);
  return required.filter((d) => !settled.includes(d.type) && !deferred.includes(d.type)).length;
}
