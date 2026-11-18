import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Daily: pull Bank of Israel interest rate (public), update prime with its own freshness stamp, snapshot all rates to history.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let boi: number | null = null;
  try {
    const r = await fetch("https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/BR/1.0/MNT_RIB_BOI_D?format=csv&lastNObservations=1");
    const lines = (await r.text()).trim().split("\n");
    const head = lines[0].split(","); const row = lines[1]?.split(",");
    const v = Number(row?.[head.indexOf("OBS_VALUE")]);
    if (v > 0) boi = v;
  } catch (e) { console.error("BOI fetch failed", e); }

  const { data: current } = await admin.from("market_rates").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (current && boi) {
    const prime = +(boi + 1.5).toFixed(2);
    // Stamp only prime. updated_at/source describe the other (manually maintained) reference rates.
    const { error } = await admin.from("market_rates").update({ prime, prime_source: "boi", prime_updated_at: new Date().toISOString() }).eq("id", current.id);
    // Before the prime_* columns exist, update prime alone rather than re-stamp the whole row.
    if (error) await admin.from("market_rates").update({ prime }).eq("id", current.id);
    current.prime = prime;
  }
  await admin.from("market_rates_history").upsert({ captured_on: new Date().toISOString().slice(0, 10), data: { ...(current || {}), boi_rate: boi }, source: boi ? "boi" : "manual" }, { onConflict: "captured_on" });
  return new Response(JSON.stringify({ ok: true, boi_rate: boi }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
