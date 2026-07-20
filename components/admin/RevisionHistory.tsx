"use client";

import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Revision = {
  id: string;
  change_summary: string | null;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Demo revisions (for when Supabase is not connected)
// ---------------------------------------------------------------------------

const DEMO_REVISIONS: Revision[] = [
  { id: "r4", change_summary: "Updated key takeaways and added callout", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "r3", change_summary: "Editor review: fixed dek and added conversion_block", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "r2", change_summary: "Draft from AI: initial section-10 scaffold", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "r1", change_summary: "Article created (idea status)", created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) { const mins = Math.floor(diff / 60000); return `${mins}m ago`; }
    return `${hours}h ago`;
  }
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  articleId: string;
  initialRevisions?: Revision[] | null;
  isLive?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RevisionHistory({ articleId, initialRevisions, isLive = false }: Props) {
  const revisions = useMemo(
    () => initialRevisions ?? DEMO_REVISIONS,
    [initialRevisions]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = revisions.find((r) => r.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span>{revisions.length} revision{revisions.length !== 1 ? "s" : ""}</span>
        {!isLive && (
          <span className="status-attention">· Demo mode</span>
        )}
      </div>

      {revisions.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No revisions yet.</p>
      ) : (
        <div className="space-y-1">
          {revisions.map((r, i) => {
            const isLatest = i === 0;
            const isSelected = r.id === selectedId;
            return (
              <div
                key={r.id}
                className={`rounded-lg border transition-colors ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] bg-[var(--surface-1)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : r.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isLatest && (
                      <span className="shrink-0 rounded bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wide">
                        Latest
                      </span>
                    )}
                    <span className="text-sm text-[var(--text-primary)] truncate">
                      {r.change_summary ?? "No summary"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                      {formatDate(r.created_at)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] sm:hidden">
                      {timeAgo(r.created_at)}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
                        isSelected ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isSelected && selected && (
                  <div className="px-3 pb-3 border-t border-[var(--border)] pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--text-muted)]">Created</span>
                        <p className="text-[var(--text-primary)]">{formatDate(selected.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Revision ID</span>
                        <p className="text-[var(--text-primary)] font-mono text-[10px] truncate">{selected.id}</p>
                      </div>
                    </div>

                    {/* Diff preview (textual) */}
                    <div className="rounded-md bg-[var(--surface-2)] p-3 text-xs font-mono text-[var(--text-secondary)] leading-relaxed overflow-x-auto">
                      <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)]">
                        <span className="text-emerald-500">+ Added</span>
                        <span className="text-red-500">− Removed</span>
                      </div>
                      <pre className="whitespace-pre-wrap">
{`diff --git a/article.json b/article.json
index abc123..def456 100644
--- a/article.json
+++ b/article.json
@@ -1,5 +1,5 @@
 {
-  "version": 1,
+  "version": 2,
   "sequence": [
     {
       "type": "hero_meta",`}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                        title="API route not implemented yet"
                      >
                        View full diff
                      </button>
                      {!isLatest && (
                        <button
                          type="button"
                          className="rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                          disabled={!isLive}
                          title={!isLive ? "Connect Supabase to restore revisions" : "Restore this version"}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
