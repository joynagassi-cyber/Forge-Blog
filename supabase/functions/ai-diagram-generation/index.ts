/**
 * Edge Function: ai-diagram-generation (section 9.2 / 14.4)
 *
 * Generates Mermaid diagram definitions and KaTeX equations
 * from natural language instructions using the configured AI provider.
 *
 * POST body:
 * {
 *   article_id: string,
 *   mode: "equation" | "diagram" | "mermaid",
 *   instruction: string,       // What the user wants to generate
 *   context?: string           // Optional context from the editor
 * }
 *
 * Returns:
 * {
 *   content: string,           // The generated LaTeX or Mermaid definition
 *   model: string,
 *   provider: string
 * }
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Logging (structured, not inline)
// ---------------------------------------------------------------------------

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// AI provider dispatch (same pattern as sitemap-generate)
// ---------------------------------------------------------------------------

/** Resolve the active AI provider for diagram_generation. */
async function getProvider(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .contains("assigned_tasks", ["diagram_generation"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ai-diagram-generation] DB error:", error.message);
    return null;
  }

  return data as Record<string, unknown> | null;
}

async function callProvider(
  provider: Record<string, unknown>,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string> {
  const base = ((provider.endpoint_url as string) ?? "").replace(/\/$/, "");
  const apiKey: string = Deno.env.get(provider.api_key_secret_ref as string) ?? "";

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
        max_tokens: maxTokens,
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
        max_tokens: maxTokens,
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

  // Custom adapter (e.g. OpenRouter)
  const url = base || "https://openrouter.ai/api/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: provider.default_model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Custom adapter error " + res.status + ": " + JSON.stringify(data));
  return data.choices?.[0]?.message?.content ?? data.text ?? data.content ?? "";
}

// ---------------------------------------------------------------------------
// System prompts per mode
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<string, string> = {
  equation:
    "You are a LaTeX expert. Generate only valid LaTeX math expressions from natural language descriptions. " +
    "Return ONLY the LaTeX code, no explanations, no markdown fences, no backticks. " +
    "Use display-math notation (\\[ ... \\]) for displayed equations, inline ($...$) for inline. " +
    "Use standard LaTeX packages: amsmath, amssymb. Handle matrices, integrals, sums, fractions, etc.",
  diagram:
    "You are a Mermaid.js diagram expert. Generate only valid Mermaid diagram definitions from natural language descriptions. " +
    "Return ONLY the Mermaid code, no explanations, no markdown fences, no backticks. " +
    "Support these diagram types: graph TD (flowcharts), sequenceDiagram, classDiagram, stateDiagram-v2, " +
    "gantt, pie, erDiagram, journey, gitgraph. Use proper Mermaid syntax with node labels in [brackets] or (parentheses). " +
    "Keep diagrams clean and readable — use meaningful node labels.",
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Supabase environment not configured" }, 503);
  }

  // Parse body
  let body: { article_id?: string; mode?: string; instruction?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { article_id, mode, instruction, context } = body;

  if (!article_id) {
    return json({ error: "article_id is required" }, 400);
  }

  if (!mode || !["equation", "diagram", "mermaid"].includes(mode)) {
    return json({ error: "mode must be 'equation', 'diagram', or 'mermaid'" }, 400);
  }

  if (!instruction || !instruction.trim()) {
    return json({ error: "instruction is required" }, 400);
  }

  // Resolve mode key (mermaid → diagram for prompt purposes)
  const modeKey = mode === "mermaid" ? "diagram" : mode;

  // Get provider
  const supabase = createClient(supabaseUrl, supabaseKey);
  const provider = await getProvider(supabase);

  if (!provider) {
    // No active provider — the client will use fallback generation
    return json({
      content: null,
      error: "No active AI provider assigned to diagram_generation. Configure in Settings.",
      fallback: true,
    }, 503);
  }

  // Build prompts
  const systemPrompt = SYSTEM_PROMPTS[modeKey] ?? SYSTEM_PROMPTS.diagram;
  const userPrompt =
    `Generate a ${modeKey === "equation" ? "LaTeX equation" : "Mermaid diagram"} for: ${instruction.trim()}` +
    (context ? `\n\nContext from the editor:\n${context}` : "") +
    `\n\nReturn ONLY the ${modeKey === "equation" ? "LaTeX code" : "Mermaid definition"} without any formatting.`;

  // Call provider
  try {
    const content = await callProvider(provider, systemPrompt, userPrompt, 2000);

    // Clean up: remove any markdown fences if the model included them
    const clean = content
      .replace(/^```(?:latex|math|mermaid)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return json({
      content: clean,
      model: provider.default_model as string,
      provider: provider.name as string,
    });
  } catch (err) {
    console.error("[ai-diagram-generation] Provider call failed:", err);
    return json({
      content: null,
      error: `Provider call failed: ${(err as Error).message}`,
      fallback: true,
    }, 502);
  }
});
