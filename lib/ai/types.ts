/**
 * Provider-agnostic AI interface (section 9.1).
 */

export type AiTaskType =
  | "brief_generation"
  | "draft_generation"
  | "seo_aeo_geo_audit"
  | "diagram_generation";

export type AdapterType = "anthropic" | "openai" | "custom";

export interface GenerateCompletionInput {
  system_prompt: string;
  user_prompt: string;
  max_tokens?: number;
  temperature?: number;
  web_search?: boolean;
}

export interface GenerateCompletionResult {
  text: string;
  model: string;
  provider: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  citations?: { title?: string; url: string }[];
}

export interface AiProviderConfig {
  id: string;
  name: string;
  adapter_type: AdapterType;
  endpoint_url?: string | null;
  api_key: string;
  default_model: string;
  assigned_tasks: AiTaskType[];
  is_active: boolean;
}

export interface AiAdapter {
  type: AdapterType;
  generate(
    config: AiProviderConfig,
    input: GenerateCompletionInput
  ): Promise<GenerateCompletionResult>;
}
