import { supabase } from "@/integrations/supabase/client";

export interface UploadedDocumentRow { id: string; doc_type: string; file_name: string; file_path: string }

/** Client-side pre-check only for fast feedback. The server (upload-document) is the real check. */
export const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
export const MAX_UPLOAD_MB = 10;

/**
 * Uploads a case document through the upload-document Edge Function.
 * The server validates the file's bytes, size and type, generates the storage name and creates the record.
 * Throws an Error with a customer-safe Hebrew message on failure.
 */
export async function uploadCaseDocument(opts: {
  caseId: string; docType: string; file: File; isRequired?: boolean; label?: string;
}): Promise<UploadedDocumentRow> {
  if (opts.file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`הקובץ גדול מדי (עד ${MAX_UPLOAD_MB}MB)`);
  const form = new FormData();
  form.append("case_id", opts.caseId);
  form.append("doc_type", opts.docType);
  form.append("is_required", opts.isRequired ? "true" : "false");
  if (opts.label) form.append("label", opts.label);
  form.append("file", opts.file);
  const { data, error } = await supabase.functions.invoke("upload-document", { body: form });
  if (error || !data?.document) {
    // FunctionsHttpError carries the response; read the safe message the server returned.
    let msg = "ההעלאה נכשלה, נסו שוב";
    try {
      const ctx = (error as { context?: Response } | null)?.context;
      const body = ctx ? await ctx.json() : data;
      if (typeof body?.error === "string") msg = body.error;
    } catch { /* keep the generic message */ }
    throw new Error(msg);
  }
  return data.document as UploadedDocumentRow;
}

/**
 * Deletes a customer's own document. The record is deleted first; the database refuses when the
 * document was already reviewed by staff (protected evidence), in which case nothing is removed.
 * Returns false when the document is locked.
 */
export async function deleteCaseDocument(doc: { id: string; file_path: string }): Promise<boolean> {
  const { data, error } = await supabase.from("case_documents").delete().eq("id", doc.id).select("id");
  if (error || !data?.length) return false;
  await supabase.storage.from("case-documents").remove([doc.file_path]);
  return true;
}
