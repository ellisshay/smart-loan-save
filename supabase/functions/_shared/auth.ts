// Shared caller authentication / authorization helpers for edge functions.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const bearer = (req: Request) => req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";

/** Returns the signed-in user id, or null. */
export async function getCallerId(req: Request, admin: SupabaseClient): Promise<string | null> {
  const token = bearer(req);
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user?.id ?? null;
}

export async function isAdminUser(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

/** Owner, admin, or assigned advisor may access the case. */
export async function canAccessCase(admin: SupabaseClient, userId: string, caseId: string): Promise<boolean> {
  if (typeof caseId !== "string" || !/^[0-9a-f-]{36}$/i.test(caseId)) return false;
  const { data: c } = await admin.from("cases").select("user_id, assigned_advisor_id").eq("id", caseId).maybeSingle();
  if (!c) return false;
  if (c.user_id === userId || c.assigned_advisor_id === userId) return true;
  return await isAdminUser(admin, userId);
}

/** For scheduled jobs: service-role bearer, CRON_SECRET header, or an admin user. */
export async function isTrustedJobCaller(req: Request, admin: SupabaseClient): Promise<boolean> {
  const token = bearer(req);
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token && service && token === service) return true;
  const cron = Deno.env.get("CRON_SECRET");
  if (cron && req.headers.get("x-cron-secret") === cron) return true;
  const uid = await getCallerId(req, admin);
  return !!uid && (await isAdminUser(admin, uid));
}
