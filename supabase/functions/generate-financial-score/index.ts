import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FINANCIAL_SCORE_PROMPT = `אתה מנוע תמיכה בהחלטה לתיק משכנתא בישראל.
המטרה שלך היא להציע ניתוח ראשוני מקצועי, לא להבטיח אישור ולא להחליף בדיקת מומחה.

כללים מחייבים:
- אין להמציא נתונים חסרים.
- לפחות 33.33% מהמשכנתא חייב להיות בריבית קבועה.
- סך המסלולים בריבית משתנה לא יעלה על 66.67%.
- תקרת יחס ההחזר הרגולטורית היא 50%; מעל 40% יש לסמן סיכון גבוה.
- LTV מרבי: דירה יחידה 75%, דירה חליפית 70%, דירה להשקעה 50%.
- ריביות שמתקבלות מהמערכת הן נקודת ייחוס בלבד, לא הצעת בנק.
- בתיק מחזור יש להתחשב במשכנתא הקיימת, קנסות יציאה, תקופה שנותרה, מסלולים קיימים ומטרת המחזור.
- אם אין מספיק מידע כדי להמליץ, כתוב זאת במפורש.

פרטי לקוח:
{client_profile_json}

מסמכים שנותחו:
{documents_analysis_json}

ריביות מערכת:
{all_rates_json}

היסטוריית ריביות:
{rates_history_json}

מאגר תיקים אנונימי:
{pool_json}

החזר JSON בלבד במבנה הבא:
{
  "score": number,
  "score_label": string,
  "approval_probability": string,
  "ltv": number,
  "dti": number,
  "max_monthly": number,
  "max_loan_amount": number,
  "score_breakdown": {
    "income_stability": {"score": number, "max": 25, "note": string},
    "ltv_quality": {"score": number, "max": 20, "note": string},
    "dti_ratio": {"score": number, "max": 25, "note": string},
    "credit_history": {"score": number, "max": 15, "note": string},
    "equity_quality": {"score": number, "max": 15, "note": string}
  },
  "mixes": [
    {
      "name": string,
      "tagline": string,
      "for_who": string,
      "recommended": boolean,
      "tracks": [
        {
          "track_name": string,
          "percentage": number,
          "rate": number,
          "monthly_payment": number,
          "early_repayment": "free"|"penalty"
        }
      ],
      "total_monthly": number,
      "total_interest": number,
      "total_cost": number,
      "pros": [string],
      "cons": [string],
      "risk_level": string,
      "best_if": string
    }
  ],
  "insights": [{"type":"positive"|"warning"|"tip"|"comparison","title":string,"body":string,"action":string|null}],
  "existing_offer_comparison": null,
  "strengths": [string],
  "red_flags": [string],
  "urgency_note": string|null,
  "advisor_summary": string,
  "recommended_banks": [string]
}

צור בדיוק 3 תמהילים רק אם יש מספיק נתונים. כל התמהילים חייבים לעמוד בכללי הרגולציה לעיל.
`;

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pmt = (principal: number, annualRate: number, years: number) => {
  const months = Math.max(1, Math.round(years * 12));
  const monthly = annualRate / 100 / 12;
  if (!monthly) return principal / months;
  return principal * monthly / (1 - Math.pow(1 + monthly, -months));
};

const variableTrack = (name: string) => /פריים|משתנה/i.test(name);
const fixedTrack = (name: string) => /קבוע|קל.?צ|ק.?צ/i.test(name);

function validateMixes(mixes: any[]): boolean {
  if (!Array.isArray(mixes) || mixes.length !== 3) return false;
  return mixes.every((mix) => {
    if (!Array.isArray(mix?.tracks) || !mix.tracks.length) return false;
    const total = mix.tracks.reduce((s: number, t: any) => s + num(t.percentage), 0);
    const variable = mix.tracks.filter((t: any) => variableTrack(String(t.track_name || "")))
      .reduce((s: number, t: any) => s + num(t.percentage), 0);
    const fixed = mix.tracks.filter((t: any) => fixedTrack(String(t.track_name || "")))
      .reduce((s: number, t: any) => s + num(t.percentage), 0);
    return Math.abs(total - 100) <= 0.5 && variable <= 66.67 && fixed >= 33.33;
  });
}

function fallbackMixes(amount: number, years: number, rates: any) {
  const fixedRate = num(rates?.fixed_not_linked, 5.1);
  const primeRate = num(rates?.prime, 5.0);
  const varRate = num(rates?.variable_5, 4.8);
  const defs = [
    { name: "יציב", desc: "רוב ההלוואה בריבית קבועה", risk: "נמוך", tracks: [["קל\"צ", 67, fixedRate, "penalty"], ["פריים", 33, primeRate, "free"]] },
    { name: "מאוזן", desc: "איזון בין יציבות לגמישות", risk: "בינוני", tracks: [["קל\"צ", 50, fixedRate, "penalty"], ["פריים", 33, primeRate, "free"], ["משתנה כל 5", 17, varRate, "penalty"]] },
    { name: "גמיש", desc: "יותר גמישות תוך שמירה על מגבלות הריבית המשתנה", risk: "בינוני-גבוה", tracks: [["קל\"צ", 34, fixedRate, "penalty"], ["פריים", 46, primeRate, "free"], ["משתנה כל 5", 20, varRate, "penalty"]] },
  ];

  return defs.map((d, i) => {
    const tracks = d.tracks.map(([name, pct, rate, early]) => {
      const principal = amount * Number(pct) / 100;
      return {
        track_name: String(name),
        percentage: Number(pct),
        rate: Number(rate),
        monthly_payment: Math.round(pmt(principal, Number(rate), years)),
        early_repayment: early,
      };
    });
    const totalMonthly = tracks.reduce((s, t) => s + t.monthly_payment, 0);
    const totalCost = Math.round(totalMonthly * years * 12);
    return {
      name: d.name,
      tagline: d.desc,
      for_who: i === 0 ? "למי שמעדיף ודאות" : i === 1 ? "לרוב משקי הבית" : "למי שצריך גמישות גבוהה יותר",
      recommended: i === 1,
      tracks,
      total_monthly: totalMonthly,
      total_interest: Math.max(0, totalCost - amount),
      total_cost: totalCost,
      pros: i === 0 ? ["יציבות גבוהה"] : i === 1 ? ["איזון בין מחיר לסיכון"] : ["גמישות גבוהה יותר"],
      cons: i === 0 ? ["פחות גמישות"] : i === 1 ? ["חשיפה חלקית לשינויי ריבית"] : ["רגישות גבוהה יותר לשינויי ריבית"],
      risk_level: d.risk,
      best_if: i === 0 ? "החזר יציב חשוב במיוחד" : i === 1 ? "מחפשים איזון" : "צפויים פירעונות מוקדמים או שינויים",
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI service not configured" }, 500);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { case_id } = await req.json().catch(() => ({}));
    if (!case_id) return json({ error: "case_id required" }, 400);

    const { data: caseData } = await admin.from("cases").select("*").eq("id", case_id).single();
    if (!caseData) return json({ error: "Case not found" }, 404);

    const [{ data: profileRole }, { data: roleRows }] = await Promise.all([
      admin.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const staffRoles = new Set(["admin", "operations", "mortgage_advisor", "supervisor"]);
    const isStaff = profileRole?.role === "admin" || (roleRows || []).some((r: any) => staffRoles.has(String(r.role)));
    if (caseData.user_id !== user.id && !isStaff) return json({ error: "Forbidden" }, 403);

    const [{ data: profile }, { data: docs }, { data: tracks }, { data: rates }, { data: history }] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", caseData.user_id).single(),
      admin.from("case_documents").select("doc_type, file_name, ai_extracted_data").eq("case_id", case_id).not("ai_extracted_data", "is", null),
      admin.from("case_tracks").select("*").eq("case_id", case_id),
      admin.from("market_rates").select("*").order("updated_at", { ascending: false }).limit(1).single(),
      admin.from("market_rates_history").select("captured_on, data").order("captured_on", { ascending: false }).limit(30),
    ]);

    const { data: poolRows } = await admin.from("mortgage_profiles")
      .select("case_type, borrower_count, income_range, property_area, property_value, loan_amount, ltv, dti, selected_mix, offered_rate")
      .eq("case_type", caseData.case_type || "new")
      .limit(200);

    const pool = poolRows || [];
    const avg = (k: string) => {
      const values = pool.map((r: any) => num(r[k])).filter((n) => n > 0);
      return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    };
    const poolSummary = {
      count: pool.length,
      avg_loan: avg("loan_amount"),
      avg_property_value: avg("property_value"),
      avg_ltv: avg("ltv"),
      avg_dti: avg("dti"),
      sample: pool.slice(0, 20),
    };

    const intake: any = caseData.intake_data || {};
    const currentTracks = (tracks?.length ? tracks : intake.current_mortgage?.tracks) || [];
    const clientProfile = {
      name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
      case_type: caseData.case_type,
      goal: caseData.goal,
      intake_data: intake,
      existing_tracks: currentTracks,
    };
    const documentsAnalysis = (docs || []).map((d: any) => ({ type: d.doc_type, data: d.ai_extracted_data }));

    const prompt = FINANCIAL_SCORE_PROMPT
      .replace("{client_profile_json}", JSON.stringify(clientProfile))
      .replace("{documents_analysis_json}", JSON.stringify(documentsAnalysis))
      .replace("{all_rates_json}", JSON.stringify(rates || {}))
      .replace("{rates_history_json}", JSON.stringify(history || []))
      .replace("{pool_json}", JSON.stringify(poolSummary));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error", aiResponse.status, await aiResponse.text());
      return json({ error: aiResponse.status === 429 ? "Rate limit exceeded" : "AI analysis failed" }, aiResponse.status === 429 ? 429 : 502);
    }

    const raw = (await aiResponse.json()).choices?.[0]?.message?.content || "";
    let analysis: any;
    try { analysis = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw); }
    catch { analysis = {}; }

    const totalIncome =
      num(intake.income?.monthlyNetIncome) +
      num(intake.income?.b2MonthlyNetIncome) +
      num(intake.income?.rentalIncome) +
      num(intake.income?.benefitsIncome) +
      num(intake.income?.alimonyIncome) +
      num(intake.income?.investmentIncome) +
      num(intake.income?.otherIncome);

    const existingPayments = num(intake.liabilities?.existingLoanPayments);
    const amount = caseData.case_type === "refi"
      ? num(intake.current_mortgage?.totalBalance)
      : num(intake.mortgage_request?.requestedAmount || intake.property?.requestedMortgage);
    const years = Math.min(30, Math.max(4, num(intake.mortgage_request?.desiredYears || intake.current_mortgage?.remainingYears, 25)));

    if (!validateMixes(analysis.mixes)) {
      analysis.mixes = fallbackMixes(amount, years, rates);
      analysis.advisor_summary = `${analysis.advisor_summary || ""} תמהילי ה-AI לא עברו ולידציה רגולטורית ולכן הוחלפו בתמהילי בסיס בטוחים לבדיקה מקצועית.`.trim();
      analysis.red_flags = [...(analysis.red_flags || []), "התמהילים המוצגים הם בסיס אוטומטי ומחייבים אישור מקצועי לפני הגשה לבנק"];
    }

    analysis.score = Math.max(0, Math.min(100, num(analysis.score)));
    analysis.max_monthly = num(analysis.max_monthly, Math.max(0, totalIncome * 0.35 - existingPayments));
    analysis.report_date = new Date().toISOString();
    analysis.pool_size = pool.length;
    analysis.market_rates_used = rates || {};
    analysis.requires_professional_review = true;

    const { error: updateError } = await admin.from("cases").update({ ai_analysis: analysis }).eq("id", case_id);
    if (updateError) return json({ error: "Could not save analysis" }, 500);

    return json({ success: true, analysis });
  } catch (error) {
    console.error("generate-financial-score error:", error);
    return json({ error: error instanceof Error ? error.message : "error" }, 500);
  }
});
