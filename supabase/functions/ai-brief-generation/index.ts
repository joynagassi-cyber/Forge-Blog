/**
 * Edge Function: ai-brief-generation
 * Loads assigned provider from ai_providers, never hard-codes a vendor.
 * Human approval required before article status advances past In review.
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

  // Scaffold: wire Supabase service role + generateCompletion via adapter
  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "Scaffold only. Implement provider lookup from ai_providers and call generateCompletion for brief_generation.",
      task: "brief_generation",
      requires_web_search: true,
      human_approval_required: true,
    }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
