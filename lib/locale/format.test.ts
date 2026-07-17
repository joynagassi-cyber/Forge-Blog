import { describe, expect, it } from "vitest";
import { formatLocalizedDate } from "./format";

describe("formatLocalizedDate", () => {
  it("formats English dates in en-US", () => {
    expect(formatLocalizedDate("2026-06-12T00:00:00Z", "en")).toBe(
      "Jun 12, 2026"
    );
  });

  it("formats French dates in fr-FR", () => {
    expect(formatLocalizedDate("2026-06-12T00:00:00Z", "fr")).toMatch(
      /12\s+juin\s+2026/i
    );
  });
});
