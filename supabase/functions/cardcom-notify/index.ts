import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, tokenMatches } from "../_shared/auth.ts";

// Cardcom server-to-server webhook ("WebHookUrl" / hidden report page).
// Cardcom POSTs the transaction result here; we NEVER trust it directly —
// we re-verify server-side via LowProfile/GetLpResult before marking the case paid.
// The token in the configured URL (?token=...) is the first gate; GetLpResult is the real one.

const AMOUNT = 3450;
const VERIFY_URL = "https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ack = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const pickNumber = (obj: Record<string, unknown>, keys: string[]): number | null => {
  for (const k of Object.keys(obj ?? {})) {
    if (keys.some((key) => key.toLowerCase() === k.toLowerCase())) {
      const n = Number(obj[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

const pickString = (obj: Record<string, unknown>, re: RegExp): string => {
  for (const k of Object.keys(obj ?? {})) {
    if (re.test(k)) return String(obj[k] ?? "");
  }
  return "";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = adminClient();

    const given = new URL(req.url).searchParams.get("token");
    if (!(await tokenMatches(admin, "cardcom_notify", given))) {
      console.error("cardcom-notify: invalid or missing token");
      return ack({ ok: false, reason: "unauthorized" }, 401);
    }

    const terminal = Number(Deno.env.get("CARDCOM_TERMINAL_NUMBER") || "");
    const apiName = Deno.env.get("CARDCOM_API_NAME") || "";
    const apiPassword = Deno.env.get("CARDCOM_API_PASSWORD") || "";
    if (!terminal || !apiName) {
      console.error("cardcom-notify: missing credentials");
      return ack({ ok: false, reason: "cardcom_not_configured" });
    }

    // Cardcom may POST JSON or form-encoded — accept both, extract LowProfileId only.
    const raw = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = Object.fromEntries(new URLSearchParams(raw));
    }
    const lowProfileId = String(payload.LowProfileId ?? payload.lowProfileId ?? "").trim();
    if (!lowProfileId) {
      console.error("cardcom-notify: missing LowProfileId", raw.slice(0, 300));
      return ack({ ok: false, reason: "missing_low_profile_id" });
    }

    // Verify server-to-server — the webhook body alone is never trusted.
    const verifyRes = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TerminalNumber: terminal,
        ApiName: apiName,
        ...(apiPassword ? { ApiPassword: apiPassword } : {}),
        LowProfileId: lowProfileId,
      }),
    });
    const result = await verifyRes.json().catch(() => ({}));
    if (result.ResponseCode !== 0) {
      // Declined or incomplete deal — ack so Cardcom stops retrying.
      console.log("cardcom-notify: not approved", { lowProfileId, code: result.ResponseCode });
      return ack({ ok: false, reason: "not_approved", responseCode: result.ResponseCode });
    }

    const caseId = String(result.ReturnValue ?? "");
    if (!UUID_RE.test(caseId)) {
      console.error("cardcom-notify: bad ReturnValue", caseId.slice(0, 60));
      return ack({ ok: false, reason: "missing_case" });
    }

    const tranzactionInfo = (result.TranzactionInfo ?? {}) as Record<string, unknown>;
    const amount = pickNumber(tranzactionInfo, ["Amount", "DealAmount", "Sum"]) ??
      pickNumber(result, ["DealAmount", "Amount"]);
    if (amount === null || Math.abs(amount - AMOUNT) > 0.01) {
      console.error("cardcom-notify: amount mismatch", amount);
      return ack({ ok: false, reason: "amount_mismatch" });
    }

    const { data: caseRow, error: caseErr } = await admin
      .from("cases")
      .select("id, status, payment_succeeded")
      .eq("id", caseId)
      .single();
    if (caseErr || !caseRow) {
      console.error("cardcom-notify: case not found", caseId);
      return ack({ ok: false, reason: "case_not_found" });
    }
    // Payment is allowed before intake completion, so the case may be in any pre-payment status.
    if (caseRow.payment_succeeded) {
      console.log("cardcom-notify: already paid", caseId);
      return ack({ ok: true, already: true });
    }

    const last4 = pickString(tranzactionInfo, /last4|lastfour/i).slice(-4) ||
      pickString(result, /last4|lastfour/i).slice(-4);
    const numOfPayments = pickNumber(result.UIValues ?? tranzactionInfo, ["NumOfPayments"]);
    const tranzactionId = String(result.TranzactionId ?? "");

    const { error: updateErr } = await admin
      .from("cases")
      .update({
        status: "PaymentSucceeded",
        payment_succeeded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId)
      .eq("payment_succeeded", false);
    if (updateErr) throw updateErr;

    const { error: evErr } = await admin.from("case_events").insert({
      case_id: caseId,
      event_name: "payment_succeeded",
      payload: {
        provider: "cardcom",
        amount: AMOUNT,
        low_profile_id: lowProfileId,
        tranzaction_id: tranzactionId,
        card_last4: last4,
        num_of_payments: numOfPayments,
      },
    });
    if (evErr) console.error("case_events insert failed", evErr);

    // Notify the client and admin by email (best-effort)
    try {
      await admin.functions.invoke("case-email", {
        body: { case_id: caseId, event: "payment_confirmed" },
      });
    } catch (e) {
      console.error("case-email invoke failed", e);
    }

    console.log("cardcom-notify: marked paid", { caseId, previousStatus: caseRow.status, lowProfileId });
    return ack({ ok: true });
  } catch (err) {
    console.error("cardcom-notify error", err);
    return ack({ ok: false, error: String(err) });
  }
});
