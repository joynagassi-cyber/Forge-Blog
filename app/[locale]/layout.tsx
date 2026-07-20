import { SiteHeader } from "@/components/public/SiteHeader";
import { ForgeLogo } from "@/components/shared/ForgeLogo";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale/resolve";
import { notFound } from "next/navigation";
import Link from "next/link";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const footerCopy = {
  en: { articles: "Articles", about: "About", scyforge: "SCYForge" },
  fr: { articles: "Articles", about: "À propos", scyforge: "SCYForge" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    notFound();
  }
  const locale = raw as Locale;
  const f = footerCopy[locale];

  return (
    <>
      {/* Skip-to-content link — first focusable element for keyboard users */}
      <a
        href="#main-content"
        className="skip-link"
      >
        {locale === "fr" ? "Aller au contenu" : "Skip to content"}
      </a>
      <SiteHeader locale={locale} />
      <main id="main-content" className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-16">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <ForgeLogo locale={locale} variant="footer" />
              <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs leading-relaxed">
                {locale === "fr"
                  ? "Sciences cognitives, sans jargon."
                  : "Cognitive science, without the jargon."}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                {locale === "fr" ? "Navigation" : "Navigate"}
              </h4>
              <nav className="flex flex-col gap-2" aria-label="Footer">
                <Link
                  href={`/${locale}`}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {f.articles}
                </Link>
                <Link
                  href={`/${locale}/a-propos`}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {f.about}
                </Link>
                <Link
                  href={`/${locale}/scyforge`}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {f.scyforge}
                </Link>
              </nav>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                {locale === "fr" ? "Produit" : "Product"}
              </h4>
              <a
                href="https://nainoforge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                NainoForge
              </a>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {locale === "fr"
                  ? "Extension navigateur pour l'apprentissage"
                  : "Browser extension for learning"}
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row gap-2 sm:justify-between text-xs text-[var(--text-muted)]">
            <span>Forge-Blog &middot; 2026</span>
            <span>
              {locale === "fr"
                ? "Écrit par les équipes Forge."
                : "Written by the Forge team."}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
