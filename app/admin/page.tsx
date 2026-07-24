/**
 * Admin overview — summary dashboard.
 * All navigation links are in the sidebar.
 */
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
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="font-serif text-xl text-[var(--text-primary)]">Tableau de bord</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Choisis une section dans le menu à gauche.</p>
      </div>

      {/* Stats — 4 KPIs compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: useLive ? rows!.length : 0 },
          { label: "Publiés", value: useLive ? rows!.filter(r => r.status === "published").length : 0, cls: "status-published" },
          { label: "En revue", value: useLive ? rows!.filter(r => r.status === "in_review").length : 0, cls: "status-info" },
          { label: "Brouillons", value: useLive ? rows!.filter(r => r.status === "drafting").length : 0, cls: "status-attention" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
            <div className={`text-2xl font-bold tabular-nums ${card.cls ?? ""} text-[var(--text-primary)]`}>
              {card.value}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Health dashboard */}
      {useLive && (
        <section>
          <h2 className="font-semibold mb-3 text-sm text-[var(--text-primary)]">Santé &amp; Scores</h2>
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
