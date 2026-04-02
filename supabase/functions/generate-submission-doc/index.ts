import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBMISSION_DOC_PROMPT = `אתה עוזר ליועץ משכנתאות מורשה בישראל להכין בקשה למשכנתא.
צור מסמך HTML מקצועי ומסודר שיוגש לבנק.
המסמך צריך להיות ברור, מקצועי, ולכלול את כל הפרטים שהבנק צריך.

פרטי הלקוח:
{client_profile_json}

ניתוח AI:
{ai_analysis_json}

בנק יעד: {bank_name}

צור HTML מלא עם:

1. כותרת: "בקשה למשכנתא – [שם לקוח] – [תאריך]"

2. פרטי מבקש:
   - שם מלא, ת.ז., תאריך לידה
   - כתובת, טלפון, אימייל
   - מצב משפחתי

3. פרטי הנכס:
   - כתובת, מחיר, שווי שמאות (אם יש)
   - מטרת הרכישה
   - LTV מחושב

4. פרטים פיננסיים:
   - הכנסות (טבלה: מגיש 1 / מגיש 2)
   - הוצאות קבועות
   - הון עצמי + מקורות
   - DTI מחושב

5. בקשת המשכנתא:
   - סכום מבוקש
   - תמהיל מוצע (לפי המלצת AI)
   - החזר חודשי משוער
   - תקופה מבוקשת

6. הצהרת הלקוח (לחתימה)

7. המלצת יועץ (שדה ריק למילוי ידני)

סגנון: RTL, עברית, גופן Arial, צבע כחול לכותרות, טבלאות נקיות.
חשוב: החזר HTML בלבד, ללא הסברים נוספים.`;

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

    const { case_id, bank_name } = await req.json();

    if (!case_id || !bank_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: case_id, bank_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather data
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (!caseData) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", caseData.user_id)
      .single();

    const { data: docs } = await supabase
      .from("case_documents")
      .select("doc_type, ai_extracted_data")
      .eq("case_id", case_id)
      .not("ai_extracted_data", "is", null);

    const { data: tracks } = await supabase
      .from("case_tracks")
      .select("*")
      .eq("case_id", case_id);

    const clientProfile = {
      name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
      email: profile?.email,
      phone: profile?.phone,
      case_type: caseData.case_type,
      goal: caseData.goal,
      intake_data: caseData.intake_data,
      existing_tracks: tracks,
      document_extractions: docs?.map((d: any) => ({ type: d.doc_type, data: d.ai_extracted_data })),
    };

    const prompt = SUBMISSION_DOC_PROMPT
      .replace("{client_profile_json}", JSON.stringify(clientProfile, null, 2))
      .replace("{ai_analysis_json}", JSON.stringify(caseData.ai_analysis || {}, null, 2))
      .replace("{bank_name}", bank_name);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
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
        JSON.stringify({ error: "Document generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const htmlContent = aiResult.choices?.[0]?.message?.content || "";

    // Extract HTML
    const htmlMatch = htmlContent.match(/<html[\s\S]*<\/html>/i) || 
                      htmlContent.match(/<!DOCTYPE[\s\S]*/i);
    const finalHtml = htmlMatch ? htmlMatch[0] : htmlContent;

    return new Response(
      JSON.stringify({ success: true, html: finalHtml }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-submission-doc error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
