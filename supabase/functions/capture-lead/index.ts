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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { name, phone, email, quiz_answers, property_price, monthly_income, purpose, score } = body;

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone format (basic)
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate name length
    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create anonymous user via Supabase Auth
    const tempPassword = crypto.randomUUID();
    const tempEmail = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}@easymort.temp`;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || "" },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // 2. Update profile with phone
    await supabase
      .from("profiles")
      .update({ phone: cleanPhone, email: email || null })
      .eq("user_id", userId);

    // 3. Create a case
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .insert({
        user_id: userId,
        case_type: purpose === "refi" ? "refi" : "new",
        goal: purpose,
        intake_data: {
          quiz_answers,
          property_price,
          monthly_income,
          purpose,
          quick_score: score,
        },
      })
      .select("id")
      .single();

    if (caseError) {
      console.error("Case error:", caseError);
    }

    // 4. Create lead
    const equityMap: Record<string, string> = {
      "0-100k": "עד ₪100,000",
      "100k-300k": "₪100K–₪300K",
      "300k-700k": "₪300K–₪700K",
      "700k+": "₪700K+",
    };

    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        client_id: userId,
        case_id: caseData?.id || null,
        property_price_range: property_price ? `₪${property_price.toLocaleString()}` : null,
        income_range: monthly_income ? `₪${monthly_income.toLocaleString()}` : null,
        equity_range: equityMap[quiz_answers?.equity] || null,
        purpose: purpose || null,
        status: "open",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead error:", leadError);
    }

    // 5. Send WhatsApp notification via Make webhook
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (makeWebhookUrl) {
      try {
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "new_lead_captured",
            timestamp: new Date().toISOString(),
            lead_id: leadData?.id,
            name,
            phone: cleanPhone,
            email,
            score,
            property_price,
            monthly_income,
            purpose,
          }),
        });
      } catch (webhookErr) {
        console.error("Webhook error:", webhookErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadData?.id,
        case_id: caseData?.id,
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("capture-lead error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
