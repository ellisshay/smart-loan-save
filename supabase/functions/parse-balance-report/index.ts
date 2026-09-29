import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PROMPT = `אתה מנתח דוח "יתרות לסילוק" של משכנתא מבנק ישראלי.
חלץ כל מסלול (תת-הלוואה) בדוח. לכל מסלול החזר:
type: אחד מ- prime | fixed_nl | fixed_l | var5 | var_l
(prime=פריים, fixed_nl=קבועה לא צמודה, fixed_l=קבועה צמודה, var5=משתנה לא צמודה, var_l=משתנה צמודה)
balance: יתרה לסילוק בשקלים (מספר), rate: ריבית שנתית נוכחית באחוזים (מספר), years: שנים שנותרו (מספר, עגל ליחידה).
החזר JSON בלבד: {"bank": string|null, "tracks":[{"type":..,"balance":..,"rate":..,"years":..}]}
אל תמציא נתונים. אם זה לא דוח יתרות, החזר tracks ריק.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "השירות אינו מוגדר" }, 500);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!user) return json({ error: "יש להתחבר כדי לנתח דוח" }, 401);

    const { file, mime, name } = await req.json().catch(() => ({}));
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (typeof file !== "string" || !allowed.includes(mime) || file.length > 11_000_000)
      return json({ error: "קובץ לא נתמך (PDF או תמונה עד 8MB)" }, 400);

    const dataUrl = `data:${mime};base64,${file}`;
    const part = mime === "application/pdf"
      ? { type: "input_file", filename: String(name || "report.pdf").slice(0, 100), file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl };

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        input: [{ role: "user", content: [{ type: "input_text", text: PROMPT }, part] }],
      }),
    });
    if (ai.status === 429) return json({ error: "עומס זמני, נסו שוב בעוד רגע" }, 429);
    if (ai.status === 402 || ai.status === 403) return json({ error: "שירות הניתוח אינו זמין כרגע" }, ai.status);
    if (!ai.ok || !ai.body) { console.error(await ai.text()); return json({ error: "הניתוח נכשל" }, 502); }

    // Read SSE and accumulate output text
    const reader = ai.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(l.slice(5).trim());
          if (ev.type === "response.output_text.delta") text += ev.delta;
          if (ev.type === "error" || ev.type === "response.failed") console.error("stream error", ev);
        } catch { /* ignore */ }
      }
    }
    if (!text) return json({ error: "לא התקבלה תשובה מהניתוח" }, 502);
    let parsed: any;
    try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text); } catch { return json({ error: "לא ניתן היה לפענח את הדוח" }, 422); }
    const types = ["prime", "fixed_nl", "fixed_l", "var5", "var_l"];
    const tracks = (Array.isArray(parsed.tracks) ? parsed.tracks : [])
      .filter((t: any) => types.includes(t.type))
      .map((t: any) => ({ type: t.type, balance: Number(t.balance) || 0, rate: Number(t.rate) || 0, years: Math.round(Number(t.years) || 0) }))
      .slice(0, 12);
    return json({ bank: parsed.bank ?? null, tracks });
  } catch (e) {
    console.error(e);
    return json({ error: "שגיאה בניתוח הדוח" }, 500);
  }
});
