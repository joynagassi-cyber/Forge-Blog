/**
 * Admin overview — main dashboard page.
 */
import Link from "next/link";
import { ContentHealthDashboard } from "@/components/admin/ContentHealthDashboard";
import {
  getAdminArticles,
  getAllArticleScores,
} from "@/lib/supabase/queries";

export default async function AdminOverviewPage() {
  const rows = await getAdminArticles();
  const useLive = rows !== null && rows.length > 0;
  const allScores = useLive ? await getAllArticleScores() : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats row — 4 KPI cards, compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: useLive ? rows!.length : 0 },
          { label: "Publiés", value: useLive ? rows!.filter(r => r.status === "published").length : 0, status: "status-published" },
          { label: "En revue", value: useLive ? rows!.filter(r => r.status === "in_review").length : 0, status: "status-info" },
          { label: "Brouillons", value: useLive ? rows!.filter(r => r.status === "drafting").length : 0, status: "status-attention" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <div className={`text-2xl font-bold tabular-nums ${card.status ? `!${card.status}` : ""} text-[var(--text-primary)]`}>
              {card.value}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions — 3-column responsive grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: "/admin/articles", label: "Gérer les articles", icon: "article" },
          { href: "/admin/reviews", label: "Reviews & scores", icon: "review" },
          { href: "/admin/analytics", label: "Analytics", icon: "chart" },
          { href: "/admin/settings/ai", label: "IA Providers", icon: "settings" },
          { href: "/fr", label: "Voir le blog", icon: "external", external: true },
        ].map((action) => (
          action.external ? (
            <a
              key={action.href}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors"
            >
              {action.icon === "external" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              )}
              {action.label}
            </a>
          ) : (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors"
            >
              {action.label}
            </Link>
          )
        ))}
      </div>

      {/* Content health dashboard — only when data exists */}
      {useLive && (
        <section>
          <h2 className="font-semibold mb-3 text-[var(--text-primary)]">Santé du contenu &amp; Scores</h2>
          <ContentHealthDashboard
            articles={rows!.map((r) => ({
              id: r.id, title: r.title ?? r.working_title, locale: r.locale,
              status: r.status, content: r.content, pillar_slug: r.pillar_slug ?? "",
              published_at: r.published_at,
            }))}
            liveScores={allScores}
            isLive={true}
          />
        </section>
      )}

      {!useLive && (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Aucun article. Connecte Supabase pour commencer.</p>
        </div>
      )}
    </div>
  );
}
