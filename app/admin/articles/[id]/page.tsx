import { validateArticleContent } from "@/lib/blocks/validate";
import { getAdminArticle, updateArticleContent } from "@/lib/supabase/queries";
import type { ArticleContent } from "@/lib/blocks/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleEditorClient } from "@/components/admin/ArticleEditorClient";
import { ArticleScoreSummary } from "@/components/admin/ArticleScoreSummary";

async function saveContent(articleId: string, content: ArticleContent) {
  "use server";
  return updateArticleContent(articleId, content);
}

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const liveArticle = await getAdminArticle(id);
  if (!liveArticle) notFound();

  const title = liveArticle.title ?? liveArticle.working_title;
  const locale = liveArticle.locale;
  const pillarSlug = liveArticle.pillar_slug ?? "";
  const author = liveArticle.author_name ?? "—";
  const readTime = liveArticle.read_time_minutes;
  const status = liveArticle.status;
  const slug = liveArticle.slug;
  const content = liveArticle.content;

  const issues = validateArticleContent(content);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
            [ARTICLE] · {locale.toUpperCase()} · {status}
          </p>
          <h1 className="text-2xl font-semibold mt-1">{title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Edit scaffold JSON — changes persist on Save
          </p>
        </div>
        <Link
          href={`/${locale}/article/${slug}`}
          className="text-sm text-[var(--accent)] underline decoration-2 underline-offset-2"
          target="_blank"
        >
          Preview public ↗
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Meta label="Pillar" value={pillarSlug ?? "—"} />
        <Meta label="Author" value={author} />
        <Meta label="Read time" value={`${readTime} min`} />
      </div>

      {/* Scaffold validation */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold">Scaffold validation</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Errors: {errors.length} · Warnings: {warnings.length}
        </p>
        {issues.length === 0 ? (
          <p className="text-sm status-published">Sequence valid.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {issues.map((i) => (
              <li
                key={i.code + (i.path ?? "")}
                className={
                  i.severity === "error" ? "status-error" : "status-attention"
                }
              >
                [{i.severity}] {i.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Content scores */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="font-semibold mb-3">Content scores</h2>
        <ArticleScoreSummary
          article={{
            id,
            title,
            locale,
            status,
            content,
            pillar_slug: pillarSlug ?? "",
            published_at: liveArticle?.published_at ?? null,
          }}
        />
      </section>

      {/* AI pipeline */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold">AI pipeline (gated)</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Three separate calls: brief_generation → draft_generation →
          seo_aeo_geo_audit. Each call requires an active provider in Settings.
          Status never advances past In review without human approval.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Generate brief", task: "ai-brief-generation" },
            { label: "Generate draft", task: "ai-draft-generation" },
            { label: "Run SEO/AEO/GEO audit", task: "ai-seo-aeo-geo-audit" },
          ].map(({ label, task }) => (
            <form
              key={task}
              method="POST"
              action={`/api/admin/ai/${task}`}
            >
              <input type="hidden" name="article_id" value={id} />
              <button
                type="submit"
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                {label}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Inline editor */}
      <section className="rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold mb-4">Editor</h2>
        <ArticleEditorClient
          id={id}
          initial={content}
          isLive={true}
          locale={locale}
          slug={slug}
          onSave={(content) => saveContent(id, content)}
          initialSeo={{
            seo_title: liveArticle?.seo_title ?? "",
            meta_description: liveArticle?.meta_description ?? "",
            canonical_url: liveArticle?.canonical_url ?? "",
            robots: liveArticle?.robots ?? "index,follow",
          }}
        />
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
