import { describe, expect, it } from "vitest";
import {
  normalizeResult,
  pickProviderForTask,
  type AiProviderConfig,
} from "./index";

describe("pickProviderForTask", () => {
  const providers: AiProviderConfig[] = [
    {
      id: "1",
      name: "cheap-draft",
      adapter_type: "openai",
      api_key: "x",
      default_model: "gpt-4o-mini",
      assigned_tasks: ["draft_generation"],
      is_active: true,
    },
    {
      id: "2",
      name: "audit",
      adapter_type: "anthropic",
      api_key: "y",
      default_model: "claude-sonnet",
      assigned_tasks: ["seo_aeo_geo_audit", "brief_generation"],
      is_active: true,
    },
    {
      id: "3",
      name: "off",
      adapter_type: "custom",
      api_key: "z",
      default_model: "local",
      assigned_tasks: ["draft_generation"],
      is_active: false,
    },
  ];

  it("picks active provider assigned to task", () => {
    expect(pickProviderForTask(providers, "draft_generation")?.name).toBe(
      "cheap-draft"
    );
    expect(pickProviderForTask(providers, "seo_aeo_geo_audit")?.name).toBe(
      "audit"
    );
  });

  it("ignores inactive providers", () => {
    const onlyOff = providers.filter((p) => p.name === "off");
    expect(pickProviderForTask(onlyOff, "draft_generation")).toBeNull();
  });
});

describe("normalizeResult", () => {
  it("fills defaults", () => {
    expect(normalizeResult({ text: "hello" })).toEqual({
      text: "hello",
      model: "unknown",
      provider: "unknown",
      usage: undefined,
      citations: undefined,
    });
  });
});
