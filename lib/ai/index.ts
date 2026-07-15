import { anthropicAdapter } from "./adapters/anthropic";
import { customAdapter } from "./adapters/custom";
import { openaiAdapter } from "./adapters/openai";
import type {
  AdapterType,
  AiAdapter,
  AiProviderConfig,
  AiTaskType,
  GenerateCompletionInput,
  GenerateCompletionResult,
} from "./types";

export type * from "./types";

const adapters: Record<AdapterType, AiAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  custom: customAdapter,
};

/**
 * Single internal interface for all AI calls (section 9.1).
 * Editorial logic never calls a vendor SDK directly.
 */
export async function generateCompletion(
  config: AiProviderConfig,
  input: GenerateCompletionInput
): Promise<GenerateCompletionResult> {
  if (!config.is_active) {
    throw new Error(`AI provider "${config.name}" is not active`);
  }

  const adapter = adapters[config.adapter_type];
  if (!adapter) {
    throw new Error(`Unknown adapter type: ${config.adapter_type}`);
  }

  if (input.web_search && config.adapter_type !== "custom") {
    // Documented fallback: callers should inject search results into the prompt
    // when the provider has no native web_search. We surface this explicitly.
    console.warn(
      `[ai] web_search requested for ${config.adapter_type}; inject search results into user_prompt if needed`
    );
  }

  return adapter.generate(config, input);
}

export function pickProviderForTask(
  providers: AiProviderConfig[],
  task: AiTaskType
): AiProviderConfig | null {
  return (
    providers.find(
      (p) => p.is_active && p.assigned_tasks.includes(task)
    ) ?? null
  );
}

/** Normalize any vendor-shaped response into our result type (for tests). */
export function normalizeResult(
  partial: Partial<GenerateCompletionResult> & { text: string }
): GenerateCompletionResult {
  return {
    text: partial.text,
    model: partial.model ?? "unknown",
    provider: partial.provider ?? "unknown",
    usage: partial.usage,
    citations: partial.citations,
  };
}
