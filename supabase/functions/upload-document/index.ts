// Customer document upload. The only way a customer can add a file to the private bucket.
// - identity from the verified session token; the case must belong to the caller
// - the file type is detected from its bytes (not the browser's type or extension)
// - allow-listed types only, 10 MB maximum, PDFs with active content are rejected
// - the storage object name is generated; the original filename is kept only as metadata
// - short cache lifetime for sensitive objects
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getCallerId } from "../_shared/auth.ts";
import {
  CUSTOMER_DOC_TYPES, MAX_UPLOAD_BYTES, UPLOAD_CACHE_SECONDS, UPLOAD_ERRORS, safeDisplayName, validateUpload,
} from "../_shared/fileValidation.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // deno-lint-ignore no-explicit-any
    const uid = await getCallerId(req, admin as any);
    if (!uid) return json({ error: "Unauthorized" }, 401);

    // Reject oversized bodies before reading them when the client declares a length.
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared && declared > MAX_UPLOAD_BYTES + 64 * 1024) return json({ error: UPLOAD_ERRORS.too_large }, 413);

    const form = await req.formData().catch(() => null);
    if (!form) return json({ error: "Invalid request" }, 400);
    const caseId = String(form.get("case_id") || "");
    const docType = String(form.get("doc_type") || "");
    const label = form.get("label");
    const isRequired = form.get("is_required") === "true";
    const file = form.get("file");
    if (!UUID.test(caseId) || !(CUSTOMER_DOC_TYPES as readonly string[]).includes(docType) || !(file instanceof File)) {
      return json({ error: "Invalid request" }, 400);
    }

    // The case must belong to the caller (customers upload only to their own cases).
    const { data: c } = await admin.from("cases").select("id, user_id").eq("id", caseId).maybeSingle();
    if (!c || c.user_id !== uid) return json({ error: "Not found" }, 404);

    if (file.size > MAX_UPLOAD_BYTES) return json({ error: UPLOAD_ERRORS.too_large }, 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = validateUpload(bytes);
    if (!check.ok) return json({ error: UPLOAD_ERRORS[check.reason], reason: check.reason }, 415);

    const objectName = `${uid}/${caseId}/${docType}/${crypto.randomUUID()}.${check.type.ext}`;
    const { error: upErr } = await admin.storage.from("case-documents").upload(objectName, bytes, {
      contentType: check.type.mime,
      cacheControl: UPLOAD_CACHE_SECONDS,
      upsert: false,
    });
    if (upErr) return json({ error: "Upload failed" }, 500);

    const original = safeDisplayName(file.name);
    const displayName = typeof label === "string" && label.trim()
      ? `${safeDisplayName(label).slice(0, 60)} — ${original}` : original;
    const { data: row, error: insErr } = await admin.from("case_documents").insert({
      case_id: caseId, doc_type: docType, file_name: displayName, file_path: objectName, is_required: isRequired,
    }).select("id, doc_type, file_name, file_path").single();
    if (insErr || !row) {
      await admin.storage.from("case-documents").remove([objectName]);
      return json({ error: "Upload failed" }, 500);
    }
    // Upload audit comes from the existing trg_audit_documents trigger (doc_type only, no content).
    return json({ success: true, document: row });
  } catch (e) {
    console.error("upload-document error", e instanceof Error ? e.name : "error");
    return json({ error: "Upload failed" }, 500);
  }
});
