import type { ArticleContent } from "@/lib/blocks/types";
import type { Locale } from "@/lib/locale/resolve";

export type DemoArticle = {
  id: string;
  slug: string;
  locale: Locale;
  translation_group_id: string;
  title: string;
  dek: string;
  excerpt: string;
  pillar_slug: string;
  author: string;
  author_bio: string;
  published_at: string;
  updated_at: string;
  read_time_minutes: number;
  cover_gradient: string;
  featured?: boolean;
  content: ArticleContent;
};

/** @deprecated All demo articles have been removed. Kept for type compatibility. */
export const DEMO_ARTICLES: DemoArticle[] = [];

export function getArticles(locale: Locale): DemoArticle[] {
  return DEMO_ARTICLES.filter((a) => a.locale === locale);
}

export function getArticle(
  locale: Locale,
  slug: string
): DemoArticle | undefined {
  return DEMO_ARTICLES.find((a) => a.locale === locale && a.slug === slug);
}

export function getFeatured(locale: Locale): DemoArticle | undefined {
  return (
    getArticles(locale).find((a) => a.featured) ?? getArticles(locale)[0]
  );
}

export function getRelated(
  article: DemoArticle,
  limit = 3
): DemoArticle[] {
  return getArticles(article.locale)
    .filter(
      (a) =>
        a.id !== article.id &&
        (a.pillar_slug === article.pillar_slug ||
          a.translation_group_id !== article.translation_group_id)
    )
    .slice(0, limit);
}

export function getTranslation(
  article: DemoArticle,
  targetLocale: Locale
): DemoArticle | undefined {
  return DEMO_ARTICLES.find(
    (a) =>
      a.translation_group_id === article.translation_group_id &&
      a.locale === targetLocale
  );
}

export function articlesByPillar(
  locale: Locale,
  pillarSlug: string
): DemoArticle[] {
  return getArticles(locale).filter((a) => a.pillar_slug === pillarSlug);
}

export function getTranslationCoverage() {
  const groups = new Map<string, DemoArticle[]>();

  for (const article of DEMO_ARTICLES) {
    const current = groups.get(article.translation_group_id) ?? [];
    current.push(article);
    groups.set(article.translation_group_id, current);
  }

  let completeGroups = 0;
  let missingEn = 0;
  let missingFr = 0;

  for (const articles of groups.values()) {
    const hasEn = articles.some((article) => article.locale === "en");
    const hasFr = articles.some((article) => article.locale === "fr");

    if (hasEn && hasFr) {
      completeGroups += 1;
      continue;
    }

    if (hasEn) missingFr += 1;
    if (hasFr) missingEn += 1;
  }

  return {
    totalGroups: groups.size,
    completeGroups,
    missingEn,
    missingFr,
  };
}
