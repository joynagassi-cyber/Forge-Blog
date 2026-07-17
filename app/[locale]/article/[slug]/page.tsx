import { BodyBlocks } from "@/components/public/BlockRenderer";
import { ArticleCard } from "@/components/public/ArticleCard";
import { TableOfContents } from "@/components/public/TableOfContents";
import { Button } from "@/components/shared/Button";
import { captureCtaClick } from "@/components/shared/PostHogProvider";
import { extractToc } from "@/lib/blocks/validate";
import {
  DEMO_ARTICLES,
  getArticle as getDemoArticle,
} from "@/lib/content/demo-articles";
import {
  fromArticleRow,
  fromDemoArticle,
  type PublicArticle,
} from "@/lib/content/public-article";
import { formatLocalizedDate } from "@/lib/locale/format";
import type { Locale } from "@/lib/locale/resolve";
import {
  getPublishedArticle,
  getRelatedArticles,
  getTranslationCounterpart,
} from "@/lib/supabase/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ---------------------------------------------------------------------------
// Data resolution helpers (Supabase-first, demo fallback)
// ---------------------------------------------------------------------------

async function resolveArticle(
  locale: Locale,
  slug: string
): Promise<PublicArticle | null> {
  const row = await getPublishedArticle(locale, slug);
  if (row) return fromArticleRow(row);

  const demo = getDemoArticle(locale, slug);
  return demo ? fromDemoArticle(demo) : null;
}

async function resolveTranslation(
  article: PublicArticle,
  targetLocale: Locale
): Promise<PublicArticle | null> {
  const row = await getTranslationCounterpart(
    article.translation_group_id,
    targetLocale
  );
  if (row) return fromArticleRow(row);

  // Demo fallback
  const demo = DEMO_ARTICLES.find(
    (a) =>
      a.translation_group_id === article.translation_group_id &&
      a.locale === targetLocale
  );
  return demo ? fromDemoArticle(demo) : null;
}

async function resolveRelated(
  article: PublicArticle,
  locale: Locale
): Promise<PublicArticle[]> {
  const rows = await getRelatedArticles(
    article.id,
    article.pillar_slug || null,
    locale,
    3
  );
  if (rows.length > 0) return rows.map(fromArticleRow);

  // Demo fallback
  const demo = DEMO_ARTICLES.filter(
    (a) =>
      a.locale === locale &&
      a.id !== article.id &&
      a.pillar_slug === article.pillar_slug
  ).slice(0, 3);
  return demo.map(fromDemoArticle);
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (raw !== "en" && raw !== "fr") return {};
  const locale = raw as Locale;

  const article = await resolveArticle(locale, slug);
  if (!article) return {};

  const alt = await resolveTranslation(
    article,
    locale === "en" ? "fr" : "en"
  );
  // x-default always points to the English canonical (primary beachhead, section 8.2).
  const enVersion = locale === "en" ? article : alt ?? article;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `${SITE_URL}/${locale}/article/${slug}`,
      languages: {
        [locale]: `${SITE_URL}/${locale}/article/${article.slug}`,
        ...(alt
          ? { [alt.locale]: `${SITE_URL}/${alt.locale}/article/${alt.slug}` }
          : {}),
        "x-default": `${SITE_URL}/en/article/${enVersion.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${locale}/article/${slug}`,
      title: article.title,
      description: article.excerpt ?? undefined,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
      siteName: "Forge-Blog",
    },
  };
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const copy = {
  en: {
    toc: "On this page",
    takeaway: "At a glance",
    related: "Related articles",
    published: "Published",
    updated: "Updated",
    breadcrumbHome: "Home",
    missingLang: "This article is not yet available in French.",
    missingLangFr: "Cet article n'est pas encore disponible en anglais.",
  },
  fr: {
    toc: "Sur cette page",
    takeaway: "En un coup d'œil",
    related: "Articles liés",
    published: "Publié",
    updated: "Mis à jour",
    breadcrumbHome: "Accueil",
    missingLang: "Cet article n'est pas encore disponible en français.",
    missingLangFr: "This article is not yet available in English.",
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ArticlePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;

  const article = await resolveArticle(locale, slug);
  if (!article) notFound();

  const t = copy[locale];
  const content = article.content;
  const hero = content.sequence.find((b) => b.type === "hero_meta");
  const takeaway = content.sequence.find((b) => b.type === "key_takeaway");
  const body = content.sequence.find((b) => b.type === "body_blocks");
  const conversion = content.sequence.find((b) => b.type === "conversion_block");
  const ctaProduct =
    conversion && conversion.type === "conversion_block" && conversion.product !== "none"
      ? conversion.product
      : null;
  const toc = extractToc(content);
  const related = await resolveRelated(article, locale);
  const other = await resolveTranslation(article, locale === "en" ? "fr" : "en");

  return (
    <>
      {!other && (
        <div
          className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          role="status"
        >
          {locale === "en" ? t.missingLang : t.missingLangFr}
        </div>
      )}

      <article className="mx-auto max-w-6xl px-4 py-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-sm text-[var(--text-muted)] mb-6 flex flex-wrap gap-1"
        >
          <Link href={`/${locale}`} className="hover:text-[var(--accent)]">
            {t.breadcrumbHome}
          </Link>
          <span aria-hidden>/</span>
          <span>{hero && "pillarName" in hero ? hero.pillarName : ""}</span>
          <span aria-hidden>/</span>
          <span className="text-[var(--text-secondary)] line-clamp-1">
            {article.title}
          </span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_220px] gap-10">
          <div>
            {hero && hero.type === "hero_meta" && (
              <header className="mb-8 space-y-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  {hero.pillarName}
                </p>
                <h1 className="font-serif text-3xl md:text-4xl text-[var(--accent)] leading-tight title-shimmer-hover">
                  {hero.title}
                </h1>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-prose">
                  {hero.dek}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)] pt-1">
                  <span>{hero.author}</span>
                  <span>
                    {t.published}{" "}
                    <time dateTime={hero.publishedAt}>
                      {formatLocalizedDate(hero.publishedAt, locale)}
                    </time>
                  </span>
                  {hero.updatedAt && (
                    <span>
                      {t.updated}{" "}
                      <time dateTime={hero.updatedAt}>
                        {formatLocalizedDate(hero.updatedAt, locale)}
                      </time>
                    </span>
                  )}
                  <span>{hero.readTimeMinutes} min</span>
                </div>
                {hero.authorBio && (
                  <p className="text-sm text-[var(--text-muted)] border-l-2 border-[var(--border)] pl-3 max-w-prose">
                    {hero.authorBio}
                  </p>
                )}
              </header>
            )}

            {takeaway &&
              takeaway.type === "key_takeaway" &&
              !takeaway.skipped &&
              takeaway.items.length > 0 && (
                <aside className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                    {t.takeaway}
                  </h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-primary)] text-sm leading-relaxed">
                    {takeaway.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </aside>
              )}

            <TableOfContents items={toc} label={t.toc} />

            <div className="article-prose mt-2">
              {body && body.type === "body_blocks" && (
                <BodyBlocks blocks={body.blocks} />
              )}
            </div>

            {conversion &&
              conversion.type === "conversion_block" &&
              conversion.product !== "none" && (
                <aside className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 md:p-8 space-y-3">
                  <h2 className="font-serif text-xl text-[var(--text-primary)]">
                    {conversion.headline}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-prose">
                    {conversion.body}
                  </p>
                  <Button
                    href={conversion.ctaHref}
                    shimmer
                    size="lg"
                    onClick={() =>
                      ctaProduct
                        ? captureCtaClick(ctaProduct, {
                            article_slug: article.slug,
                            article_locale: locale,
                            cta_label: conversion.ctaLabel,
                          })
                        : undefined
                    }
                  >
                    {conversion.ctaLabel}
                  </Button>
                </aside>
              )}

            {related.length > 0 && (
              <section className="mt-14 space-y-4">
                <h2 className="font-serif text-xl text-[var(--text-primary)]">
                  {t.related}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} locale={locale} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <TableOfContents items={toc} label={t.toc} />
          </aside>
        </div>
      </article>
    </>
  );
}
