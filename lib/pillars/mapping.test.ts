import { describe, expect, it } from "vitest";
import {
  conversionCopy,
  resolveProductForPillar,
} from "./mapping";

describe("resolveProductForPillar", () => {
  it("maps retention pillars to nainoforge", () => {
    expect(resolveProductForPillar("retention-memory")).toBe("nainoforge");
    expect(resolveProductForPillar("fsrs-algorithms")).toBe("nainoforge");
  });

  it("maps SOC pillars to scyforge", () => {
    expect(resolveProductForPillar("soc-onboarding")).toBe("scyforge");
    expect(resolveProductForPillar("ops-cyber")).toBe("scyforge");
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

  it("returns SCYForge demo CTA in French", () => {
    const c = conversionCopy("scyforge", "fr");
    expect(c.ctaLabel).toMatch(/SCYForge/i);
    expect(c.headline.length).toBeGreaterThan(0);
  });
});
