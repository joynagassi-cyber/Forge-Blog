/**
 * Edge Function: sitemap-generate
 * Locale-segmented sitemap (section 8.5). Run on schedule or publish webhook.
 */
// deno-lint-ignore-file
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async () => {
  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "Scaffold only. Query published articles by locale and emit sitemap XML.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } }
  );
});
