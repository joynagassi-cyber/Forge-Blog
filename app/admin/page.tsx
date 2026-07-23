import {
  getAdminArticles,
  getAllArticleScores,
} from "@/lib/supabase/queries";
import Link from "next/link";
import { ContentHealthDashboard } from "@/components/admin/ContentHealthDashboard";

const statuses = [
  { key: "published", label: "Published", className: "status-published" },
  { key: "drafting", label: "Drafting", className: "status-attention" },
  { key: "in_review", label: "In review", className: "status-info" },
  { key: "idea", label: "Ideas", className: "status-info" },
];

export default async function AdminOverviewPage() {
  // Supabase data (best-effort)
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  // Article scores from DB (if available)
  const liveScoreMap = useLive ? await getAllArticleScores() : null;

  // Normalize articles for the health dashboard
  const articles = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        status: r.status,
        content: r.content,
        pillar_slug: r.pillar_slug ?? "",
        published_at: r.published_at,
      }))
    : [];

  const total = articles.length;
  const published = articles.filter((a) => a.status === "published").length;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Overview
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            What changed · What needs attention · What is performing · What should happen next
            {!useLive && (
              <span className="ml-2 status-attention">· No articles yet — connect Supabase</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm btn-shimmer"
          >
            Create article
          </Link>
          <Link
            href="/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold px-4 py-2.5 text-sm hover:bg-[var(--surface-2)] transition-colors"
            title="Open blog in new tab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Voir le blog
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total articles", value: total },
          { label: "Published", value: published },
          {
            label: "Complete translations",
            value: 0,
          },
          {
            label: "Missing translations",
            value: 0,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="text-2xl font-semibold tabular-nums">
              {card.value}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status distribution + action queue */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h2 className="font-semibold mb-3">Status distribution</h2>
          <ul className="space-y-2 text-sm">
            {statuses.map((s) => (
              <li key={s.key} className="flex justify-between">
                <span className={s.className}>{s.label}</span>
                <span className="text-[var(--text-muted)] tabular-nums">
                  {articles.filter((a) => a.status === s.key).length}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h2 className="font-semibold mb-3">Prioritized action queue</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-secondary)]">
            <li>Connect Supabase (URL + anon key in .env.local)</li>
            <li>Run migrations in supabase/migrations</li>
            <li>Configure AI providers under Settings</li>
            <li>Write your first article and publish it</li>
          </ol>
        </div>
      </section>

      {/* Content Health Dashboard */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="font-semibold mb-4">Content health &amp; SEO/AEO/GEO scores</h2>
        <ContentHealthDashboard
          articles={articles}
          liveScores={liveScoreMap}
          isLive={useLive}
        />
      </section>
    </div>
  );
}
