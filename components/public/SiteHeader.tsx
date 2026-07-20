import { ForgeLogo } from "@/components/shared/ForgeLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { Locale } from "@/lib/locale/resolve";
import Link from "next/link";

const copy = {
  en: { search: "Search", admin: "Editorial" },
  fr: { search: "Rechercher", admin: "Éditorial" },
};

type Props = {
  locale: Locale;
};

export function SiteHeader({ locale }: Props) {
  const t = copy[locale];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-40">
      {/* Warm accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--accent-warm)]/0 via-[var(--accent-warm)] to-[var(--accent-warm)]/0" />
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <ForgeLogo locale={locale} />

        <nav className="flex items-center gap-4" aria-label="Primary">
          <Link
            href={`/${locale}#search`}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] link-accent hidden sm:inline"
          >
            {t.search}
          </Link>
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
          <Link
            href="/admin"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            {t.admin}
          </Link>
        </nav>
      </div>
    </header>
  );
}
