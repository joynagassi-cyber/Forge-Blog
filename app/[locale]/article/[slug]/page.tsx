import { BodyBlocks } from "@/components/public/BlockRenderer";
import { ArticleCard } from "@/components/public/ArticleCard";
import { TableOfContents } from "@/components/public/TableOfContents";
import { ArticleViewTracker } from "@/components/analytics/ArticleViewTracker";
import { ConversionCtaButton } from "@/components/analytics/ConversionCtaButton";
import { extractToc } from "@/lib/blocks/validate";
import {
  getArticle,
  getRelated,
  getTranslation,
} from "@/lib/content/demo-articles";
import type { Locale } from "@/lib/locale/resolve";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (raw !== "en" && raw !== "fr") return {};
  const article = getArticle(raw, slug);
  if (!article) return {};

  const alt = getTranslation(article, raw === "en" ? "fr" : "en");

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `/${raw}/article/${slug}`,
      languages: {
        en: alt && raw === "fr" ? `/en/article/${alt.slug}` : `/en/article/${article.slug}`,
        fr: alt && raw === "en" ? `/fr/article/${alt.slug}` : `/fr/article/${article.slug}`,
        "x-default":
          article.locale === "en"
            ? `/en/article/${article.slug}`
            : alt
              ? `/en/article/${alt.slug}`
              : `/fr/article/${article.slug}`,
      },
    },
  };
}

const copy = {
  en: {
    toc: "On this page",
    takeaway: "At a glance",
    related: "Related articles",
    published: "Published",
    updated: "Updated",
    missingTranslation:
      "This article is not yet available in English. Reading the French version.",
    missingTranslationFr:
      "Cet article n'est pas encore disponible en français. Lecture de la version anglaise.",
    breadcrumbHome: "Home",
  },
  fr: {
    toc: "Sur cette page",
    takeaway: "En un coup d'œil",
    related: "Articles liés",
    published: "Publié",
    updated: "Mis à jour",
    missingTranslation:
      "This article is not yet available in English. Reading the French version.",
    missingTranslationFr:
      "Cet article n'est pas encore disponible en français. Lecture de la version anglaise.",
    breadcrumbHome: "Accueil",
  },
};

export default async function ArticlePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const article = getArticle(locale, slug);
  if (!article) notFound();

  const t = copy[locale];
  const content = article.content;
  const hero = content.sequence.find((b) => b.type === "hero_meta");
  const takeaway = content.sequence.find((b) => b.type === "key_takeaway");
  const body = content.sequence.find((b) => b.type === "body_blocks");
  const conversion = content.sequence.find((b) => b.type === "conversion_block");
  const toc = extractToc(content);
  const related = getRelated(article, 3);
  const other = getTranslation(article, locale === "en" ? "fr" : "en");

  return (
    <>
      <ArticleViewTracker
        slug={article.slug}
        locale={locale}
        pillar={article.pillar_slug}
        title={article.title}
        readTimeMinutes={article.read_time_minutes}
      />

      {!other && (
        <div
          className="border-b border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          role="status"
        >
          {locale === "en"
            ? "This article is not yet available in French."
            : "Cet article n'est pas encore disponible en anglais."}
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
                      {format(new Date(hero.publishedAt), "dd MMM yyyy")}
                    </time>
                  </span>
                  {hero.updatedAt && (
                    <span>
                      {t.updated}{" "}
                      <time dateTime={hero.updatedAt}>
                        {format(new Date(hero.updatedAt), "dd MMM yyyy")}
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
                  <ConversionCtaButton
                    href={conversion.ctaHref}
                    label={conversion.ctaLabel}
                    product={conversion.product}
                    articleSlug={article.slug}
                    locale={locale}
                  />
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
