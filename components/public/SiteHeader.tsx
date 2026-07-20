import { ForgeLogo } from "@/components/shared/ForgeLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { Locale } from "@/lib/locale/resolve";
import Link from "next/link";

const copy = {
  en: { articles: "Articles", about: "About" },
  fr: { articles: "Articles", about: "À propos" },
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

        <nav className="flex items-center gap-5" aria-label="Primary">
          <Link
            href={`/${locale}`}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            {t.articles}
          </Link>
          <Link
            href={`/${locale}/a-propos`}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            {t.about}
          </Link>
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
