/**
 * Visitor language detection (section 8.2).
 * Priority: explicit choice > URL > Accept-Language > Geo-IP nudge > en fallback.
 */

export type Locale = "en" | "fr";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "fr"] as const;

/** Future locales (Phase 9 — scaffold, not yet in SUPPORTED_LOCALES) */
export const FUTURE_LOCALES: readonly string[] = ["de", "es", "it"] as const;

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fb_locale";

export type LocaleSignals = {
  /** Previously chosen locale from cookie or profile */
  explicitChoice?: string | null;
  /** Locale prefix from path, e.g. "en" or "fr" */
  urlLocale?: string | null;
  /** Raw Accept-Language header */
  acceptLanguage?: string | null;
  /** Optional geo country code, e.g. "FR", "US" */
  geoCountry?: string | null;
};

export type LocaleResolution = {
  locale: Locale;
  source: "explicit" | "url" | "accept_language" | "geo" | "fallback";
};

function asLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase().slice(0, 2);
  if (normalized === "en" || normalized === "fr") return normalized;
  return null;
}

/**
 * Parse Accept-Language into ordered locale preferences.
 * e.g. "fr-FR,fr;q=0.9,en;q=0.8" → ["fr", "en"]
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale[] {
  if (!header) return [];

  const parts = header.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.split("=")[1]) : 1;
    const lang = tag.trim().toLowerCase().split("-")[0];
    return { lang, q: Number.isFinite(q) ? q : 1 };
  });

  parts.sort((a, b) => b.q - a.q);

  const result: Locale[] = [];
  for (const { lang } of parts) {
    const loc = asLocale(lang);
    if (loc && !result.includes(loc)) result.push(loc);
  }
  return result;
}

/** EU countries where French is a strong secondary signal when AL is ambiguous */
const FR_GEO_NUDGE = new Set([
  "FR",
  "BE",
  "CH",
  "LU",
  "MC",
  "CA", // Quebec-heavy traffic often has fr in Accept-Language; still only a nudge
]);

/**
 * Resolve locale server-side on first response (no client flash).
 */
export function resolveLocale(signals: LocaleSignals): LocaleResolution {
  const explicit = asLocale(signals.explicitChoice ?? undefined);
  if (explicit) {
    return { locale: explicit, source: "explicit" };
  }

  const fromUrl = asLocale(signals.urlLocale ?? undefined);
  if (fromUrl) {
    return { locale: fromUrl, source: "url" };
  }

  const fromAl = parseAcceptLanguage(signals.acceptLanguage);
  if (fromAl.length > 0) {
    // Clear French preference wins
    if (fromAl[0] === "fr") {
      return { locale: "fr", source: "accept_language" };
    }
    // Any non-French first preference → en (primary beachhead)
    if (fromAl[0] === "en") {
      return { locale: "en", source: "accept_language" };
    }
  }

  // Accept-Language missing or ambiguous: geo as secondary nudge only
  const country = signals.geoCountry?.toUpperCase() ?? null;
  if (country && FR_GEO_NUDGE.has(country)) {
    // Only nudge to fr when AL did not clearly prefer another supported locale
    if (fromAl.length === 0 || (fromAl.includes("fr") && fromAl[0] !== "en")) {
      return { locale: "fr", source: "geo" };
    }
  }

  return { locale: DEFAULT_LOCALE, source: "fallback" };
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === "/" || clean === "") return `/${locale}`;
  return `/${locale}${clean}`;
}
