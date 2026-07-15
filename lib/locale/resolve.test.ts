import { describe, expect, it } from "vitest";
import {
  parseAcceptLanguage,
  resolveLocale,
} from "./resolve";

describe("parseAcceptLanguage", () => {
  it("orders by q-factor", () => {
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toEqual([
      "fr",
      "en",
    ]);
  });

  it("returns empty for missing header", () => {
    expect(parseAcceptLanguage(null)).toEqual([]);
  });
});

describe("resolveLocale", () => {
  it("prefers explicit cookie choice forever", () => {
    const r = resolveLocale({
      explicitChoice: "fr",
      urlLocale: "en",
      acceptLanguage: "en-US",
      geoCountry: "US",
    });
    expect(r).toEqual({ locale: "fr", source: "explicit" });
  });

  it("honors URL locale when no explicit choice", () => {
    const r = resolveLocale({
      explicitChoice: null,
      urlLocale: "fr",
      acceptLanguage: "en",
    });
    expect(r).toEqual({ locale: "fr", source: "url" });
  });

  it("uses Accept-Language fr when first preference", () => {
    const r = resolveLocale({
      acceptLanguage: "fr-BE,fr;q=0.9,en;q=0.5",
    });
    expect(r).toEqual({ locale: "fr", source: "accept_language" });
  });

  it("defaults non-French Accept-Language to en", () => {
    const r = resolveLocale({
      acceptLanguage: "de-DE,de;q=0.9",
    });
    expect(r.locale).toBe("en");
  });

  it("falls back to en", () => {
    const r = resolveLocale({});
    expect(r).toEqual({ locale: "en", source: "fallback" });
  });

  it("geo nudges to fr only when AL ambiguous", () => {
    const r = resolveLocale({
      geoCountry: "FR",
      acceptLanguage: null,
    });
    expect(r).toEqual({ locale: "fr", source: "geo" });
  });

  it("does not let geo override clear English AL", () => {
    const r = resolveLocale({
      acceptLanguage: "en-US,en;q=0.9",
      geoCountry: "FR",
    });
    expect(r).toEqual({ locale: "en", source: "accept_language" });
  });
});
