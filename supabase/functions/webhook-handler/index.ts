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
    const webhookUrl = Deno.env.get("WEBHOOK_URL");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_name, case_id, payload } = await req.json();

    if (!event_name || !case_id) {
      return new Response(
        JSON.stringify({ error: "Missing event_name or case_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get case data for webhook payload
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    // Get profile
    const { data: profile } = caseData
      ? await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", caseData.user_id)
          .single()
      : { data: null };

    // Build webhook payload
    const intakeData = (caseData?.intake_data as Record<string, any>) || {};
    const personal = intakeData.personal || {};
    const income = intakeData.income || {};
    const liabilities = intakeData.liabilities || {};
    const property = intakeData.property || {};
    const currentMortgage = intakeData.current_mortgage || {};

    const webhookPayload = {
      event_name,
      timestamp: new Date().toISOString(),
      case_id,
      case_type: caseData?.case_type || "unknown",
      user: {
        name: `${personal.firstName || ""} ${personal.lastName || ""}`.trim(),
        phone: personal.phone || "",
        email: personal.email || profile?.email || "",
        id_last4: personal.idNumber ? personal.idNumber.slice(-4) : "",
      },
      goal: caseData?.goal || "",
      mortgage_amount: property.requestedMortgage || currentMortgage.totalBalance || 0,
      current_balance: currentMortgage.totalBalance || 0,
      monthly_payment: currentMortgage.currentMonthlyPayment || 0,
      income_total: (income.monthlyNetIncome || 0) + (income.b2MonthlyNetIncome || 0),
      liabilities_monthly: liabilities.existingLoanPayments || 0,
      ltv: property.purchasePrice
        ? Math.round(((property.requestedMortgage || 0) / property.purchasePrice) * 100)
        : 0,
      dti: 0,
      risk_level: liabilities.riskLevel || "",
      missing_docs_list: [],
      status: caseData?.status || "Draft",
      ...payload,
    };

    // Calculate DTI
    const totalIncome = webhookPayload.income_total;
    if (totalIncome > 0) {
      webhookPayload.dti = Math.round(
        ((webhookPayload.liabilities_monthly + (liabilities.maxDesiredPayment || 0)) / totalIncome) * 100
      );
    }

    // Log event to case_events
    await supabase.from("case_events").insert({
      case_id,
      event_name,
      payload: webhookPayload,
    });

    // Send to external webhook if configured
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        console.log(`Webhook sent to ${webhookUrl}: ${response.status}`);
      } catch (webhookError) {
        console.error("External webhook error:", webhookError);
      }
    } else {
      console.log("No WEBHOOK_URL configured, event logged only:", event_name);
    }

    return new Response(
      JSON.stringify({ success: true, event_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
