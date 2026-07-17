import { describe, expect, it } from "vitest";
import { getTranslationCoverage } from "./demo-articles";

describe("getTranslationCoverage", () => {
  it("reports missing French translations for EN-only groups", () => {
    expect(getTranslationCoverage()).toEqual({
      totalGroups: 6,
      completeGroups: 4,
      missingEn: 0,
      missingFr: 2,
    });
  });
});
