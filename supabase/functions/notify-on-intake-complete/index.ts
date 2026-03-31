import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { case_id } = await req.json();

    if (!case_id) {
      return new Response(
        JSON.stringify({ error: "Missing case_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full case data
    const { data: caseData, error: caseErr } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (caseErr || !caseData) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", caseData.user_id)
      .single();

    const payload = {
      event: "intake_complete",
      timestamp: new Date().toISOString(),
      case_id: caseData.id,
      case_number: caseData.case_number,
      case_type: caseData.case_type,
      status: caseData.status,
      goal: caseData.goal,
      intake_data: caseData.intake_data,
      client: {
        name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        email: profile?.email || "",
        phone: profile?.phone || "",
      },
    };

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
    console.error("notify-on-intake-complete error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
