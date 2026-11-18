import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, getCallerId, canAccessCase } from "../_shared/auth.ts";

// Creates a Cardcom LowProfile payment page for a case.
// The Cardcom terminal credentials live only here (server side) — never in browser code.
// Caller: signed-in user who owns the case (or admin/advisor with access).

const AMOUNT = 3450;
const CREATE_URL = "https://secure.cardcom.solutions/api/v11/LowProfile/Create";
const RESULT_URL = "https://secure.cardcom.solutions/api/v11/LowProfile/GetLpResult";

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

    // An earlier page for this case may have been paid while its webhook is still on the way. Ask Cardcom
    // before opening another one, so the client is never charged twice. If the answer is unclear, stop.
    const previous = await openAttempt(admin, caseId);
    if (previous) {
      const state = await attemptState(previous.low_profile_id, terminal, apiName, apiPassword);
      if (state === "approved") {
        return new Response(JSON.stringify({ error: "payment_pending_verification" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (state === "unknown") {
        return new Response(JSON.stringify({ error: "payment_status_unknown" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await closeAttempt(admin, previous.id);
    }

    const cardOwnerName = clean([billing.firstName, billing.lastName].filter(Boolean).join(" "), 60);
    const cardOwnerEmail = clean(billing.email, 120);
    const cardOwnerPhone = clean(billing.phone, 20).replace(/[\s-]/g, "");
    const invoiceName = clean(billing.invoiceName, 80) || cardOwnerName;
    const taxId = clean(billing.taxId, 9).replace(/\D/g, "");
    if (!cardOwnerName || !invoiceName || !/^0\d{8,9}$/.test(cardOwnerPhone) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardOwnerEmail) || (taxId && !/^\d{5,9}$/.test(taxId))) {
      return new Response(JSON.stringify({ error: "invalid_billing" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      // The terminal requires document data. Auto preserves its configured document type;
      // editable details let checkout collect missing billing information.
      Document: {
        TypeToCreate: "Auto",
        IsAllowEditDocument: false,
        IsSendByEmail: true,
        Language: "he",
        Name: invoiceName,
        Email: cardOwnerEmail,
        Mobile: cardOwnerPhone,
        ...(taxId ? { TaxId: taxId } : {}),
        Products: [{
          Description: `פתיחת תיק EASY MORTE ${String(caseRow.case_number ?? "").slice(0, 30)}`.trim(),
          Quantity: 1,
          UnitCost: AMOUNT,
          TotalLineCost: AMOUNT,
        }],
      },
      // Billing details are collected on our own page; Cardcom shows only the card fields.
      UIDefinition: {
        CardOwnerNameValue: cardOwnerName,
        CardOwnerEmailValue: cardOwnerEmail,
        CardOwnerPhoneValue: cardOwnerPhone,
        IsHideCardOwnerName: true,
        IsHideCardOwnerEmail: true,
        IsHideCardOwnerPhone: true,
        ...(taxId && taxId.length === 9 ? { CardOwnerIdentityNumberValue: taxId } : {}),
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

    await recordAttempt(admin, caseId, String(data.LowProfileId ?? ""));

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

// deno-lint-ignore no-explicit-any
type Admin = any;

// The newest page still marked open for this case, or null. A missing table (migration not applied yet)
// behaves like no earlier attempt, which is how payments worked before #44.
async function openAttempt(admin: Admin, caseId: string): Promise<{ id: string; low_profile_id: string } | null> {
  try {
    const { data, error } = await admin.from("payment_attempts").select("id, low_profile_id")
      .eq("case_id", caseId).eq("status", "open").order("created_at", { ascending: false }).limit(1).maybeSingle();
    return error || !data?.low_profile_id ? null : data;
  } catch {
    return null;
  }
}

// approved: the charge went through. not_paid: Cardcom answered and there is no approved charge.
// unknown: no clear answer, so no new page is opened.
async function attemptState(lowProfileId: string, terminal: number, apiName: string, apiPassword: string): Promise<"approved" | "not_paid" | "unknown"> {
  try {
    const res = await fetch(RESULT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ TerminalNumber: terminal, ApiName: apiName, ...(apiPassword ? { ApiPassword: apiPassword } : {}), LowProfileId: lowProfileId }),
    });
    if (!res.ok) return "unknown";
    const r = await res.json().catch(() => null);
    if (!r || typeof r.ResponseCode !== "number") return "unknown";
    if (r.ResponseCode !== 0) return "not_paid";
    const t = r.TranzactionInfo;
    return t && Number(t.ResponseCode) === 0 ? "approved" : "not_paid";
  } catch {
    return "unknown";
  }
}

async function closeAttempt(admin: Admin, id: string) {
  try { await admin.from("payment_attempts").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", id); }
  catch { console.error("cardcom-payment-create: attempt not closed"); }
}

async function recordAttempt(admin: Admin, caseId: string, lowProfileId: string) {
  if (!lowProfileId) return;
  try { await admin.from("payment_attempts").insert({ case_id: caseId, low_profile_id: lowProfileId, status: "open" }); }
  catch { console.error("cardcom-payment-create: attempt not recorded"); }
}
