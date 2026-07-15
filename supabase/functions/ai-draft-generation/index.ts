/**
 * Edge Function: ai-draft-generation
 * Populates section 10 scaffold into articles.content (draft status only).
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
        "Scaffold only. Implement draft_generation against section 10 block sequence.",
      task: "draft_generation",
      requires_web_search: false,
      human_approval_required: true,
      ai_generated: true,
    }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
