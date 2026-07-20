import { ArticleCard } from "@/components/public/ArticleCard";
import { Button } from "@/components/shared/Button";
import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import {
  fromArticleRow,
  fromDemoArticle,
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
const TAGLINE_EN = "Sciences de l'apprentissage · Comprendre comment le cerveau apprend, retient et connecte les idées.";
const TAGLINE_FR = "Sciences de l'apprentissage · Comprendre comment le cerveau apprend, retient et connecte les idées.";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") return {};

  const canonical = `${SITE_URL}/${raw}`;

  const title = {
    en: `Sciences de l'apprentissage`,
    fr: `Sciences de l'apprentissage`,
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
      site: "@nainoforge",
    },
  };
}

const copy = {
  en: {
    heroHeadline: "Master what you learn. Make your SOC ready faster.",
    heroSub:
      "Deep writing on memory science and operational cyber from the teams building NainoForge and SCYForge.",
    credibility:
      "Grounded in real cognitive science and real SOC operations, not recycled listicles.",
    readArticle: "Read the article",
    min: "min read",
    pillarsTitle: "Explore by pillar",
    softBridgeTitle: "From reading to practice",
    softBridgeBody:
      "Articles here are designed to change how you learn or how you train a SOC, then point to the tool that makes that next step concrete.",
    nainoCta: "Try NainoForge",
    scyCta: "Request a SCYForge demo",
    searchPlaceholder: "Search articles…",
    searchLabel: "Search",
    allArticles: "All articles",
  },
  fr: {
    heroHeadline: "Maîtrisez ce que vous apprenez. Accélérez la readiness SOC.",
    heroSub:
      "Écrits de fond sur la mémoire et le cyber opérationnel, par les équipes de NainoForge et SCYForge.",
    credibility:
      "Ancré dans les sciences cognitives et les opérations SOC réelles, pas dans des listicles recyclés.",
    readArticle: "Lire l'article",
    min: "min de lecture",
    pillarsTitle: "Explorer par pilier",
    softBridgeTitle: "De la lecture à la pratique",
    softBridgeBody:
      "Chaque article vise à changer votre façon d'apprendre ou de former un SOC, puis pointe vers l'outil qui rend la suite concrète.",
    nainoCta: "Essayer NainoForge",
    scyCta: "Demander une démo SCYForge",
    searchPlaceholder: "Rechercher des articles…",
    searchLabel: "Recherche",
    allArticles: "Tous les articles",
  },
};

/** Resolve articles: Supabase if available, demo fallback otherwise. */
async function resolveArticles(locale: Locale): Promise<PublicArticle[]> {
  const rows = await getPublishedArticles(locale);
  if (rows && rows.length > 0) {
    return rows.map((r, i) => fromArticleRow({ ...r, featured: i === 0 }));
  }
  // Demo fallback — Supabase not connected or no published articles yet.
  const demo = DEMO_ARTICLES.filter((a) => a.locale === locale);
  return demo.map(fromDemoArticle);
}

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const t = copy[locale];

  const articles = await resolveArticles(locale);
  const featured = articles.find((a) => a.featured) ?? articles[0];

  if (!featured) notFound();

  // JSON-LD structured data
  const canonicalUrl = `${SITE_URL}/${locale}`;
  const ldScripts = jsonLdString([
    organizationSchema(),
    websiteSchema(locale),  // search action omitted — full-text search not yet implemented
  ]);

  return (
    <div>
      {/* JSON-LD structured data */}
      <div
        dangerouslySetInnerHTML={{ __html: ldScripts }}
        className="hidden"
        aria-hidden
      />

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
              // Collect article IDs already shown in pillar clusters
              const shownInPillars = new Set<string>();
              for (const pillar of PILLARS) {
                const pillarArticles = articles
                  .filter((a) => a.pillar_slug === pillar.slug)
                  .slice(0, 4);
                for (const a of pillarArticles) {
                  shownInPillars.add(a.id);
                }
              }
              // Only show articles not already shown above
              return articles
                .filter((a) => !shownInPillars.has(a.id))
                .map((a) => (
                  <ArticleCard key={`all-${a.id}`} article={a} locale={locale} />
                ));
            })()}
          </div>
        </div>
      </section>

      {/* Soft product bridge */}
      <section className="border-t border-[var(--border)] bg-[var(--surface-1)]">
        <div className="mx-auto max-w-6xl px-4 py-12 flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="font-serif text-xl text-[var(--text-primary)]">
              {t.softBridgeTitle}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.softBridgeBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="https://nainoforge.com" shimmer>
              {t.nainoCta}
            </Button>
            <Button href="https://scyforge.com" variant="secondary">
              {t.scyCta}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
