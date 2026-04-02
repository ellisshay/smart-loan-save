import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINANCIAL_SCORE_PROMPT = `אתה מנתח פיננסי המחשב זכאות למשכנתא בישראל.
קיבלת את הפרופיל הבא. החזר JSON בלבד – ללא טקסט נוסף.

פרטי הלקוח:
{client_profile_json}

נתוני מסמכים שנותחו:
{documents_analysis_json}

ריביות שוק נוכחיות:
- פריים: {prime_rate}%
- קבועה לא צמודה: {fixed_not_linked_rate}%
- קבועה צמודה: {fixed_linked_rate}%
- משתנה כל 5: {variable_5_rate}%

החזר את ה-JSON הבא:
{
  "score": number (0-100),
  "score_breakdown": {
    "income_stability": number (0-25),
    "ltv_ratio": number (0-20),
    "dti_ratio": number (0-25),
    "credit_history": number (0-15),
    "equity_quality": number (0-15)
  },
  "ltv": number (loan_to_value %),
  "dti": number (debt_to_income %),
  "max_loan_amount": number,
  "recommended_monthly_payment": number,
  "strengths": [string, string, string],
  "risks": [string],
  "recommended_mix": [
    {
      "track": string,
      "percentage": number,
      "rate": number,
      "monthly_payment": number,
      "reason": string
    }
  ],
  "alternative_mixes": [
    {
      "name": string,
      "description": string,
      "for_who": string,
      "total_cost": number
    }
  ],
  "summary_for_advisor": string,
  "red_flags": [string],
  "recommended_banks": [string]
}

חישובים:
- LTV = (מחיר נכס - הון עצמי) / מחיר נכס × 100
- DTI = (החזר חודשי מוצע + הלוואות קיימות) / הכנסה חודשית × 100
- בנקים בישראל מאשרים עד LTV 75% (דירה ראשונה), 50% (השקעה)
- DTI מקסימלי מומלץ: 35-40%
- Score: 90-100 מצוין, 70-89 טוב, 50-69 בינוני, מתחת ל-50 בעייתי`;

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

    // 1. Gather all data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    const { data: docs } = await supabase
      .from("case_documents")
      .select("doc_type, file_name, ai_extracted_data")
      .eq("case_id", case_id)
      .not("ai_extracted_data", "is", null);

    const { data: tracks } = await supabase
      .from("case_tracks")
      .select("*")
      .eq("case_id", case_id);

    // Get current market rates
    const { data: rates } = await supabase
      .from("market_rates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    // 2. Build prompt with real data
    const clientProfile = {
      name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
      email: profile?.email,
      phone: profile?.phone,
      case_type: caseData?.case_type,
      goal: caseData?.goal,
      intake_data: caseData?.intake_data,
      existing_tracks: tracks,
    };

    const documentsAnalysis = docs?.map((d: any) => ({
      type: d.doc_type,
      data: d.ai_extracted_data,
    }));

    const prompt = FINANCIAL_SCORE_PROMPT
      .replace("{client_profile_json}", JSON.stringify(clientProfile, null, 2))
      .replace("{documents_analysis_json}", JSON.stringify(documentsAnalysis, null, 2))
      .replace("{prime_rate}", String(rates?.prime || 4.6))
      .replace("{fixed_not_linked_rate}", String(rates?.fixed_not_linked || 5.1))
      .replace("{fixed_linked_rate}", String(rates?.fixed_linked || 4.2))
      .replace("{variable_5_rate}", String(rates?.variable_5 || 4.8));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
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

    // 3. Save to cases.ai_analysis
    const { error: updateError } = await supabase
      .from("cases")
      .update({ ai_analysis: analysis })
      .eq("id", case_id);

    if (updateError) console.error("DB update error:", updateError);

    // 4. Trigger webhook notification
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
            summary: analysis?.summary_for_advisor,
            recommended_banks: analysis?.recommended_banks,
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
