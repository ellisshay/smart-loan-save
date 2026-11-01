import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, getCallerId } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `אתה EasyBot – עוזר שיווקי של EasyMorte.
אתה עונה בעברית, קצר וחם.
המטרה שלך: לענות על שאלות ולהוביל את המשתמש להירשם.
בסוף כל תשובה – הצע להם להתחיל את התהליך.
אל תתן ייעוץ פיננסי ספציפי – רק מידע כללי.

מידע על EasyMorte:
- פלטפורמת משכנתאות דיגיטלית שמשלבת AI עם יועצים מורשים
- העלות: ₪197 לניתוח פיננסי מלא + המלצת תמהיל
- ההבדל מיועץ רגיל: שקיפות מלאה, AI שמנתח מסמכים, השוואת הצעות מרובות
- התהליך: נרשמים → ממלאים פרטים → מעלים מסמכים → מקבלים ניתוח AI + המלצה → יועץ מאשר ושולח לבנקים
- זמן: כ-48 שעות מרגע השלמת המסמכים
- מתאים לכל מי שקונה דירה (ראשונה, שנייה, משפרי דיור) או רוצה למחזר משכנתא

כללים:
- תשובות קצרות – מקסימום 3-4 משפטים
- סיים עם שאלה או הנחיה לפעולה
- אם שואלים שאלה פיננסית ספציפית: "שאלה מצוינת! כדי לתת לך תשובה מדויקת, צריך לנתח את הפרופיל שלך. רוצה להתחיל?"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!(await getCallerId(req, adminClient()))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
    const conversation_history = Array.isArray(body?.conversation_history) ? body.conversation_history : [];

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only user/assistant turns are accepted from the caller; system role is fixed server-side.
    const history = conversation_history.slice(-10)
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 1000) }));

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(
        JSON.stringify({ error: "Chat failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("public-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
