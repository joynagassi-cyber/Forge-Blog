import { ArticleCard } from "@/components/public/ArticleCard";
import { Button } from "@/components/shared/Button";
import {
  fromArticleRow,
  type PublicArticle,
} from "@/lib/content/public-article";
import { formatLocalizedDate } from "@/lib/locale/format";
import type { Locale } from "@/lib/locale/resolve";
import { PILLARS } from "@/lib/pillars/mapping";
import {
  getPublishedArticles,
} from "@/lib/supabase/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  websiteSchema,
  organizationSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";
const SITE_NAME = "Forge-Blog";
const TAGLINE_EN = "Deep dives into learning, memory, and how knowledge sticks.";
const TAGLINE_FR = "Plongées dans l'apprentissage, la mémoire et la façon dont la connaissance s'ancre.";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") return {};

  const canonical = `${SITE_URL}/${raw}`;

  const title = {
    en: TAGLINE_EN,
    fr: TAGLINE_FR,
  }[raw];

  const fullTitle = `${SITE_NAME} · ${title}`;

  const description = {
    en: TAGLINE_EN,
    fr: TAGLINE_FR,
  }[raw];

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en`,
        fr: `${SITE_URL}/fr`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: fullTitle,
      description: description ?? "",
      locale: raw === "fr" ? "fr_FR" : "en_US",
      alternateLocale: raw === "fr" ? "en_US" : "fr_FR",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description ?? undefined,
      site: "@forge_blog",
    },
  };
}

const copy = {
  en: {
    heroHeadline: "Deep dives into how we learn, think, and build.",
    heroSub: "A blog about cognitive science, learning systems, and the ideas that shape how knowledge sticks.",
    credibility: "Rooted in research, written for clarity.",
    readArticle: "Read the article",
    min: "min read",
    pillarsTitle: "Explore by topic",
    searchPlaceholder: "Search articles…",
    searchLabel: "Search",
    allArticles: "All articles",
    emptyTitle: "Coming soon",
    emptyBody: "Articles are being written. Check back soon for deep dives into learning, memory, and cognitive science.",
  },
  fr: {
    heroHeadline: "Plongées profondes dans la façon dont nous apprenons, pensons et construisons.",
    heroSub: "Un blog sur les sciences cognitives, les systèmes d'apprentissage et les idées qui façonnent la connaissance.",
    credibility: "Enraciné dans la recherche, écrit pour la clarté.",
    readArticle: "Lire l'article",
    min: "min de lecture",
    pillarsTitle: "Explorer par thème",
    searchPlaceholder: "Rechercher des articles…",
    searchLabel: "Recherche",
    allArticles: "Tous les articles",
    emptyTitle: "À venir",
    emptyBody: "Les articles sont en cours d'écriture. Revenez bientôt pour des plongées profondes dans l'apprentissage, la mémoire et les sciences cognitives.",
  },
};

/** Resolve articles from Supabase only. */
async function resolveArticles(locale: Locale): Promise<PublicArticle[]> {
  const rows = await getPublishedArticles(locale);
  if (rows && rows.length > 0) {
    return rows.map((r, i) => fromArticleRow({ ...r, featured: i === 0 }));
  }
  return [];
}

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const t = copy[locale];

  const articles = await resolveArticles(locale);
  const featured = articles.find((a) => a.featured) ?? articles[0];
  const hasArticles = articles.length > 0;

  // JSON-LD structured data
  const canonicalUrl = `${SITE_URL}/${locale}`;
  const ldScripts = jsonLdString([
    organizationSchema(),
    websiteSchema(locale),
  ]);

  return (
    <div>
      {/* JSON-LD structured data */}
      <div
        dangerouslySetInnerHTML={{ __html: ldScripts }}
        className="hidden"
        aria-hidden
      />

      {hasArticles && featured ? (
        <>
          {/* Hero */}
          <section className="border-b border-[var(--border)]">
            <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] leading-tight text-[var(--text-primary)] tracking-tight">
                  {t.heroHeadline}
                </h1>
                <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-prose">
                  {t.heroSub}
                </p>
                <p className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--border-strong)] pl-3">
                  {t.credibility}
                </p>
              </div>

              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden shadow-[var(--shadow)]">
                {featured.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.cover_image_url}
                    alt={featured.cover_image_alt ?? featured.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div
                    className="aspect-[16/9] w-full"
                    style={{ background: featured.cover_gradient }}
                    aria-hidden
                  />
                )}
                <div className="p-6 space-y-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    Featured
                  </p>
                  <h2 className="font-serif text-2xl text-[var(--accent)] leading-snug">
                    <Link
                      href={`/${locale}/article/${featured.slug}`}
                      className="title-shimmer-hover hover:underline decoration-2 underline-offset-4"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {featured.dek}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    <span>
                      {featured.read_time_minutes} {t.min}
                    </span>
                    <time dateTime={featured.published_at}>
                      {formatLocalizedDate(featured.published_at, locale)}
                    </time>
                  </div>
                  <div className="pt-2">
                    <Button
                      href={`/${locale}/article/${featured.slug}`}
                      shimmer
                      size="lg"
                    >
                      {t.readArticle}
                    </Button>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* Search + nav entry */}
          <section id="search" className="mx-auto max-w-6xl px-4 py-8">
            <label className="sr-only" htmlFor="site-search">
              {t.searchLabel}
            </label>
            <input
              id="site-search"
              type="search"
              placeholder={t.searchPlaceholder}
              className="w-full max-w-md rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              title="Press Enter to search"
            />
          </section>

          {/* Pillar clusters */}
          <section className="mx-auto max-w-6xl px-4 pb-16 space-y-14">
            <h2 className="font-serif text-2xl text-[var(--text-primary)]">
              {t.pillarsTitle}
            </h2>

            {PILLARS.map((pillar) => {
              const pillarArticles = articles
                .filter((a) => a.pillar_slug === pillar.slug)
                .slice(0, 4);
              if (pillarArticles.length === 0) return null;
              const name = locale === "fr" ? pillar.name_fr : pillar.name_en;
              const desc =
                locale === "fr" ? pillar.description_fr : pillar.description_en;

              return (
                <div key={pillar.slug} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {desc}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    {pillarArticles.map((a) => (
                      <ArticleCard key={a.id} article={a} locale={locale} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Flat list: articles not already shown in pillar clusters */}
            <div className="pt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-4">
                {t.allArticles}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {(() => {
                  const shownInPillars = new Set<string>();
                  for (const pillar of PILLARS) {
                    const pillarArticles = articles
                      .filter((a) => a.pillar_slug === pillar.slug)
                      .slice(0, 4);
                    for (const a of pillarArticles) {
                      shownInPillars.add(a.id);
                    }
                  }
                  return articles
                    .filter((a) => !shownInPillars.has(a.id))
                    .map((a) => (
                      <ArticleCard key={`all-${a.id}`} article={a} locale={locale} />
                    ));
                })()}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Empty state: no articles yet */
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-3xl px-4 py-24 md:py-32 text-center">
            <h1 className="font-serif text-3xl md:text-4xl leading-tight text-[var(--text-primary)]">
              {t.heroHeadline}
            </h1>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mt-4 max-w-prose mx-auto">
              {t.heroSub}
            </p>
            <p className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--border-strong)] pl-3 mt-6 inline-block text-left">
              {t.credibility}
            </p>
            <div className="mt-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface-1)] p-8 max-w-md mx-auto">
              <h2 className="font-serif text-xl text-[var(--accent)]">
                {t.emptyTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {t.emptyBody}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
