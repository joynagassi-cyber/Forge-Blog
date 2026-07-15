import type {
  AiAdapter,
  AiProviderConfig,
  GenerateCompletionInput,
  GenerateCompletionResult,
} from "../types";

/**
 * Anthropic Messages API adapter.
 */
export const anthropicAdapter: AiAdapter = {
  type: "anthropic",

  async generate(
    config: AiProviderConfig,
    input: GenerateCompletionInput
  ): Promise<GenerateCompletionResult> {
    const base = (config.endpoint_url || "https://api.anthropic.com").replace(
      /\/$/,
      ""
    );
    const url = `${base}/v1/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.default_model,
        max_tokens: input.max_tokens ?? 4096,
        temperature: input.temperature ?? 0.4,
        system: input.system_prompt,
        messages: [{ role: "user", content: input.user_prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic adapter error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text =
      data.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("") ?? "";

    return {
      text,
      model: data.model ?? config.default_model,
      provider: config.name,
      usage: {
        input_tokens: data.usage?.input_tokens,
        output_tokens: data.usage?.output_tokens,
      },
    };
  },
};
