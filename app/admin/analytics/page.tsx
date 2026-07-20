import { getAdminArticles } from "@/lib/supabase/queries";
import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import type { AnalyticsArticle } from "@/components/admin/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  const articles: AnalyticsArticle[] = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        status: r.status,
        pillar_slug: r.pillar_slug ?? "uncategorized",
        published_at: r.published_at,
        read_time_minutes: r.read_time_minutes,
        content: r.content,
      }))
    : DEMO_ARTICLES.map((a) => ({
        id: a.id,
        title: a.title,
        locale: a.locale,
        status: "published",
        pillar_slug: a.pillar_slug,
        published_at: a.published_at,
        read_time_minutes: a.read_time_minutes,
        content: a.content,
      }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance &amp; analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Views, reads, CTA conversions, and engagement metrics
          {!useLive && (
            <span className="ml-2 status-attention">· Demo data — connect PostHog</span>
          )}
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <AnalyticsDashboard articles={articles} isLive={useLive} />
      </section>
    </div>
  );
}
