import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DOC_GUIDE: Record<string, string> = {
  id_card: "תעודת זהות ישראלית כולל ספח. חלץ שם מלא, מספר ת.ז ותאריך לידה. בדוק סימני זיוף מובהקים בלבד: פונטים לא אחידים, תמונה מודבקת, עריכה דיגיטלית, ספרת ביקורת שגויה.",
  id_card_b2: "תעודת זהות של לווה שני. אותן בדיקות.",
  payslips: "תלוש שכר. חלץ ברוטו, נטו, שם מעסיק, מספר ת.ז של העובד וחודש. שים לב שרכיבי שכר משתנים (שעות נוספות, בונוס, עמלות, הבראה, החזר הוצאות) גורמים לשונות חודשית לגיטימית.",
  bank_statements: "דף עובר ושב. זהה הפקדות שכר קבועות, החזרי הלוואות קבועים, חריגות מסגרת והחזרות צקים.",
  mortgage_report: "דוח יתרות לסילוק / פירוט משכנתא. חלץ בנק, יתרה כוללת, החזר חודשי וכל תת-הלוואה: סוג מסלול, יתרה, ריבית, הצמדה, שנים שנותרו, תחנת שינוי/יציאה ועמלת פירעון אם מופיעה. אין להמציא נתון שאינו מופיע בדוח.",
  settlement_report: "דוח סילוק למסלול משכנתא. חלץ יתרה, ריבית, הצמדה, תקופה שנותרה, עמלת פירעון מוקדם ותחנת שינוי אם מופיעים.",
};

const SYSTEM = `אתה מנוע אימות מסמכים פיננסיים לתיק משכנתא בישראל, ופועל כמערכת תומכת החלטה.
העיקרון המנחה: "האם המסמך תומך באופן סביר במידע שהלקוח מסר?" ולא "האם שתי המחרוזות זהות בדיוק".

כללי השוואה מחייבים:
1. אל תשווה טקסט בהשוואה מדויקת. נרמל ערכים לפני השוואה: הסר רווחים כפולים, פיסוק, גרשיים, תארים וסיומות.
2. שמות פרטיים: שמות חיבה מקובלים הם התאמה (דני/דניאל, יוסי/יוסף, אבי/אברהם, משה/מוישה, רפי/רפאל, חני/חנה). שינויי איות קלים אינם אי התאמה.
3. מספר תעודת זהות זהה גובר על כל הבדל באיות השם. במקרה כזה הרמה היא green או לכל היותר yellow, לעולם לא red. מספר תעודת זהות שונה הוא red.
4. מעסיקים: הסר סיומות תאגידיות לפני השוואה (בע"מ, בעמ, Ltd, Limited, Inc, ישראל, Israel, מערכות, שירותים, אחזקות, טכנולוגיות, גרופ). "אמדוקס" ו"אמדוקס מערכות בע"מ" הם אותו מעסיק, green. בספק החזר yellow. red רק כשמדובר בבירור בחברות שונות.
5. הכנסה: אל תדרוש התאמה מדויקת. חשב אחוז סטייה מול המוצהר והסבר אותו ברכיבי שכר משתנים.
6. לעולם אל תדחה מסמך רק בגלל אי התאמה טקסטואלית או סמנטית. red שמור לסתירה מהותית ומוכחת, לזיוף ברור או למסמך שאינו מהסוג המבוקש.

לכל בדיקת הצלבה החזר: הערך שהוצהר, הערך שחולץ, שני הערכים אחרי נרמול, ציון ביטחון 0-100, רמה וסיבה מילולית בעברית.

החזר JSON בלבד במבנה:
{
 "doc_type_match": boolean,
 "quality": {"status":"good"|"fair"|"poor","score":0-100,"issues":[string]},
 "authenticity": {"status":"authentic"|"suspicious"|"unclear","confidence":0-100,"flags":[string]},
 "extracted": { שדות שחולצו, מספרים בשקלים },
 "detected_loans": [{"description":string,"monthly_amount":number}],
 "mortgage_tracks": [{"track_type":string,"principal_balance":number,"interest_rate":number,"is_indexed":boolean,"remaining_years":number,"exit_date":string|null,"exit_penalty":number|null}],
 "cross_check": [{"field":string,"declared":string,"extracted":string,"normalized_declared":string,"normalized_extracted":string,"confidence":0-100,"level":"green"|"yellow"|"red","reason":string,"diff_pct":number|null}],
 "summary": "משפט אחד בעברית, ענייני ולא מאשים"
}
אל תמציא נתונים. אם שדה לא נקרא במסמך, ציין level "yellow" עם reason מתאים.`;

type Level = "green" | "yellow" | "red";

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);

/** Applies configurable business thresholds on top of the model output. */
function applyPolicy(
  result: Record<string, any>,
  t: Record<string, number>,
): { level: Level; overall: "verified" | "review" | "rejected" } {
  const checks: any[] = Array.isArray(result.cross_check) ? result.cross_check : [];
  const idMatch = checks.some(
    (c) => /ת\.?ז|זהות|id/i.test(String(c.field ?? "")) && c.level === "green",
  );

  for (const c of checks) {
    const field = String(c.field ?? "");
    const diff = num(c.diff_pct);
    const conf = num(c.confidence) ?? 0;

    // Income tolerance is configurable and never auto rejects on its own.
    if (diff !== null && /הכנס|שכר|ברוטו|נטו|income|salary/i.test(field)) {
      const d = Math.abs(diff);
      c.level = d <= t.income_green_pct ? "green" : d <= t.income_yellow_pct ? "yellow" : "red";
      if (c.level === "red") c.requires_review = true;
    }

    // Name comparison: ID number carries more weight than spelling.
    if (/שם|name/i.test(field)) {
      if (conf >= t.name_green_score) c.level = "green";
      else if (conf >= t.name_yellow_score) c.level = "yellow";
      if (idMatch && c.level === "red") {
        c.level = "yellow";
        c.reason = `${c.reason ?? ""} (מספר תעודת הזהות תואם, ההבדל הוא באיות השם בלבד)`.trim();
      }
    }

    if (/מעסיק|חברה|employer|company/i.test(field)) {
      if (conf >= t.employer_green_score) c.level = "green";
      else if (c.level === "red" && conf >= 40) c.level = "yellow";
    }

    if (!["green", "yellow", "red"].includes(c.level)) c.level = "yellow";
  }

  const hasRed = checks.some((c) => c.level === "red");
  const hasYellow = checks.some((c) => c.level === "yellow");
  const poorScan = result.quality?.status === "poor" || (num(result.quality?.score) ?? 100) < 40;
  const forged = result.authenticity?.status === "suspicious";
  const wrongType = result.doc_type_match === false;

  let level: Level = "green";
  if (poorScan || forged || wrongType || hasRed) level = "red";
  else if (hasYellow || result.authenticity?.status === "unclear") level = "yellow";

  // Only scan quality, wrong type or proven forgery force a re-upload.
  const overall = poorScan || forged || wrongType ? "rejected" : level === "green" ? "verified" : "review";
  return { level, overall };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { document_id } = await req.json().catch(() => ({}));
    if (typeof document_id !== "string") return json({ error: "document_id required" }, 400);

    const { data: doc } = await admin.from("case_documents")
      .select("id, doc_type, file_path, case_id, cases!inner(user_id, intake_data)")
      .eq("id", document_id).single();
    // deno-lint-ignore no-explicit-any
    const c: any = (doc as any)?.cases;
    if (!doc || c.user_id !== user.id) return json({ error: "Not found" }, 404);

    const { data: settings } = await admin.from("validation_settings").select("key, value");
    const thresholds: Record<string, number> = {
      income_green_pct: 15,
      income_yellow_pct: 30,
      name_green_score: 80,
      name_yellow_score: 55,
      employer_green_score: 75,
    };
    for (const s of settings ?? []) thresholds[s.key] = Number(s.value);

    const { data: file, error: dlErr } = await admin.storage.from("case-documents").download(doc.file_path);
    if (dlErr || !file) return json({ error: "Download failed" }, 404);

    const ext = doc.file_path.split(".").pop()?.toLowerCase() || "";
    const mime = ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[ext];
    let result: Record<string, any>;

    if (!mime) {
      result = {
        overall: "review",
        level: "yellow",
        quality: { status: "fair", score: 50, issues: ["פורמט שאינו ניתן לסריקה אוטומטית, יבדק ידנית"] },
        authenticity: { status: "unclear", confidence: 0, flags: [] },
        cross_check: [],
        summary: "המסמך יועבר לבדיקה של מומחה המשכנתאות",
      };
    } else {
      const b64 = encodeBase64(new Uint8Array(await file.arrayBuffer()));
      const intake = c.intake_data || {};
      const declared = { personal: intake.personal, income: intake.income, liabilities: intake.liabilities };
      const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: [
              { type: "text", text: `סוג מסמך מבוקש: ${doc.doc_type}\nהנחיות: ${DOC_GUIDE[doc.doc_type] ?? "מסמך תומך לתיק משכנתא"}\nספי סבילות מוגדרים: סטיית הכנסה עד ${thresholds.income_green_pct}% תקינה, עד ${thresholds.income_yellow_pct}% דורשת בדיקה.\nנתוני השאלון שהלקוח הצהיר:\n${JSON.stringify(declared)}` },
              { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
            ] },
          ],
        }),
      });
      if (ai.status === 429) return json({ error: "עומס זמני, נסה שוב בעוד רגע" }, 429);
      if (ai.status === 402) return json({ error: "שירות האימות אינו זמין כרגע" }, 402);
      if (!ai.ok) { console.error(await ai.text()); return json({ error: "Verification failed" }, 500); }
      const content = (await ai.json()).choices?.[0]?.message?.content ?? "";
      try { result = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? content); }
      catch {
        result = {
          quality: { status: "fair", score: 0, issues: [] },
          authenticity: { status: "unclear", confidence: 0, flags: [] },
          cross_check: [],
          summary: "לא ניתן היה לפענח את המסמך, הוא יבדק ידנית",
        };
      }
      const policy = applyPolicy(result, thresholds);
      result.level = policy.level;
      result.overall = policy.overall;
    }

    result.thresholds = thresholds;
    result.verified_at = new Date().toISOString();
    result.auto_result = { level: result.level, overall: result.overall, at: result.verified_at };

    await admin.from("case_documents").update({ ai_extracted_data: result }).eq("id", doc.id);

    // A verified/reviewable payoff-balance report becomes the normalized source of truth
    // for refinance tracks. This lets later analysis compare each current track separately.
    if (
      doc.doc_type === "mortgage_report" &&
      result.overall !== "rejected" &&
      Array.isArray(result.mortgage_tracks)
    ) {
      const rows = result.mortgage_tracks
        .map((t: any) => ({
          case_id: doc.case_id,
          track_type: String(t.track_type || "other").slice(0, 80),
          principal_balance: Number(t.principal_balance) || 0,
          interest_rate: Number(t.interest_rate) || 0,
          remaining_years: Number(t.remaining_years) || 0,
          is_indexed: Boolean(t.is_indexed),
          exit_date: t.exit_date || null,
          exit_penalty: Number(t.exit_penalty) || 0,
        }))
        .filter((t: any) => t.principal_balance > 0);

      if (rows.length) {
        await admin.from("case_tracks").delete().eq("case_id", doc.case_id);
        const { error: tracksError } = await admin.from("case_tracks").insert(rows);
        if (tracksError) console.error("mortgage track sync failed", tracksError);
      }
    }

    return json({ success: true, result });
  } catch (e) {
    console.error("analyze-document error:", e);
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
