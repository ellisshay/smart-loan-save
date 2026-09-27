import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DOC_GUIDE: Record<string, string> = {
  id_card: "תעודת זהות ישראלית כולל ספח. בדוק סימני זיוף: פונטים לא אחידים, תמונה מודבקת, ספרת ביקורת של מספר ת.ז., התאמת שם ותאריך לידה להצהרה, עריכה דיגיטלית.",
  id_card_b2: "תעודת זהות של לווה שני. אותן בדיקות זיוף כמו ת.ז.",
  payslips: "תלושי שכר. חלץ ברוטו, נטו, שם מעסיק, חודש. בדוק שהחישובים (ברוטו פחות ניכויים = נטו) הגיוניים, שקיים מספר תיק ניכויים, ושאין סימני עריכה.",
  bank_statements: "דפי עו״ש. זהה הפקדות משכורת קבועות (האם תואמות להכנסה המוצהרת), החזרי הלוואות קבועים, חריגות מסגרת, החזרות צ׳קים.",
};

const SYSTEM = `אתה מערכת אימות מסמכים פיננסיים עבור תיק משכנתא בישראל.
בצע שתי בדיקות:
1. איכות סריקה: קריאות, חדות, חיתוך, תאורה, האם כל המסמך בפריים.
2. מהות ואמינות: האם המסמך הוא אכן מהסוג המבוקש, סימני זיוף או עריכה, והתאמה לנתונים שהלקוח הצהיר בשאלון.
אל תמציא נתונים. החזר JSON בלבד במבנה:
{
 "doc_type_match": boolean,
 "quality": {"status":"good"|"fair"|"poor","score":0-100,"issues":[string]},
 "authenticity": {"status":"authentic"|"suspicious"|"unclear","flags":[string]},
 "extracted": { שדות שחולצו, מספרים בשקלים },
 "detected_loans": [{"description":string,"monthly_amount":number}],
 "cross_check": [{"field":string,"declared":string,"found":string,"status":"match"|"mismatch"|"unknown"}],
 "overall": "verified"|"review"|"rejected",
 "summary": "משפט אחד בעברית ללקוח"
}
כללים ל-overall: rejected אם quality=poor או doc_type_match=false או authenticity=suspicious. review אם יש mismatch משמעותי (פער מעל 10% בהכנסה) או unclear. אחרת verified.`;

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

    const { data: file, error: dlErr } = await admin.storage.from("case-documents").download(doc.file_path);
    if (dlErr || !file) return json({ error: "Download failed" }, 404);

    const ext = doc.file_path.split(".").pop()?.toLowerCase() || "";
    const mime = ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[ext];
    let result: Record<string, unknown>;

    if (!mime) {
      result = { overall: "review", quality: { status: "fair", score: 50, issues: ["פורמט שאינו ניתן לסריקה אוטומטית, יבדק ידנית"] }, authenticity: { status: "unclear", flags: [] }, cross_check: [], summary: "המסמך יבדק ידנית על ידי הצוות" };
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
              { type: "text", text: `סוג מסמך מבוקש: ${doc.doc_type}\nהנחיות: ${DOC_GUIDE[doc.doc_type] ?? "מסמך תומך לתיק משכנתא"}\nנתוני השאלון שהלקוח הצהיר:\n${JSON.stringify(declared)}` },
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
      catch { result = { overall: "review", summary: "לא ניתן היה לפענח את המסמך, יבדק ידנית", quality: { status: "fair", score: 0, issues: [] }, authenticity: { status: "unclear", flags: [] }, cross_check: [] }; }
    }

    result.verified_at = new Date().toISOString();
    await admin.from("case_documents").update({ ai_extracted_data: result }).eq("id", doc.id);
    return json({ success: true, result });
  } catch (e) {
    console.error("analyze-document error:", e);
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
