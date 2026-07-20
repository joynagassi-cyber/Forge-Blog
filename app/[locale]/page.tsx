import { ArticleCard } from "@/components/public/ArticleCard";
import { Button } from "@/components/shared/Button";
import {
  fromArticleRow,
  fromDemoArticle,
  type PublicArticle,
} from "@/lib/content/public-article";
import { getArticles } from "@/lib/content/demo-articles";
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

type Props = { params: Promise<{ locale: string }> };

const copy = {
  en: {
    eyebrow: "Cognitive science, without the jargon",
    headline: "You read, you highlight, you forget half.",
    sub: "Here we explain what actually helps to memorize, understand, and retain — for anyone curious about learning better.",
    readArticle: "Read the article",
    min: "min read",
    kicker: "Featured",
    allArticlesTitle: "All articles",
    allArticlesSub: "Every article is written to be tested, not just read.",
    seeAll: "See all articles",
    emptyTitle: "Coming soon",
    emptyBody: "The first article is being written. Check back soon for deep dives into learning, memory, and cognitive science.",
  },
  fr: {
    eyebrow: "Sciences cognitives, sans jargon",
    headline: "Vous lisez, vous surlignez, vous oubliez la moitié.",
    sub: "Ici, on explique simplement ce qui aide vraiment à mémoriser, comprendre et retenir, pour toute personne curieuse d'apprendre mieux.",
    readArticle: "Lire l'article",
    min: "min de lecture",
    kicker: "À la une",
    allArticlesTitle: "Tous les articles",
    allArticlesSub: "Chaque article est écrit pour être testé, pas juste lu.",
    seeAll: "Voir tous les articles",
    emptyTitle: "À venir",
    emptyBody: "Le premier article est en cours d'écriture. Revenez bientôt pour des explorations de l'apprentissage, de la mémoire et des sciences cognitives.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") return {};

  const t = copy[raw];
  const canonical = `${SITE_URL}/${raw}`;

  return {
    title: t.eyebrow,
    description: t.sub,
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
      title: `${SITE_NAME} · ${t.eyebrow}`,
      description: t.sub,
      locale: raw === "fr" ? "fr_FR" : "en_US",
      alternateLocale: raw === "fr" ? "en_US" : "fr_FR",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} · ${t.eyebrow}`,
      description: t.sub,
      site: "@forge_blog",
    },
  };
}

async function resolveArticles(locale: Locale): Promise<PublicArticle[]> {
  const rows = await getPublishedArticles(locale);
  if (rows && rows.length > 0) {
    return rows.map((r, i) => fromArticleRow({ ...r, featured: i === 0 }));
  }
  // Fallback: featured article(s) from content library
  const demos = getArticles(locale);
  if (demos.length > 0) return demos.map(fromDemoArticle);
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

      {/* ── Section 1: Hero ── */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 md:py-28 text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--accent-warm)] mb-5 font-semibold">
            {t.eyebrow}
          </p>
          <h1 className="font-serif text-3xl leading-tight md:text-[3rem] lg:text-[3.5rem] text-[var(--text-primary)] tracking-tight">
            {t.headline}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed mt-5 max-w-prose mx-auto">
            {t.sub}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {hasArticles && featured ? (
              <Button
                href={`/${locale}/article/${featured.slug}`}
                shimmer
                size="lg"
              >
                {locale === "en" ? "Read an article" : "Lire un article"}
              </Button>
            ) : (
              <Button disabled size="lg">
                {locale === "en" ? "Read an article" : "Lire un article"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Featured article ── */}
      {hasArticles && featured ? (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            {/* Kicker */}
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent-warm)] mb-6 font-semibold">
              {t.kicker}
            </p>

            <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
              {/* Cover image / gradient */}
              <div className="md:col-span-3">
                {featured.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.cover_image_url}
                    alt={featured.cover_image_alt ?? featured.title}
                    className="w-full aspect-[4/3] rounded-xl object-cover shadow-[var(--shadow)]"
                  />
                ) : (
                  <div
                    className="w-full aspect-[4/3] rounded-xl shadow-[var(--shadow)]"
                    style={{ background: featured.cover_gradient }}
                    aria-hidden
                  />
                )}
              </div>

              {/* Article info */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="font-serif text-2xl md:text-3xl leading-snug text-[var(--text-primary)] tracking-tight">
                  <Link
                    href={`/${locale}/article/${featured.slug}`}
                    className="hover:text-[var(--accent)] transition-colors decoration-2 underline-offset-4 title-shimmer-hover"
                  >
                    {featured.title}
                  </Link>
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {featured.dek}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span>{featured.read_time_minutes} {t.min}</span>
                  {featured.pillar_slug && (
                    <span>
                      {PILLARS.find((p) => p.slug === featured.pillar_slug)
                        ? locale === "fr"
                          ? PILLARS.find((p) => p.slug === featured.pillar_slug)?.name_fr
                          : PILLARS.find((p) => p.slug === featured.pillar_slug)?.name_en
                        : null}
                    </span>
                  )}
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
            </div>
          </div>
        </section>
      ) : (
        /* ── Empty state ── */
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center">
            <div className="border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface-1)] p-10 max-w-md mx-auto">
              <h2 className="font-serif text-xl text-[var(--text-primary)]">
                {t.emptyTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
                {t.emptyBody}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: All articles ── */}
      {hasArticles && (
        <section className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 space-y-8">
            <div className="max-w-md">
              <h2 className="font-serif text-2xl md:text-[1.75rem] text-[var(--text-primary)] tracking-tight">
                {t.allArticlesTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                {t.allArticlesSub}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} locale={locale} />
              ))}
            </div>

            <div className="pt-2">
              <Button variant="secondary" href={`/${locale}/articles`}>
                {t.seeAll}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
