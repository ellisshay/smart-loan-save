import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, getCallerId, canAccessCase } from "../_shared/auth.ts";

// Creates a Cardcom LowProfile payment page for a case.
// The Cardcom terminal credentials live only here (server side) — never in browser code.
// Caller: signed-in user who owns the case (or admin/advisor with access).

const AMOUNT = 3450;
const CREATE_URL = "https://secure.cardcom.solutions/api/v11/LowProfile/Create";

const ALLOWED_ORIGIN_RE =
  /^(https:\/\/([a-z0-9-]+\.)?easymorte\.co\.il|https:\/\/easymorte-co-il\.lovable\.app|https:\/\/id-preview--[a-z0-9-]+\.lovable\.app|http:\/\/localhost:8080)$/;

const clean = (v: unknown, max = 80) => String(v ?? "").replace(/[\r\n]/g, " ").trim().slice(0, max);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = adminClient();
    const uid = await getCallerId(req, admin);
    if (!uid) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const caseId = String((body as any).caseId ?? "");
    const origin = String((body as any).origin ?? "");
    const billing = ((body as any).billing ?? {}) as Record<string, unknown>;

    if (!(await canAccessCase(admin, uid, caseId))) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_ORIGIN_RE.test(origin)) {
      return new Response(JSON.stringify({ error: "bad_origin" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const terminal = Number(Deno.env.get("CARDCOM_TERMINAL_NUMBER") || "");
    const apiName = Deno.env.get("CARDCOM_API_NAME") || "";
    const apiPassword = Deno.env.get("CARDCOM_API_PASSWORD") || "";
    if (!terminal || !apiName) {
      console.error("cardcom-payment-create: missing credentials");
      return new Response(JSON.stringify({ error: "cardcom_not_configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenRow = await admin
      .from("internal_job_tokens")
      .select("token")
      .eq("name", "cardcom_notify")
      .maybeSingle();
    if (!tokenRow?.data?.token) throw new Error("cardcom_notify token missing");
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/cardcom-notify?token=${tokenRow.data.token}`;

    const { data: caseRow, error: caseErr } = await admin
      .from("cases")
      .select("case_number, payment_succeeded")
      .eq("id", caseId)
      .single();
    if (caseErr || !caseRow) {
      return new Response(JSON.stringify({ error: "case_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Never open a second payment page for a case that is already paid.
    if (caseRow.payment_succeeded) {
      return new Response(JSON.stringify({ error: "already_paid" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cardOwnerName = clean([billing.firstName, billing.lastName].filter(Boolean).join(" "), 60);
    const cardOwnerEmail = clean(billing.email, 120);
    const cardOwnerPhone = clean(billing.phone, 20).replace(/[\s-]/g, "");

    const payload: Record<string, unknown> = {
      TerminalNumber: terminal,
      ApiName: apiName,
      Operation: "ChargeOnly",
      ReturnValue: caseId,
      Amount: AMOUNT,
      Language: "he",
      ISOCoinId: 1,
      ProductName: `פתיחת תיק EASY MORTE ${String(caseRow.case_number ?? "").slice(0, 30)}`.trim(),
      SuccessRedirectUrl: `${origin}/dashboard/payment?paid=1&caseId=${encodeURIComponent(caseId)}`,
      FailedRedirectUrl: `${origin}/dashboard/payment?paid=0&caseId=${encodeURIComponent(caseId)}`,
      WebHookUrl: webhookUrl,
      AdvancedDefinition: { MinNumOfPayments: 1, MaxNumOfPayments: 4 },
      UIDefinition: {
        ...(cardOwnerName ? { CardOwnerNameValue: cardOwnerName } : {}),
        ...(cardOwnerEmail ? { CardOwnerEmailValue: cardOwnerEmail } : {}),
        ...(cardOwnerPhone ? { CardOwnerPhoneValue: cardOwnerPhone } : {}),
      },
    };
    if (apiPassword) payload.ApiPassword = apiPassword;

    const res = await fetch(CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ResponseCode !== 0) {
      console.error("cardcom Create failed", res.status, data?.ResponseCode ?? null);
      return new Response(JSON.stringify({ error: "cardcom_create_failed", description: data.Description ?? "" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: data.Url, lowProfileId: data.LowProfileId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cardcom-payment-create error", err instanceof Error ? err.name : "error");
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
