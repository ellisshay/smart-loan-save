import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCallerId, isAdminUser } from "../_shared/auth.ts";
import { sendEmail, wrapClient, SITE_URL, esc } from "../_shared/gmail.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const callerId = await getCallerId(req, supabase as any);
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { offer_id, lead_id } = await req.json().catch(() => ({}));

    if (!lead_id || !offer_id) {
      return new Response(
        JSON.stringify({ error: "Missing lead_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead → client_id
    const { data: lead } = await supabase
      .from("leads")
      .select("client_id")
      .eq("id", lead_id)
      .single();

    if (!lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: offer } = await supabase
      .from("offers")
      .select("advisor_id, lead_id, bank_name, interest_rate, monthly_payment, track_type, loan_period")
      .eq("id", offer_id)
      .maybeSingle();
    if (!offer || offer.lead_id !== lead_id || (offer.advisor_id !== callerId && !(await isAdminUser(supabase as any, callerId)))) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { bank_name, interest_rate, monthly_payment, track_type, loan_period } = offer;

    // Get client profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("user_id", lead.client_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "Client email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trackLabels: Record<string, string> = {
      fixed: "קבועה לא צמודה",
      prime: "פריים",
      variable_linked: "משתנה צמודה",
      fixed_linked: "קבועה צמודה",
      variable: "משתנה לא צמודה",
      mix: "שילוב מסלולים",
    };

    const clientName = esc(profile.first_name || "לקוח/ה יקר/ה");

    const htmlBody = wrapClient(`שלום ${clientName}, התקבלה הצעת משכנתא חדשה`, `
        <p>ההצעה זמינה לצפייה באזור האישי שלך:</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;background:#f2f7f6;">
          <tr><td style="padding:12px;border-bottom:1px solid #dceae7;">בנק</td><td style="padding:12px;border-bottom:1px solid #dceae7;font-weight:bold;">${esc(bank_name)}</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #dceae7;">ריבית</td><td style="padding:12px;border-bottom:1px solid #dceae7;">${esc(interest_rate)}%</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #dceae7;">מסלול</td><td style="padding:12px;border-bottom:1px solid #dceae7;">${esc(trackLabels[track_type] || track_type || "")}</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #dceae7;">החזר חודשי</td><td style="padding:12px;border-bottom:1px solid #dceae7;font-weight:bold;">₪${esc(monthly_payment)}</td></tr>
          <tr><td style="padding:12px;">תקופה</td><td style="padding:12px;">${esc(loan_period || "—")} שנים</td></tr>
        </table>`, "לצפייה בהצעות", `${SITE_URL}/dashboard/offers`);

    await sendEmail(profile.email, "יש לך הצעה חדשה מ-EasyMorte!", htmlBody);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-client-offer error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
