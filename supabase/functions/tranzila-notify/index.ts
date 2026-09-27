import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Tranzila server-to-server notify endpoint.
// Tranzila POSTs form fields after a successful charge, including any custom
// params we appended to the iframed URL (we pass the case id as `u1`).
// Security: the case UUID is unguessable, we require Response=000, the exact
// expected sum, and the case must still be WaitingForPayment.

const EXPECTED_SUM = "3450";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Tranzila sends application/x-www-form-urlencoded
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const response = params.get("Response"); // "000" = approved
    const sum = params.get("sum");
    const confirmationCode = params.get("ConfirmationCode") || "";
    const caseId = params.get("u1") || params.get("custom1") || "";
    const cardMask = params.get("ccard") || "";
    const last4 = cardMask.slice(-4);

    console.log("tranzila-notify received", { response, sum, caseId, confirmationCode: confirmationCode ? "yes" : "no" });

    if (response !== "000") {
      return new Response(JSON.stringify({ ok: false, reason: "not_approved", response }), {
        status: 200, // ack so Tranzila doesn't retry a declined tx forever
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sum !== EXPECTED_SUM) {
      console.error("sum mismatch", sum);
      return new Response(JSON.stringify({ ok: false, reason: "sum_mismatch" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(caseId)) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_case" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the case and make sure it is still awaiting payment
    const { data: caseRow, error: caseErr } = await supabase
      .from("cases")
      .select("id, case_number, status, user_id")
      .eq("id", caseId)
      .single();

    if (caseErr || !caseRow) {
      console.error("case not found", caseId);
      return new Response(JSON.stringify({ ok: false, reason: "case_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (caseRow.status !== "WaitingForPayment") {
      // Already processed (idempotent ack)
      return new Response(JSON.stringify({ ok: true, already: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark the case as paid and move it into analysis
    const { error: updateErr } = await supabase
      .from("cases")
      .update({
        status: "PaymentSucceeded",
        payment_succeeded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId)
      .eq("status", "WaitingForPayment");

    if (updateErr) throw updateErr;

    // Log the payment event
    const { error: evErr } = await supabase.from("case_events").insert({
      case_id: caseId,
      event_name: "payment_succeeded",
      payload: {
        provider: "tranzila",
        sum: EXPECTED_SUM,
        confirmation_code: confirmationCode,
        card_last4: last4,
      },
    });

    // Notify the client and admin by email (best-effort)
    try {
      await supabase.functions.invoke("case-email", {
        body: { case_id: caseId, event: "status_update" },
      });
    } catch (e) {
      console.error("case-email invoke failed", e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tranzila-notify error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
