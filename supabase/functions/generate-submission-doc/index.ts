// DISABLED (SECURITY-B, 2026-11). Sent full intake data (including ID numbers and the signature) to an AI provider. Bank packages will be generated deterministically, without AI.
// The previous implementation is in git history. Do not re-enable without a security review.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ error: "This function has been disabled" }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
