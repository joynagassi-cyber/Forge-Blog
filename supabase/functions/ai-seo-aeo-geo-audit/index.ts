/**
 * Edge Function: ai-seo-aeo-geo-audit
 * Independent audit call; never same call as draft_generation.
 * Writes article_scores + [à vérifier] flags.
 */
// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "Scaffold only. Implement seo_aeo_geo_audit with web_search for fact-checking.",
      task: "seo_aeo_geo_audit",
      requires_web_search: true,
      human_approval_required: true,
    }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
