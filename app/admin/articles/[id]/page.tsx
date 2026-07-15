import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import { validateArticleContent } from "@/lib/blocks/validate";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = DEMO_ARTICLES.find((a) => a.id === id);
  if (!article) notFound();

  const issues = validateArticleContent(article.content);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
            [ARTICLE] · {article.locale.toUpperCase()} · Published
          </p>
          <h1 className="text-2xl font-semibold mt-1">{article.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            BlockNote editor shell · content stored as section 10 scaffold JSON
          </p>
        </div>
        <Link
          href={`/${article.locale}/article/${article.slug}`}
          className="text-sm text-[var(--accent)] underline decoration-2 underline-offset-2"
        >
          Preview public
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Meta label="Pillar" value={article.pillar_slug} />
        <Meta label="Author" value={article.author} />
        <Meta label="Read time" value={`${article.read_time_minutes} min`} />
      </div>

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

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold">AI pipeline (gated)</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Three separate calls: brief_generation · draft_generation ·
          seo_aeo_geo_audit. Nothing past In review without human approval.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Generate brief", "Generate draft", "Run SEO/AEO/GEO audit"].map(
            (label) => (
              <button
                key={label}
                type="button"
                disabled
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)]"
                title="Requires AI provider configuration"
              >
                {label}
              </button>
            )
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold mb-3">Content JSON (read-only demo)</h2>
        <pre className="text-xs overflow-x-auto max-h-96 bg-[var(--surface-2)] p-4 rounded-md font-mono">
          {JSON.stringify(article.content, null, 2)}
        </pre>
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
