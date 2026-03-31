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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { offer_id, lead_id, bank_name, interest_rate, monthly_payment, track_type, loan_period } = await req.json();

    if (!lead_id) {
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

    const clientName = profile.first_name || "לקוח/ה יקר/ה";

    const htmlBody = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a2e;">יש לך הצעה חדשה מ-EasyMorte! 💰</h2>
        <p>שלום ${clientName},</p>
        <p>התקבלה הצעת משכנתא חדשה עבורך:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8f9fa;border-radius:8px;">
          <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">בנק</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;">${bank_name || ""}</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">ריבית</td><td style="padding:12px;border-bottom:1px solid #eee;">${interest_rate || ""}%</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">מסלול</td><td style="padding:12px;border-bottom:1px solid #eee;">${trackLabels[track_type] || track_type || ""}</td></tr>
          <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">החזר חודשי</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;">₪${monthly_payment || ""}</td></tr>
          <tr><td style="padding:12px;color:#666;">תקופה</td><td style="padding:12px;">${loan_period || "—"} שנים</td></tr>
        </table>
        <a href="https://smart-loan-save.lovable.app/dashboard/offers" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">צפה בהצעות →</a>
      </div>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "EasyMorte <noreply@smart-loan-save.lovable.app>",
        to: [profile.email],
        subject: "יש לך הצעה חדשה מ-EasyMorte!",
        html: htmlBody,
      }),
    });

    const resendResult = await resendResponse.json();
    console.log("Resend response:", resendResponse.status, resendResult);

    return new Response(
      JSON.stringify({ success: true, resend_status: resendResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-client-offer error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
