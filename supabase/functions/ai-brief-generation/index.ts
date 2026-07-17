/**
 * Edge Function: ai-brief-generation (section 9.2 / 14.4)
 *
 * POST body: { article_id: string }
 *
 * 1. Loads article + pillar from Supabase.
 * 2. Reads assigned provider for task "brief_generation" from ai_providers.
 * 3. Calls generateCompletion via provider adapter.
 * 4. Writes result to articles.brief (JSONB).
 * 5. Human approval required before status advances past "in_review".
 */
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callProvider(provider: any, systemPrompt: string, userPrompt: string) {
  const base = (provider.endpoint_url ?? "").replace(/\/$/, "");
  const apiKey: string = Deno.env.get(provider.api_key_secret_ref) ?? "";

  if (!apiKey) {
    throw new Error("Secret not set in Edge Function env");
  }

  if (provider.adapter_type === "anthropic") {
    const url = base || "https://api.anthropic.com";
    const res = await fetch(url + "/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: provider.default_model,
        max_tokens: 2048,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Anthropic error " + res.status + ": " + JSON.stringify(data));
    return data.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join("") ?? "";
  }

  if (provider.adapter_type === "openai") {
    const url = base || "https://api.openai.com";
    const res = await fetch(url + "/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: provider.default_model,
        max_tokens: 2048,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI error " + res.status + ": " + JSON.stringify(data));
    return data.choices?.[0]?.message?.content ?? "";
  }

  const res = await fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: provider.default_model,
      system: systemPrompt,
      user: userPrompt,
      max_tokens: 2048,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Custom adapter error " + res.status + ": " + JSON.stringify(data));
  return data.text ?? data.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let body: { article_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { article_id } = body;
  if (!article_id) return json({ error: "article_id is required" }, 400);

  const { data: article, error: articleErr } = await supabase
    .from("articles")
    .select("id, working_title, excerpt, primary_keyword, search_intent, pillar_id, locale, status, pillars(name_en, name_fr, target_product)")
    .eq("id", article_id)
    .single();

  if (articleErr || !article) {
    return json({ error: "Article not found", detail: articleErr?.message }, 404);
  }

  const { data: providers } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .contains("assigned_tasks", ["brief_generation"]);

  const provider = providers?.[0];
  if (!provider) {
    return json({ error: "No active AI provider assigned to brief_generation. Configure one in Settings." }, 503);
  }

  const pillarName = article.locale === "fr"
    ? article.pillars?.name_fr
    : article.pillars?.name_en;

  const systemPrompt = "You are an editorial strategist for Forge-Blog, the content platform for NainoForge (active learning, FSRS, IMPRINT) and SCYForge (SOC readiness, Semantic Tree, Domain Packs, ASCENT, Proof of Skill). You produce editorial briefs that are grounded, specific, and conversion-aware. Never fabricate facts, statistics, or quotes. Mark unverified claims with [à vérifier]. Do not use em dashes.";

  const userPrompt =
    "Write a complete editorial brief for this article.\n\n" +
    "Working title: " + article.working_title + "\n" +
    "Pillar: " + (pillarName ?? "unknown") + "\n" +
    "Locale: " + article.locale + "\n" +
    "Primary keyword: " + (article.primary_keyword ?? "(not set)") + "\n" +
    "Search intent: " + (article.search_intent ?? "(not set)") + "\n" +
    "Excerpt/summary: " + (article.excerpt ?? "(not set)") + "\n\n" +
    "The brief must include:\n" +
    "1. Primary keyword (confirmed or revised)\n" +
    "2. Secondary keywords (3-5)\n" +
    "3. Search intent (informational / navigational / transactional / commercial)\n" +
    "4. Target audience and their specific problem\n" +
    "5. Unique angle and point of view\n" +
    "6. Suggested H2/H3 structure (6-10 headings)\n" +
    "7. Required evidence and source types\n" +
    "8. Internal linking opportunities\n" +
    "9. Conversion path (NainoForge trial / SCYForge demo / both / none)\n" +
    "10. One honest, non-intrusive product bridge sentence\n\n" +
    "Return as JSON: { primary_keyword, secondary_keywords, search_intent, audience, angle, outline, evidence_requirements, internal_links, conversion_path, product_bridge }.";

  let briefText: string;
  try {
    briefText = await callProvider(provider, systemPrompt, userPrompt);
  } catch (err: any) {
    return json({ error: "AI provider call failed", detail: err.message }, 502);
  }

  let briefJson: Record<string, unknown>;
  try {
    const cleaned = briefText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    briefJson = JSON.parse(cleaned);
  } catch {
    briefJson = { raw: briefText };
  }

  const { error: updateErr } = await supabase
    .from("articles")
    .update({
      brief: briefJson,
      ai_generated: true,
      ai_model: provider.default_model,
      ai_provider: provider.name,
      status: article.status === "idea" || article.status === "researching"
        ? "brief_ready"
        : article.status,
    })
    .eq("id", article_id);

  if (updateErr) {
    return json({ error: "Failed to save brief", detail: updateErr.message }, 500);
  }

  return json({
    ok: true,
    article_id,
    task: "brief_generation",
    human_approval_required: true,
    brief: briefJson,
  });
});
