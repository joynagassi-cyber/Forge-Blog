import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import Link from "next/link";

export default function ArticlesTablePage() {
  const rows = DEMO_ARTICLES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Article database</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Naming: [TYPE] Subject | Status · Demo data until Supabase is wired
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
              {[
                "Title",
                "Locale",
                "Pillar",
                "Status",
                "Author",
                "Words",
                "Read",
              ].map((h) => (
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
            {rows.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-1)]"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="text-[var(--accent)] font-medium underline decoration-2 underline-offset-2"
                  >
                    [ARTICLE] {a.title} | Published
                  </Link>
                </td>
                <td className="px-3 py-2.5 uppercase text-[var(--text-muted)]">
                  {a.locale}
                </td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                  {a.pillar_slug}
                </td>
                <td className="px-3 py-2.5">
                  <span className="status-published">Published</span>
                </td>
                <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                  {a.author}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-[var(--text-muted)]">
                  —
                </td>
                <td className="px-3 py-2.5 tabular-nums">
                  {a.read_time_minutes}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
