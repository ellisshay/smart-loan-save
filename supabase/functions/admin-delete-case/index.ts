// Admin-only case deletion that does not leave storage files behind.
// Default is a dry run that returns an inventory. Deletion is refused while any record exists
// that may need legal/business retention (payment, signed consent, consent records, tender,
// payment events, legal hold) until an approved retention policy defines what may be removed.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getCallerId, isAdminUser } from "../_shared/auth.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
async function listAll(admin: any, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    const { data } = await admin.storage.from("case-documents").list(dir, { limit: 1000 });
    for (const e of data ?? []) {
      const path = `${dir}/${e.name}`;
      if (e.id === null) await walk(path); else out.push(path);
    }
  };
  await walk(prefix.replace(/\/$/, ""));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // deno-lint-ignore no-explicit-any
    const uid = await getCallerId(req, admin as any);
    // deno-lint-ignore no-explicit-any
    if (!uid || !(await isAdminUser(admin as any, uid))) return json({ error: "Forbidden" }, 403);

    const { case_id, confirm } = await req.json().catch(() => ({}));
    if (typeof case_id !== "string" || !UUID.test(case_id)) return json({ error: "case_id required" }, 400);

    const { data: inv, error } = await admin.rpc("case_deletion_inventory", { _case_id: case_id });
    if (error || !inv) return json({ error: "Case not found" }, 404);
    const files = (await Promise.all((inv.storage_prefixes as string[]).map((p) => listAll(admin, p)))).flat();
    const retention = inv.retention_flags ?? {};
    const blocked = Object.keys(retention).length > 0;

    if (confirm !== true || blocked) {
      return json({ dry_run: true, deletable: !blocked, retention_flags: retention, documents: inv.documents, storage_files: files.length });
    }

    for (let i = 0; i < files.length; i += 100) {
      const { error: rmErr } = await admin.storage.from("case-documents").remove(files.slice(i, i + 100));
      if (rmErr) return json({ error: "Storage cleanup failed; case not deleted" }, 500);
    }
    const { error: delErr } = await admin.from("cases").delete().eq("id", case_id);
    if (delErr) return json({ error: "Delete failed" }, 500);
    await admin.from("audit_log").insert({
      user_id: uid, case_id, action: "admin_delete_case", object_type: "case", object_id: case_id,
      metadata: { storage_files: files.length, documents: inv.documents },
    });
    return json({ deleted: true, storage_files: files.length });
  } catch (e) {
    console.error("admin-delete-case error", e instanceof Error ? e.name : "error");
    return json({ error: "Request failed" }, 500);
  }
});
