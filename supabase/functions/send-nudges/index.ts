import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Nudge schedule: type → hours after registration
const NUDGE_SCHEDULE = [
  { type: "2h", hoursAfter: 2 },
  { type: "24h", hoursAfter: 24 },
  { type: "72h", hoursAfter: 72 },
];

// Message templates (Hebrew)
const NUDGE_MESSAGES: Record<string, (name: string, score: number) => string> = {
  "2h": (name, score) =>
    `היי ${name}! הניתוח שלך מוכן 📊\nציון: ${score}/100\nרוצה שנגיש לבנקים? ₪3,500 בלבד ←\nhttps://smart-loan-save.lovable.app/results`,
  "24h": (name, score) =>
    `${name}, הציון שלך (${score}) שמור אצלנו – אבל ריביות השוק משתנות כל יום 📉\nלא כדאי לחכות.\nhttps://smart-loan-save.lovable.app/results`,
  "72h": (name, score) =>
    `${name}, הניתוח שלך עם ציון ${score} עומד לפוג 🔔\nזו ההזדמנות האחרונה לנצל את המחיר של ₪3,500.\nhttps://smart-loan-save.lovable.app/results`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_NUDGE");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find users who:
    // 1. Registered (have a profile)
    // 2. Have a case with ai_analysis or intake score
    // 3. Haven't paid (payment_succeeded = false)
    const { data: unpaidCases, error: casesError } = await supabase
      .from("cases")
      .select(`
        id,
        user_id,
        ai_analysis,
        intake_data,
        created_at,
        payment_succeeded
      `)
      .eq("payment_succeeded", false)
      .eq("intake_complete", true)
      .order("created_at", { ascending: false });

    if (casesError) {
      console.error("Error fetching cases:", casesError);
      return new Response(
        JSON.stringify({ error: casesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!unpaidCases || unpaidCases.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unpaid cases found", nudges_sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate by user_id (take latest case per user)
    const userCaseMap = new Map<string, typeof unpaidCases[0]>();
    for (const c of unpaidCases) {
      if (!userCaseMap.has(c.user_id)) {
        userCaseMap.set(c.user_id, c);
      }
    }

    let nudgesSent = 0;
    let nudgesSkipped = 0;
    const errors: string[] = [];

    for (const [userId, caseData] of userCaseMap) {
      const hoursSinceCreation =
        (Date.now() - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60);

      // Determine score
      const aiScore = (caseData.ai_analysis as any)?.score;
      const intakeScore = (caseData.intake_data as any)?.quick_score;
      const score = aiScore || intakeScore || 0;

      if (score === 0) continue;

      // Get profile for name & phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, phone, email")
        .eq("user_id", userId)
        .single();

      if (!profile?.phone) continue;

      const name = profile.first_name || "לקוח/ה";

      for (const nudge of NUDGE_SCHEDULE) {
        // Skip if not yet time
        if (hoursSinceCreation < nudge.hoursAfter) continue;

        // Skip if already sent
        const { data: existing } = await supabase
          .from("nudge_log")
          .select("id")
          .eq("user_id", userId)
          .eq("nudge_type", nudge.type)
          .maybeSingle();

        if (existing) {
          nudgesSkipped++;
          continue;
        }

        // Build message
        const message = NUDGE_MESSAGES[nudge.type](name, score);

        // Send via n8n webhook (or log if no webhook configured)
        let status = "sent";
        let errorMessage: string | null = null;

        if (n8nWebhookUrl) {
          try {
            const webhookRes = await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: profile.phone,
                email: profile.email,
                name,
                score,
                nudge_type: nudge.type,
                message,
                case_id: caseData.id,
              }),
            });
            const webhookBody = await webhookRes.text();
            if (!webhookRes.ok) {
              status = "failed";
              errorMessage = `Webhook returned ${webhookRes.status}: ${webhookBody}`;
              console.error(`Nudge webhook failed for ${userId}:`, errorMessage);
            }
          } catch (err) {
            status = "failed";
            errorMessage = err instanceof Error ? err.message : String(err);
            console.error(`Nudge webhook error for ${userId}:`, errorMessage);
          }
        } else {
          console.log(
            `[DRY RUN] Would send ${nudge.type} nudge to ${profile.phone}: ${message}`
          );
          status = "sent";
        }

        // Log the nudge
        const { error: logError } = await supabase
          .from("nudge_log")
          .insert({
            user_id: userId,
            nudge_type: nudge.type,
            channel: "whatsapp",
            status,
            error_message: errorMessage,
          });

        if (logError) {
          console.error("Failed to log nudge:", logError);
          errors.push(`Log error for ${userId}/${nudge.type}: ${logError.message}`);
        }

        if (status === "sent") nudgesSent++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Nudge check complete",
        nudges_sent: nudgesSent,
        nudges_skipped: nudgesSkipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
