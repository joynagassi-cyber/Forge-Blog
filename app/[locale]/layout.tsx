import { SiteHeader } from "@/components/public/SiteHeader";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale/resolve";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

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
      <footer className="border-t border-[var(--border)] mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--text-muted)] flex flex-col sm:flex-row gap-2 sm:justify-between">
          <span>Forge-Blog · NainoForge & SCYForge</span>
          <span>
            {locale === "fr"
              ? "Contenu rédigé par les équipes produit."
              : "Written by the product teams."}
          </span>
        </div>
      </footer>
    </>
  );
}
