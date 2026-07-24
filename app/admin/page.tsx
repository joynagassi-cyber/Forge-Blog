/**
 * Admin overview page — main dashboard.
 */
import Link from "next/link";
import { ContentHealthDashboard } from "@/components/admin/ContentHealthDashboard";
import {
  getAdminArticles,
  getAllArticleScores,
} from "@/lib/supabase/queries";

type ArticleRow = Awaited<ReturnType<typeof getAdminArticles>>[number];

export default async function AdminOverviewPage() {
  const rows = await getAdminArticles();
  const useLive = rows !== null && rows.length > 0;

  const allScores = useLive ? await getAllArticleScores() : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Tableau de bord</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Aperçu · Articles · Rédaction · Scores
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm hover:bg-[var(--accent)]/90 transition-colors"
        >
          + Nouvel article
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total articles", value: useLive ? rows!.length : 0 },
          { label: "Publiés", value: useLive ? rows!.filter(r => r.status === "published").length : 0 },
          { label: "En révision", value: useLive ? rows!.filter(r => r.status === "in_review").length : 0 },
          { label: "Brouillons", value: useLive ? rows!.filter(r => r.status === "drafting").length : 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5"
          >
            <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
              {card.value}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/admin/articles"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">Tous les articles</div>
        </Link>
        <Link
          href="/admin/articles/calendar"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">Calendrier</div>
        </Link>
        <Link
          href="/admin/reviews"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">Reviews</div>
        </Link>
        <Link
          href="/admin/analytics"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">Analytics</div>
        </Link>
        <Link
          href="/admin/settings/ai"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">IA Providers</div>
        </Link>
        <a
          href="/fr"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-center hover:border-[var(--accent)] transition-colors"
        >
          <div className="text-sm font-medium text-[var(--text-primary)]">Voir le blog ↗</div>
        </a>
      </div>

      {/* Health Dashboard */}
      {useLive && (
        <section>
          <h2 className="font-semibold text-lg mb-4">Santé du contenu &amp; Scores SEO/AEO/GEO</h2>
          <ContentHealthDashboard
            articles={rows!.map((r) => ({
              id: r.id,
              title: r.title ?? r.working_title,
              locale: r.locale,
              status: r.status,
              content: r.content,
              pillar_slug: r.pillar_slug ?? "",
              published_at: r.published_at,
            }))}
            liveScores={allScores}
            isLive={true}
          />
        </section>
      )}

      {!useLive && (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Aucune donnée dans Supabase. Connecte d'abord ta base de données.
          </p>
        </div>
      )}
    </div>
  );
}
