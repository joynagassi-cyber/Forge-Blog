import type { Metadata } from "next";
import { SearchResults } from "@/components/public/SearchResults";
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale/resolve";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(raw)) return {};
  const locale = raw as Locale;

  return {
    title: locale === "fr" ? "Recherche" : "Search",
    description: locale === "fr"
      ? "Rechercher des articles sur les sciences cognitives et le SOC opérationnel"
      : "Search articles on cognitive science and operational SOC",
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${SITE_URL}/${locale}/search`,
      languages: {
        en: `${SITE_URL}/en/search`,
        fr: `${SITE_URL}/fr/search`,
        "x-default": `${SITE_URL}/en/search`,
      },
    },
  };
}

export default async function SearchPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(raw)) notFound();
  const locale = raw as Locale;
  const t = locale === "fr" ? "Recherche d'articles" : "Article search";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">{t}</h1>
      <SearchResults locale={locale} />
    </div>
  );
}
