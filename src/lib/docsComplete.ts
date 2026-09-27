import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";
import { isDocSettled } from "@/lib/docValidation";

/** Returns number of required documents still missing.
 *  A document counts once it is verified or flagged only for professional review. */
export async function countMissingDocs(caseId: string, caseType: "new" | "refi"): Promise<number> {
  const { data } = await supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", caseId);
  const settled = (data || [])
    .filter((d) => isDocSettled(d.ai_extracted_data))
    .map((d) => d.doc_type);
  const required = (caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required);
  return required.filter((d) => !settled.includes(d.type)).length;
}
