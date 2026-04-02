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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, case_id } = await req.json();

    if (!user_id || !case_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, case_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Read client profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Read case data
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    // Read all document AI extractions
    const { data: docs } = await supabase
      .from("case_documents")
      .select("doc_type, file_name, ai_extracted_data")
      .eq("case_id", case_id)
      .not("ai_extracted_data", "is", null);

    // Read existing case tracks (current mortgage data for refi)
    const { data: tracks } = await supabase
      .from("case_tracks")
      .select("*")
      .eq("case_id", case_id);

    // 2. Build prompt with all data
    const contextData = {
      profile: {
        name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        email: profile?.email,
        phone: profile?.phone,
      },
      case_type: caseData?.case_type,
      goal: caseData?.goal,
      intake_data: caseData?.intake_data,
      existing_tracks: tracks,
      document_extractions: docs?.map((d: any) => ({
        type: d.doc_type,
        data: d.ai_extracted_data,
      })),
    };

    const systemPrompt = `You are a senior Israeli mortgage financial analyst. Based on the client data and AI-extracted document analysis provided, calculate a comprehensive mortgage eligibility assessment. Return ONLY valid JSON:
{
  "score": number (0-100, overall eligibility score),
  "ltv": number (loan-to-value ratio as percentage),
  "dti": number (debt-to-income ratio as percentage),
  "strengths": string[] (list of financial strengths in Hebrew),
  "risks": string[] (list of financial risks in Hebrew),
  "recommended_mix": [
    {
      "track": string (track type name in Hebrew, e.g. "פריים", "קבועה לא צמודה", "משתנה כל 5"),
      "percentage": number (% of total loan),
      "rate": number (estimated interest rate),
      "reason": string (why this track, in Hebrew)
    }
  ],
  "max_loan": number (maximum recommended loan amount in ILS),
  "recommended_monthly": number (recommended monthly payment in ILS),
  "summary": string (2-3 sentence summary in Hebrew)
}
Be conservative with estimates. If data is insufficient, note it in risks.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this client's mortgage eligibility:\n${JSON.stringify(contextData, null, 2)}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed", status: aiResponse.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let analysis: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = { raw_response: content, score: 0 };
    }

    // 3. Save to cases.ai_analysis (using service role, bypasses RLS)
    const { error: updateError } = await supabase
      .from("cases")
      .update({ ai_analysis: analysis })
      .eq("id", case_id);

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    // 4. Trigger webhook to notify client
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
    if (makeWebhookUrl) {
      try {
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "financial_score_ready",
            timestamp: new Date().toISOString(),
            case_id,
            user_id,
            score: analysis?.score,
            client_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
            client_phone: profile?.phone,
            summary: analysis?.summary,
          }),
        });
      } catch (webhookErr) {
        console.error("Webhook notification failed:", webhookErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-financial-score error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
