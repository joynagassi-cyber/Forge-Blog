import { getAdminArticles } from "@/lib/supabase/queries";
import Link from "next/link";

export default async function ReviewsPage() {
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  const rows = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        status: r.status,
        pillar_slug: r.pillar_slug ?? "",
      }))
    : [];

  const inReview = rows.filter((r) => r.status === "in_review");
  const changesRequested = rows.filter((r) => r.status === "changes_requested");
  const approved = rows.filter((r) => r.status === "approved");
  const drafting = rows.filter((r) => r.status === "drafting");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Review workflow</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Articles in review pipeline
          {!useLive && (
            <span className="ml-2 status-attention">· No articles yet</span>
          )}
        </p>
      </div>

      {/* Kanban-style columns */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Drafting",
            items: drafting,
            color: "border-t-amber-500",
            empty: "No articles in drafting.",
          },
          {
            title: "In review",
            items: inReview,
            color: "border-t-blue-500",
            empty: "No articles in review.",
          },
          {
            title: "Changes requested",
            items: changesRequested,
            color: "border-t-red-500",
            empty: "No changes requested.",
          },
          {
            title: "Approved",
            items: approved,
            color: "border-t-emerald-500",
            empty: "No approved articles.",
          },
        ].map((column) => (
          <div
            key={column.title}
            className={`rounded-lg border border-[var(--border)] bg-[var(--surface-1)] border-t-2 ${column.color}`}
          >
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-semibold text-sm">{column.title}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {column.items.length} article{column.items.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-3 space-y-2 min-h-[120px]">
              {column.items.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">
                  {column.empty}
                </p>
              ) : (
                column.items.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/articles/${a.id}`}
                    className="block rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                      <span className="uppercase">{a.locale}</span>
                      <span>·</span>
                      <span>{a.pillar_slug}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
