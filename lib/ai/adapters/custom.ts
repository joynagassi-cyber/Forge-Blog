import type {
  AiAdapter,
  AiProviderConfig,
  GenerateCompletionInput,
  GenerateCompletionResult,
} from "../types";

/**
 * Generic custom endpoint adapter.
 * Expects OpenAI-compatible chat completions shape by default.
 * endpoint_url is required.
 */
export const customAdapter: AiAdapter = {
  type: "custom",

  async generate(
    config: AiProviderConfig,
    input: GenerateCompletionInput
  ): Promise<GenerateCompletionResult> {
    if (!config.endpoint_url) {
      throw new Error("Custom adapter requires endpoint_url");
    }

    const res = await fetch(config.endpoint_url, {
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
        web_search: input.web_search ?? false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Custom adapter error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      text?: string;
      content?: string;
      choices?: { message?: { content?: string } }[];
      model?: string;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        prompt_tokens?: number;
        completion_tokens?: number;
      };
      citations?: { title?: string; url: string }[];
    };

    const text =
      data.text ??
      data.content ??
      data.choices?.[0]?.message?.content ??
      "";

    return {
      text,
      model: data.model ?? config.default_model,
      provider: config.name,
      usage: {
        input_tokens:
          data.usage?.input_tokens ?? data.usage?.prompt_tokens,
        output_tokens:
          data.usage?.output_tokens ?? data.usage?.completion_tokens,
      },
      citations: data.citations,
    };
  },
};
