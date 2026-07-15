"use client";

import type { Locale } from "@/lib/locale/resolve";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  locale: Locale;
  enHref?: string;
  frHref?: string;
};

/**
 * Derives the peer-locale path from the current URL when explicit hrefs
 * are not provided. For articles with different slugs per locale, pass enHref/frHref.
 */
export function LanguageSwitcher({ locale, enHref, frHref }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const withoutLocale = pathname.replace(/^\/(en|fr)/, "") || "";

  const en = enHref ?? `/en${withoutLocale}`;
  const fr = frHref ?? `/fr${withoutLocale}`;

  return (
    <div
      className="flex items-center gap-1 text-sm"
      role="navigation"
      aria-label="Language"
    >
      <Link
        href={en}
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
        href={fr}
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
