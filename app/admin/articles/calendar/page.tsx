import { getAdminArticles } from "@/lib/supabase/queries";
import { EditorialCalendar } from "@/components/admin/EditorialCalendar";
import type { CalendarArticle } from "@/components/admin/EditorialCalendar";

export default async function CalendarPage() {
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  const articles: CalendarArticle[] = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        status: r.status,
        pillar_slug: r.pillar_slug ?? "",
        scheduled_at: r.scheduled_at,
        published_at: r.published_at,
        cover_image_url: r.cover_image_url,
      }))
    : [];

  // Stats for the period
  const totalPublished = articles.filter((a) => a.status === "published").length;
  const totalScheduled = articles.filter((a) => a.status === "scheduled").length;
  const totalDrafting = articles.filter((a) => a.status === "drafting" || a.status === "in_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editorial calendar</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Planned, in-progress, and published articles across the content pipeline
          {!useLive && (
            <span className="ml-2 status-attention">· No articles yet — connect Supabase</span>
          )}
        </p>
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Published", value: totalPublished, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Scheduled", value: totalScheduled, color: "text-blue-600 dark:text-blue-400" },
          { label: "In pipeline", value: totalDrafting, color: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className={`text-2xl font-semibold tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <EditorialCalendar articles={articles} />
      </section>
    </div>
  );
}
