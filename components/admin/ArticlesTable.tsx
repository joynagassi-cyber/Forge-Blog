"use client";

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArticleRow = {
  id: string;
  title: string;
  locale: string;
  translation_group_id: string;
  pillar_slug: string;
  status: string;
  author: string;
  read_time_minutes: number;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  published_at?: string | null;
  last_updated_at?: string | null;
};

type SortKey = "title" | "locale" | "status" | "author" | "read_time_minutes" | "published_at";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUSES = [
  "all",
  "idea",
  "researching",
  "brief_ready",
  "drafting",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "updating",
  "archived",
] as const;

const STATUS_COLORS: Record<string, string> = {
  published: "status-published",
  drafting: "status-info",
  in_review: "status-info",
  idea: "status-attention",
  brief_ready: "status-attention",
  changes_requested: "status-attention",
  scheduled: "status-info",
  approved: "status-info",
  updating: "status-attention",
  archived: "status-attention",
  researching: "status-info",
};

const PER_PAGE = 20;

const COLUMNS: { key: SortKey | null; label: string; sortable: boolean }[] = [
  { key: null, label: "Cover", sortable: false },
  { key: "title", label: "Title", sortable: true },
  { key: "locale", label: "Locale", sortable: true },
  { key: null, label: "Translation", sortable: false },
  { key: null, label: "Pillar", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "author", label: "Author", sortable: true },
  { key: "read_time_minutes", label: "Read", sortable: true },
  { key: "published_at", label: "Published", sortable: true },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  rows: ArticleRow[];
  groupLocales: Map<string, Set<string>>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArticlesTable({ rows, groupLocales }: Props) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  // ---- Derived filtered + sorted data ----

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    let result = rows;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search across title + pillar + author
    if (q) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.pillar_slug.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [rows, deferredSearch, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  // ---- Handlers ----

  const toggleSort = useCallback(
    (key: SortKey) => {
      setSortKey((prev) => {
        if (prev === key) {
          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          return key;
        }
        setSortDir("asc");
        return key;
      });
      setPage(0);
    },
    []
  );

  const goPage = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);

  // Reset page on filter/search change
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(0);
  }, []);

  const handleStatusFilter = useCallback((val: string) => {
    setStatusFilter(val);
    setPage(0);
  }, []);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-[var(--text-muted)] ml-1 opacity-40">⇅</span>;
    return <span className="text-[var(--accent)] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* Toolbar: search + status filter + results count */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search articles by title, pillar, author…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            aria-label="Search articles"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm text-[var(--text-secondary)] sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== rows.length && (
            <span className="ml-1">(filtered from {rows.length})</span>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm" role="grid">
          <thead className="bg-[var(--surface-1)] text-left">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={`px-3 py-2.5 font-semibold border-b border-[var(--border)] whitespace-nowrap ${
                    col.sortable
                      ? "cursor-pointer select-none hover:bg-[var(--surface-2)]"
                      : ""
                  }`}
                  onClick={() => col.sortable && col.key && toggleSort(col.key)}
                  aria-sort={
                    col.sortable && col.key === sortKey
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  scope="col"
                >
                  {col.label}
                  {col.sortable && col.key && sortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-12 text-center text-[var(--text-muted)]"
                >
                  {search || statusFilter !== "all"
                    ? "No articles match your search or filter."
                    : "No articles yet. Create your first one."}
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
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
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-1)] transition-colors"
                  >
                    {/* Cover thumbnail */}
                    <td className="px-3 py-2">
                      {r.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.cover_image_url}
                          alt={r.cover_image_alt ?? ""}
                          className="w-10 h-7 rounded object-cover border border-[var(--border)]"
                        />
                      ) : (
                        <div className="w-10 h-7 rounded bg-[var(--surface-2)] border border-[var(--border)]" />
                      )}
                    </td>

                    {/* Title + link */}
                    <td className="px-3 py-2.5 max-w-[280px]">
                      <Link
                        href={`/admin/articles/${r.id}`}
                        className="text-[var(--accent)] font-medium underline decoration-2 underline-offset-2 hover:text-[var(--accent-hover)] line-clamp-2"
                      >
                        {r.title}
                      </Link>
                    </td>

                    {/* Locale */}
                    <td className="px-3 py-2.5 uppercase text-[var(--text-muted)] font-mono text-xs">
                      {r.locale}
                    </td>

                    {/* Translation coverage */}
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          hasFr && hasEn
                            ? "status-published text-xs font-medium"
                            : "status-attention text-xs font-medium"
                        }
                      >
                        {translationLabel}
                      </span>
                    </td>

                    {/* Pillar */}
                    <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs max-w-[120px] truncate">
                      {r.pillar_slug}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          STATUS_COLORS[r.status] ?? "status-info"
                        }
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-3 py-2.5 text-[var(--text-secondary)] text-xs truncate max-w-[100px]">
                      {r.author}
                    </td>

                    {/* Read time */}
                    <td className="px-3 py-2.5 tabular-nums text-[var(--text-muted)] text-xs">
                      {r.read_time_minutes}m
                    </td>

                    {/* Published date */}
                    <td className="px-3 py-2.5 text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {r.published_at
                        ? new Date(r.published_at).toLocaleDateString("fr-CA")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between gap-4 text-sm"
          aria-label="Article pagination"
        >
          <span className="text-[var(--text-muted)]">
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <PageButton
              onClick={() => goPage(0)}
              disabled={safePage === 0}
              label="First page"
            >
              ««
            </PageButton>
            <PageButton
              onClick={() => goPage(safePage - 1)}
              disabled={safePage === 0}
              label="Previous page"
            >
              «
            </PageButton>

            {/* Page number buttons */}
            {generatePageNumbers(safePage, totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`ellipsis-${i}`} className="px-2 text-[var(--text-muted)]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goPage(p - 1)}
                  className={`min-w-[2rem] h-8 rounded-md text-sm font-medium transition-colors ${
                    p - 1 === safePage
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  }`}
                  aria-current={p - 1 === safePage ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}

            <PageButton
              onClick={() => goPage(safePage + 1)}
              disabled={safePage >= totalPages - 1}
              label="Next page"
            >
              »
            </PageButton>
            <PageButton
              onClick={() => goPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              label="Last page"
            >
              »»
            </PageButton>
          </div>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="min-w-[2rem] h-8 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a compact page-number array with ellipsis markers.
 * Shows first, last, and pages around the current page.
 * `-1` entries represent ellipsis gaps.
 */
function generatePageNumbers(
  current: number,
  total: number
): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push(-1);
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 3);
  for (let i = start; i <= end; i++) {
    pages.push(i + 1);
  }

  if (current + 3 < total - 2) {
    pages.push(-1);
  }

  // Always show last page
  pages.push(total);

  return pages;
}
