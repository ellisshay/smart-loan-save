import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Notification templates ──────────────────────────────────────────
interface NotificationTemplate {
  whatsapp: { body: string };
  email: { subject: string; body_html: string };
}

function buildNotifications(
  eventName: string,
  data: Record<string, any>
): NotificationTemplate | null {
  const name = data.user?.name || "לקוח/ה";
  const caseNumber = data.case_number || data.case_id?.slice(0, 8) || "";
  const caseType = data.case_type === "refi" ? "מיחזור משכנתא" : "משכנתא חדשה";

  switch (eventName) {
    case "case_created":
      return {
        whatsapp: {
          body: `שלום ${name} 👋\nהתיק שלך נפתח בהצלחה ב-EasyMorte!\nמספר תיק: ${caseNumber}\nסוג: ${caseType}\n\nהשלם/י את השאלון כדי לקבל הצעות מיועצים מובילים.`,
        },
        email: {
          subject: `התיק שלך נפתח בהצלחה – ${caseNumber}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">שלום ${name} 👋</h2>
              <p>התיק שלך נפתח בהצלחה ב-<strong>EasyMorte</strong>!</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">מספר תיק</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">${caseNumber}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">סוג</td><td style="padding:8px;border-bottom:1px solid #eee;">${caseType}</td></tr>
              </table>
              <p>השלם/י את השאלון כדי לקבל הצעות מיועצים מובילים.</p>
              <a href="https://smart-loan-save.lovable.app/intake" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">המשך לשאלון →</a>
            </div>`,
        },
      };

    case "case_submitted":
      return {
        whatsapp: {
          body: `🎉 ${name}, השאלון הושלם בהצלחה!\nתיק ${caseNumber}\n\nהצעד הבא: תשלום דמי ניתוח (₪3,800) והעלאת מסמכים.\nהצוות שלנו יתחיל לעבוד על הניתוח מיד לאחר מכן.`,
        },
        email: {
          subject: `השאלון הושלם – תיק ${caseNumber}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">השאלון הושלם בהצלחה! 🎉</h2>
              <p>שלום ${name},</p>
              <p>כל הפרטים התקבלו עבור תיק <strong>${caseNumber}</strong>.</p>
              <h3>מה הלאה?</h3>
              <ol>
                <li>תשלום דמי ניתוח (₪3,800)</li>
                <li>העלאת מסמכים נדרשים</li>
                <li>ניתוח מקצועי תוך 48 שעות</li>
              </ol>
              <a href="https://smart-loan-save.lovable.app/dashboard" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">עבור לדשבורד →</a>
            </div>`,
        },
      };

    case "docs_uploaded":
      return {
        whatsapp: {
          body: `📄 ${name}, המסמך "${data.payload?.file_name || "מסמך"}" הועלה בהצלחה לתיק ${caseNumber}.\n\n${data.missing_docs_count ? `נותרו ${data.missing_docs_count} מסמכים להעלאה.` : "כל המסמכים הועלו! ✅"}`,
        },
        email: {
          subject: `מסמך הועלה – תיק ${caseNumber}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">מסמך הועלה בהצלחה 📄</h2>
              <p>שלום ${name},</p>
              <p>המסמך <strong>${data.payload?.file_name || "מסמך"}</strong> (${data.payload?.doc_type || ""}) הועלה בהצלחה לתיק ${caseNumber}.</p>
              ${data.missing_docs_count ? `<p style="color:#e67e22;">נותרו <strong>${data.missing_docs_count}</strong> מסמכים להעלאה.</p>` : '<p style="color:#27ae60;font-weight:bold;">כל המסמכים הועלו! ✅</p>'}
              <a href="https://smart-loan-save.lovable.app/dashboard/documents" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">נהל מסמכים →</a>
            </div>`,
        },
      };

    case "lead_created":
      return {
        whatsapp: {
          body: `📢 ליד חדש ב-EasyMorte!\nאזור: ${data.property_area || "לא צוין"}\nמטרה: ${data.purpose || caseType}\nטווח הכנסה: ${data.income_range || "לא צוין"}\n\nהיכנס לדשבורד היועצים כדי לרכוש את הליד.`,
        },
        email: {
          subject: `ליד חדש זמין – ${data.property_area || caseType}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">ליד חדש זמין! 📢</h2>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">אזור</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.property_area || "לא צוין"}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">מטרה</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.purpose || caseType}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">הכנסה</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.income_range || "לא צוין"}</td></tr>
              </table>
              <a href="https://smart-loan-save.lovable.app/advisor" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">רכוש ליד →</a>
            </div>`,
        },
      };

    case "offer_submitted":
      return {
        whatsapp: {
          body: `💰 ${name}, קיבלת הצעת משכנתא חדשה!\nבנק: ${data.payload?.bank_name || ""}\nריבית: ${data.payload?.interest_rate || ""}%\nהחזר חודשי: ₪${data.payload?.monthly_payment || ""}\n\nהיכנס/י לדשבורד כדי להשוות הצעות.`,
        },
        email: {
          subject: `הצעת משכנתא חדשה – ${data.payload?.bank_name || ""}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">הצעת משכנתא חדשה! 💰</h2>
              <p>שלום ${name},</p>
              <p>התקבלה הצעה חדשה עבורך:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8f9fa;border-radius:8px;">
                <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">בנק</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;">${data.payload?.bank_name || ""}</td></tr>
                <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">ריבית</td><td style="padding:12px;border-bottom:1px solid #eee;">${data.payload?.interest_rate || ""}%</td></tr>
                <tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;">החזר חודשי</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:bold;">₪${data.payload?.monthly_payment || ""}</td></tr>
                <tr><td style="padding:12px;color:#666;">תקופה</td><td style="padding:12px;">${data.payload?.loan_period || "—"} שנים</td></tr>
              </table>
              <a href="https://smart-loan-save.lovable.app/dashboard/offers" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">השוואת הצעות →</a>
            </div>`,
        },
      };

    case "payment_succeeded":
      return {
        whatsapp: {
          body: `✅ ${name}, התשלום עבור תיק ${caseNumber} התקבל בהצלחה!\n\nהצוות שלנו מתחיל בניתוח המקצועי. תוצאות תוך 48 שעות.`,
        },
        email: {
          subject: `התשלום התקבל – תיק ${caseNumber}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#27ae60;">התשלום התקבל בהצלחה ✅</h2>
              <p>שלום ${name},</p>
              <p>התשלום עבור תיק <strong>${caseNumber}</strong> התקבל.</p>
              <p>הצוות שלנו מתחיל בניתוח המקצועי. תקבל/י תוצאות תוך <strong>48 שעות</strong>.</p>
              <a href="https://smart-loan-save.lovable.app/dashboard/status" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">מעקב סטטוס →</a>
            </div>`,
        },
      };

    case "status_changed":
      return {
        whatsapp: {
          body: `🔔 ${name}, סטטוס תיק ${caseNumber} עודכן ל: ${data.new_status || data.status || ""}\n\nהיכנס/י לדשבורד למידע נוסף.`,
        },
        email: {
          subject: `עדכון סטטוס – תיק ${caseNumber}`,
          body_html: `
            <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#1a1a2e;">עדכון סטטוס 🔔</h2>
              <p>שלום ${name},</p>
              <p>סטטוס תיק <strong>${caseNumber}</strong> עודכן ל: <strong>${data.new_status || data.status || ""}</strong></p>
              <a href="https://smart-loan-save.lovable.app/dashboard/status" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">צפייה בתיק →</a>
            </div>`,
        },
      };

    default:
      return null;
  }
}

// ── Main handler ────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookUrl = Deno.env.get("WEBHOOK_URL");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_name, case_id, payload } = await req.json();

    if (!event_name || !case_id) {
      return new Response(
        JSON.stringify({ error: "Missing event_name or case_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get case data
    const { data: caseData } = await supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    // Get profile
    const { data: profile } = caseData
      ? await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", caseData.user_id)
          .single()
      : { data: null };

    // Build webhook payload
    const intakeData = (caseData?.intake_data as Record<string, any>) || {};
    const personal = intakeData.personal || {};
    const income = intakeData.income || {};
    const liabilities = intakeData.liabilities || {};
    const property = intakeData.property || {};
    const currentMortgage = intakeData.current_mortgage || {};

    const webhookPayload: Record<string, any> = {
      event_name,
      timestamp: new Date().toISOString(),
      case_id,
      case_number: caseData?.case_number || "",
      case_type: caseData?.case_type || "unknown",
      user: {
        name: `${personal.firstName || profile?.first_name || ""} ${personal.lastName || profile?.last_name || ""}`.trim(),
        phone: personal.phone || profile?.phone || "",
        email: personal.email || profile?.email || "",
        id_last4: personal.idNumber ? personal.idNumber.slice(-4) : "",
      },
      goal: caseData?.goal || "",
      mortgage_amount: property.requestedMortgage || currentMortgage.totalBalance || 0,
      current_balance: currentMortgage.totalBalance || 0,
      monthly_payment: currentMortgage.currentMonthlyPayment || 0,
      income_total: (income.monthlyNetIncome || 0) + (income.b2MonthlyNetIncome || 0),
      liabilities_monthly: liabilities.existingLoanPayments || 0,
      ltv: property.purchasePrice
        ? Math.round(((property.requestedMortgage || 0) / property.purchasePrice) * 100)
        : 0,
      dti: 0,
      risk_level: liabilities.riskLevel || "",
      missing_docs_list: [],
      status: caseData?.status || "Draft",
      ...payload,
    };

    // Calculate DTI
    const totalIncome = webhookPayload.income_total;
    if (totalIncome > 0) {
      webhookPayload.dti = Math.round(
        ((webhookPayload.liabilities_monthly + (liabilities.maxDesiredPayment || 0)) / totalIncome) * 100
      );
    }

    // Build notification payloads
    const notifications = buildNotifications(event_name, webhookPayload);
    if (notifications) {
      webhookPayload.notifications = {
        whatsapp: {
          to: webhookPayload.user.phone,
          ...notifications.whatsapp,
        },
        email: {
          to: webhookPayload.user.email,
          ...notifications.email,
        },
      };
    }

    // Log event to case_events
    await supabase.from("case_events").insert({
      case_id,
      event_name,
      payload: webhookPayload,
    });

    // Send to external webhook if configured
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        console.log(`Webhook sent to ${webhookUrl}: ${response.status}`);
      } catch (webhookError) {
        console.error("External webhook error:", webhookError);
      }
    } else {
      console.log("No WEBHOOK_URL configured, event logged only:", event_name);
    }

    return new Response(
      JSON.stringify({ success: true, event_name, has_notifications: !!notifications }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
