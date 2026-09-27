import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { isDocSettled } from "@/lib/docValidation";

/** Returns number of required documents still missing.
 *  A document counts once it is verified, flagged only for professional review,
 *  or explicitly deferred by the client ("אשלח במועד אחר"). */
export async function countMissingDocs(caseId: string, caseType: "new" | "refi"): Promise<number> {
  const [{ data: docs }, { data: caseRow }] = await Promise.all([
    supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", caseId),
    supabase.from("cases").select("intake_data").eq("id", caseId).single(),
  ]);
  const settled = (docs || [])
    .filter((d) => isDocSettled(d.ai_extracted_data))
    .map((d) => d.doc_type);
  const deferred: string[] = ((caseRow?.intake_data as any)?.deferred_docs ?? []) as string[];
  const required = (caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required);
  return required.filter((d) => !settled.includes(d.type) && !deferred.includes(d.type)).length;
}
