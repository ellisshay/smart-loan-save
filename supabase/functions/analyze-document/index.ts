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

    const { user_id, document_url, document_type } = await req.json();

    if (!user_id || !document_url || !document_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, document_url, document_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("case-documents")
      .download(document_url);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: "Failed to download document", details: downloadError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    // Determine mime type
    const ext = document_url.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    // 3. Send to AI for analysis
    const systemPrompt = `You are a financial analyst specializing in Israeli financial documents. Analyze the provided document (${document_type}) and extract financial data. Return ONLY valid JSON with no additional text:
{
  "income_net": number or null (monthly net income in ILS),
  "employer": string or null,
  "employment_type": "שכיר" or "עצמאי" or null,
  "employment_years": number or null,
  "avg_monthly_balance": number or null,
  "fixed_expenses": number or null,
  "confidence": number between 0 and 1
}
If you cannot extract a field, use null.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Use vision for images, text description for PDFs
    if (mimeType.startsWith("image/")) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Analyze this Israeli ${document_type} document and extract financial data.` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this Israeli ${document_type} document (base64 encoded, mime: ${mimeType}). Extract financial data. Document base64: ${base64.substring(0, 5000)}...`,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
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

    // Parse JSON from AI response
    let extractedData: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      extractedData = { raw_response: content, confidence: 0 };
    }

    // 4. Save result to case_documents.ai_extracted_data
    const { error: updateError } = await supabase
      .from("case_documents")
      .update({ ai_extracted_data: extractedData })
      .eq("file_path", document_url);

    if (updateError) {
      console.error("DB update error:", updateError);
    }

    // 5. Check if all required docs are analyzed, then trigger score generation
    // Find the case for this user's document
    const { data: docRecord } = await supabase
      .from("case_documents")
      .select("case_id")
      .eq("file_path", document_url)
      .single();

    if (docRecord?.case_id) {
      const { data: allDocs } = await supabase
        .from("case_documents")
        .select("ai_extracted_data")
        .eq("case_id", docRecord.case_id)
        .eq("is_required", true);

      const analyzedCount = allDocs?.filter((d: any) => d.ai_extracted_data !== null).length || 0;
      const totalRequired = allDocs?.length || 0;

      if (analyzedCount >= totalRequired && totalRequired >= 1) {
        // Trigger financial score generation
        try {
          await fetch(`${supabaseUrl}/functions/v1/generate-financial-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ user_id, case_id: docRecord.case_id }),
          });
        } catch (triggerErr) {
          console.error("Failed to trigger score generation:", triggerErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, extracted_data: extractedData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-document error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
