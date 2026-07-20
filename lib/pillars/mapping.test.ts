import { describe, expect, it } from "vitest";
import {
  conversionCopy,
  resolveProductForPillar,
} from "./mapping";

describe("resolveProductForPillar", () => {
  it("returns none for all remaining pillars (product-neutral)", () => {
    expect(resolveProductForPillar("retention-memory")).toBe("none");
    expect(resolveProductForPillar("fsrs-algorithms")).toBe("none");
    expect(resolveProductForPillar("active-learning")).toBe("none");
  });

  it("returns none for unknown pillar", () => {
    expect(resolveProductForPillar("unknown")).toBe("none");
  });
});

describe("conversionCopy", () => {
  it("returns NainoForge CTA for nainoforge product", () => {
    const c = conversionCopy("nainoforge", "en");
    expect(c.ctaLabel).toMatch(/NainoForge/i);
    expect(c.ctaHref).toContain("nainoforge");
  });

  it("returns empty CTA for none product", () => {
    const c = conversionCopy("none", "en");
    expect(c.ctaLabel).toBe("");
    expect(c.ctaHref).toBe("#");
  });
});
