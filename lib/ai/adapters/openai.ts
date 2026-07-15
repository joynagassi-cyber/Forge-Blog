import type {
  AiAdapter,
  AiProviderConfig,
  GenerateCompletionInput,
  GenerateCompletionResult,
} from "../types";

/**
 * OpenAI-compatible adapter (works with OpenAI, Azure OpenAI, and many proxies).
 */
export const openaiAdapter: AiAdapter = {
  type: "openai",

  async generate(
    config: AiProviderConfig,
    input: GenerateCompletionInput
  ): Promise<GenerateCompletionResult> {
    const base = (config.endpoint_url || "https://api.openai.com/v1").replace(
      /\/$/,
      ""
    );
    const url = `${base}/chat/completions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.default_model,
        max_tokens: input.max_tokens ?? 4096,
        temperature: input.temperature ?? 0.4,
        messages: [
          { role: "system", content: input.system_prompt },
          { role: "user", content: input.user_prompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI adapter error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      model: data.model ?? config.default_model,
      provider: config.name,
      usage: {
        input_tokens: data.usage?.prompt_tokens,
        output_tokens: data.usage?.completion_tokens,
      },
    };
  },
};
