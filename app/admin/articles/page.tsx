import {
  getAdminArticles,
} from "@/lib/supabase/queries";
import {
  DEMO_ARTICLES,
} from "@/lib/content/demo-articles";
import Link from "next/link";

export default async function ArticlesTablePage() {
  // Supabase-first, demo fallback
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  const rows = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        translation_group_id: r.translation_group_id,
        pillar_slug: r.pillar_slug ?? "—",
        status: r.status,
        author: r.author_name ?? "—",
        read_time_minutes: r.read_time_minutes,
      }))
    : DEMO_ARTICLES.map((a) => ({
        id: a.id,
        title: a.title,
        locale: a.locale,
        translation_group_id: a.translation_group_id,
        pillar_slug: a.pillar_slug,
        status: "published" as const,
        author: a.author,
        read_time_minutes: a.read_time_minutes,
      }));

  // Build translation coverage map (group_id → locales present)
  const groupLocales = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = groupLocales.get(r.translation_group_id) ?? new Set();
    set.add(r.locale);
    groupLocales.set(r.translation_group_id, set);
  }

  const statusClass: Record<string, string> = {
    published: "status-published",
    drafting: "status-info",
    in_review: "status-info",
    idea: "status-attention",
    brief_ready: "status-attention",
    changes_requested: "status-attention",
    approved: "status-info",
    scheduled: "status-info",
    updating: "status-attention",
    archived: "status-attention",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Article database</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Naming: [TYPE] Subject | Status ·{" "}
            {useLive ? (
              <span className="status-published">Live data</span>
            ) : (
              <span className="status-attention">Demo data — connect Supabase</span>
            )}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm btn-shimmer"
        >
          Create article
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-1)] text-left">
            <tr>
              {["Title", "Locale", "Translation", "Pillar", "Status", "Author", "Read"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 font-semibold border-b border-[var(--border)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const peers = groupLocales.get(r.translation_group_id) ?? new Set();
              const hasFr = peers.has("fr");
              const hasEn = peers.has("en");
              const translationLabel =
                hasFr && hasEn
                  ? "Complete"
                  : r.locale === "en"
                    ? "Missing FR"
                    : "Missing EN";

              return (
                <tr
                  key={`${r.id}-${r.locale}`}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-1)]"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/articles/${r.id}`}
                      className="text-[var(--accent)] font-medium underline decoration-2 underline-offset-2"
                    >
                      [ARTICLE] {r.title} | {r.status}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 uppercase text-[var(--text-muted)]">
                    {r.locale}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        hasFr && hasEn ? "status-published" : "status-attention"
                      }
                    >
                      {translationLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    {r.pillar_slug}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={statusClass[r.status] ?? "status-info"}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    {r.author}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {r.read_time_minutes}m
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
