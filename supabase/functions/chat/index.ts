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

    // Identify the caller from their session token. Never trust a user_id from the
    // request body: this function reads profile/case data with the service role.
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const { data: authData } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };
    const user_id = authData?.user?.id;
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";
    // Only user/assistant turns from the client; a client-supplied "system" turn
    // could override the instructions above.
    type ChatTurn = { role: "user" | "assistant"; content: string };
    const rawHistory: unknown[] = Array.isArray(body?.conversation_history) ? body.conversation_history : [];
    const conversation_history: ChatTurn[] = rawHistory
      .filter((m: unknown): m is ChatTurn =>
        !!m && typeof m === "object" &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string")
      .map((m: ChatTurn) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing required field: message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather client context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Get latest case
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get market rates
    const { data: rates } = await supabase
      .from("market_rates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const aiAnalysis = (caseData as any)?.ai_analysis;
    const intakeData = (caseData as any)?.intake_data || {};

    const clientName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "לקוח";

    const systemPrompt = `אתה EasyBot – יועץ משכנתאות AI של EasyMorte.
אתה עונה בעברית בלבד, בשפה חמה, מקצועית ופשוטה.
אתה מדבר ישירות עם הלקוח כאילו אתה חבר שמבין משכנתאות.

═══════════════════════════
פרטי הלקוח שמולך:
═══════════════════════════
שם: ${clientName}
מחיר נכס: ₪${intakeData.property?.value?.toLocaleString("he-IL") || "לא צוין"}
הון עצמי: ₪${intakeData.property?.equity?.toLocaleString("he-IL") || "לא צוין"}
הכנסה חודשית נטו: ₪${intakeData.income?.monthly_income?.toLocaleString("he-IL") || "לא צוין"}
מטרה: ${caseData?.goal || intakeData.goal || "לא צוין"}
ציון פיננסי: ${aiAnalysis?.score || "בחישוב"}/100
מסלול מומלץ: ${aiAnalysis?.recommended_mix ? JSON.stringify(aiAnalysis.recommended_mix) : "בחישוב"}
סטטוס תיק: ${caseData?.status || "draft"}
DTI: ${aiAnalysis?.dti || "בחישוב"}%

═══════════════════════════
ריביות שוק נוכחיות:
═══════════════════════════
ריבית פריים: ${rates?.prime || 4.6}%
קבועה לא צמודה ממוצע: ${rates?.fixed_not_linked || 5.1}%
משתנה כל 5 שנים ממוצע: ${rates?.variable_5 || 4.8}%
מדד המחירים לצרכן (שנתי): ${rates?.cpi || 3.2}%

═══════════════════════════
מה אתה יכול לעשות:
═══════════════════════════
✓ להסביר מושגים (פריים, לא צמודה, LTV, DTI וכו')
✓ להסביר את המסלול המומלץ שחישבת עבורו
✓ לענות שאלות על תהליך המשכנתא
✓ לעדכן על סטטוס התיק שלו
✓ להנחות אותו לשלב הבא בתהליך
✓ לחשב סימולציות פשוטות

═══════════════════════════
מה אתה לא יכול לעשות:
═══════════════════════════
✗ לא נותן ייעוץ פיננסי מחייב – תמיד הפנה ליועץ לאישור סופי
✗ לא מתחייב לריביות ספציפיות – "הריביות משתנות, היועץ יאשר"
✗ לא מבטיח אישור משכנתא
✗ לא עונה על שאלות שאינן קשורות למשכנתאות

═══════════════════════════
סגנון תשובות:
═══════════════════════════
- תשובות קצרות וברורות – מקסימום 3-4 משפטים
- אם השאלה מורכבת – חלק לנקודות קצרות
- השתמש בדוגמאות עם מספרים אמיתיים מהפרופיל שלו
- סיים תמיד עם שאלה או הנחיה לפעולה
- אל תחזור על עצמך
- אם לקוח שואל שאלה שדורשת יועץ אנושי – כתוב: "שאלה מצוינת שדורשת בדיקה ספציפית – היועץ שלך יחזור אליך תוך 24 שעות."`;

    // Build messages with history
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...conversation_history.slice(-10),
      { role: "user", content: message },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(
        JSON.stringify({ error: "Chat failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      user_id,
      case_id: caseData?.id || null,
      role: "user",
      content: message,
    });

    // Stream response back
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
