import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCallerId, canAccessCase } from "../_shared/auth.ts";
import { makeIntakePayload } from "../_shared/aiPayload.ts";
import { SITE_URL } from "../_shared/gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (!makeWebhookUrl) {
      return new Response(
        JSON.stringify({ error: "MAKE_WEBHOOK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const callerId = await getCallerId(req, supabase as any);
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { case_id } = await req.json().catch(() => ({}));
    if (!(await canAccessCase(supabase as any, callerId, case_id))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!case_id) {
      return new Response(
        JSON.stringify({ error: "Missing case_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only the fields needed for an internal alert. No intake data, names or contact details
    // leave EasyMorte for Make.com; staff open the case in the admin via the link.
    const { data: caseData, error: caseErr } = await supabase
      .from("cases")
      .select("id, case_number, case_type, status")
      .eq("id", case_id)
      .single();

    if (caseErr || !caseData) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = makeIntakePayload(caseData, SITE_URL);

    // POST to Make.com webhook
    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`Make.com webhook response: ${response.status}`);

    return new Response(
      JSON.stringify({ success: true, make_status: response.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Error type only: a failed fetch message contains the webhook URL, which acts as a secret.
    console.error("notify-on-intake-complete error:", error instanceof Error ? error.name : "error");
    return new Response(
      JSON.stringify({ error: "Request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
