import { supabase } from "@/integrations/supabase/client";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI } from "@/types/intake";

/** Returns number of required documents still missing (only verified docs count). */
export async function countMissingDocs(caseId: string, caseType: "new" | "refi"): Promise<number> {
  const { data } = await supabase.from("case_documents").select("doc_type, ai_extracted_data").eq("case_id", caseId);
  const verified = (data || [])
    .filter((d) => (d.ai_extracted_data as any)?.overall === "verified")
    .map((d) => d.doc_type);
  const required = (caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW).filter((d) => d.required);
  return required.filter((d) => !verified.includes(d.type)).length;
}
