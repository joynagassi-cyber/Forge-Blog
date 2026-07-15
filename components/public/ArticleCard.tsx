import type { DemoArticle } from "@/lib/content/demo-articles";
import type { Locale } from "@/lib/locale/resolve";
import { getPillar } from "@/lib/pillars/mapping";
import { format } from "date-fns";
import Link from "next/link";

type Props = {
  article: DemoArticle;
  locale: Locale;
};

export function ArticleCard({ article, locale }: Props) {
  const pillar = getPillar(article.pillar_slug);
  const pillarName =
    locale === "fr" ? pillar?.name_fr : pillar?.name_en;

  return (
    <Link
      href={`/${locale}/article/${article.slug}`}
      className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <div
        className="aspect-video w-full"
        style={{ background: article.cover_gradient }}
        aria-hidden
      />
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-serif text-lg leading-snug text-[var(--accent)] line-clamp-2 group-hover:underline decoration-2 underline-offset-4 title-shimmer-hover">
          {article.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
          {article.excerpt}
        </p>
        <div className="mt-auto pt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
          {pillarName && <span>{pillarName}</span>}
          <span>{article.read_time_minutes} min</span>
          <time dateTime={article.published_at}>
            {format(new Date(article.published_at), "dd MMM yyyy")}
          </time>
          <span>{article.author}</span>
        </div>
      </div>
    </Link>
  );
}
