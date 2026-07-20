"use client";

import type { Locale } from "@/lib/locale/resolve";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  locale: Locale;
  enHref?: string;
  frHref?: string;
};

/**
 * Language switcher with three strategies (priority order):
 * 1. Explicit enHref/frHref props (passed from server when available)
 * 2. <link rel="alternate" hreflang="en|fr"> tags in <head>
 *    (automatically set by Next.js metadata for article pages)
 * 3. Pathname-based derivation (fallback for pages without alternates)
 */
export function LanguageSwitcher({ locale, enHref, frHref }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const withoutLocale = pathname.replace(/^\/(en|fr)/, "") || "";

  // Use state + effect to read hreflang after hydration to avoid mismatches
  const [hreflangEn, setHreflangEn] = useState<string | undefined>();
  const [hreflangFr, setHreflangFr] = useState<string | undefined>();

  useEffect(() => {
    if (!enHref) setHreflangEn(getHreflangHref("en"));
    if (!frHref) setHreflangFr(getHreflangHref("fr"));
  }, [enHref, frHref]);

  const resolvedEn = enHref ?? hreflangEn ?? `/en${withoutLocale}`;
  const resolvedFr = frHref ?? hreflangFr ?? `/fr${withoutLocale}`;

  return (
    <div
      className="flex items-center gap-1 text-sm"
      role="navigation"
      aria-label="Language"
    >
      <Link
        href={resolvedEn}
        className={
          locale === "en"
            ? "font-semibold text-[var(--accent)] underline decoration-2 underline-offset-4"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }
        hrefLang="en"
      >
        English
      </Link>
      <span className="text-[var(--text-muted)]" aria-hidden>
        ·
      </span>
      <Link
        href={resolvedFr}
        className={
          locale === "fr"
            ? "font-semibold text-[var(--accent)] underline decoration-2 underline-offset-4"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }
        hrefLang="fr"
      >
        Français
      </Link>
    </div>
  );
}

/**
 * Reads a <link rel="alternate" hreflang="..."> href from <head>.
 * Returns the URL path (stripping origin) or undefined if not found.
 */
function getHreflangHref(hreflang: string): string | undefined {
  const link = document.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  if (!link) return undefined;
  try {
    const url = new URL(link.href);
    return url.pathname + url.search + url.hash;
  } catch {
    return link.getAttribute("href") ?? undefined;
  }
}
