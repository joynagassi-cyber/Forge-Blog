import {
  getAdminArticles,
} from "@/lib/supabase/queries";
import Link from "next/link";
import { ArticlesTable } from "@/components/admin/ArticlesTable";
import type { ArticleRow } from "@/components/admin/ArticlesTable";

export default async function ArticlesTablePage() {
  const liveRows = await getAdminArticles();
  const useLive = liveRows !== null && liveRows.length > 0;

  const rows: ArticleRow[] = useLive
    ? liveRows!.map((r) => ({
        id: r.id,
        title: r.title ?? r.working_title,
        locale: r.locale,
        translation_group_id: r.translation_group_id,
        pillar_slug: r.pillar_slug ?? "—",
        status: r.status,
        author: r.author_name ?? "—",
        read_time_minutes: r.read_time_minutes,
        cover_image_url: r.cover_image_url,
        cover_image_alt: r.cover_image_alt,
        published_at: r.published_at,
        last_updated_at: r.last_updated_at,
      }))
    : [];

  // Build translation coverage map (group_id → locales present)
  const groupLocales = new Map<string, Set<string>>();
  for (const r of rows) {
    const set = groupLocales.get(r.translation_group_id) ?? new Set();
    set.add(r.locale);
    groupLocales.set(r.translation_group_id, set);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Article database</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Search, filter, and sort your articles ·
            {useLive ? (
              <span className="ml-1 status-published">Live data</span>
            ) : (
              <span className="ml-1 status-attention">No articles yet — connect Supabase</span>
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

      <ArticlesTable
        rows={rows}
        groupLocales={groupLocales}
      />
    </div>
  );
}
