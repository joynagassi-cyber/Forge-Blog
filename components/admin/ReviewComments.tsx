"use client";

import { useMemo, useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Comment = {
  id: string;
  body: string;
  block_id: string | null;
  resolved: boolean;
  created_at: string;
  author_name?: string;
};

export type ReviewState = {
  status: string;
  comments: Comment[];
};

// ---------------------------------------------------------------------------
// Demo comments (for when Supabase is not connected)
// ---------------------------------------------------------------------------

const DEMO_COMMENTS: Comment[] = [
  {
    id: "c1",
    body: "The hero_meta needs a stronger dek — currently too generic.",
    block_id: "hero_meta",
    resolved: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    author_name: "Reviewer",
  },
  {
    id: "c2",
    body: "Checklist in body_blocks is good, but add a callout for the key caveat.",

    block_id: "b2",
    resolved: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    author_name: "Editor",
  },
  {
    id: "c3",
    body: "Missing conversion_block — required for published articles.",
    block_id: null,
    resolved: false,
    created_at: new Date().toISOString(),
    author_name: "Reviewer",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  articleId: string;
  initialComments?: Comment[] | null;
  isLive?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewComments({ articleId, initialComments, isLive = false }: Props) {
  const [comments, setComments] = useState<Comment[]>(
    initialComments ?? DEMO_COMMENTS
  );

  const [newComment, setNewComment] = useState("");

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    const c: Comment = {
      id: `tmp-${Date.now()}`,
      body: newComment.trim(),
      block_id: null,
      resolved: false,
      created_at: new Date().toISOString(),
      author_name: "You",
    };
    setComments((prev) => [c, ...prev]);
    setNewComment("");
  }, [newComment]);

  const toggleResolve = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  }, []);

  const openComments = useMemo(() => comments.filter((c) => !c.resolved), [comments]);
  const resolvedComments = useMemo(() => comments.filter((c) => c.resolved), [comments]);

  return (
    <div className="space-y-4">
      {!isLive && (
        <div className="text-xs text-[var(--text-muted)] mb-2">
          Demo mode — connect Supabase for live review data
        </div>
      )}
      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {openComments.length} open
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {resolvedComments.length} resolved
        </span>
        {!isLive && (
          <span className="status-attention">· Demo mode</span>
        )}
      </div>

      {/* Add comment */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
          placeholder="Add a review comment…"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="rounded-lg bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
        >
          Comment
        </button>
      </div>

      {/* Open comments */}
      {openComments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Open ({openComments.length})
          </h4>
          {openComments.map((c) => (
            <CommentCard key={c.id} comment={c} onToggleResolve={toggleResolve} />
          ))}
        </div>
      )}

      {/* Resolved comments */}
      {resolvedComments.length > 0 && (
        <details className="rounded-lg border border-[var(--border)]">
          <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-lg transition-colors">
            Resolved ({resolvedComments.length})
          </summary>
          <div className="px-3 pb-3 space-y-2 mt-2">
            {resolvedComments.map((c) => (
              <CommentCard key={c.id} comment={c} onToggleResolve={toggleResolve} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function CommentCard({
  comment,
  onToggleResolve,
}: {
  comment: Comment;
  onToggleResolve: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)]">{comment.body}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)]">
            <span>{comment.author_name ?? "Anonymous"}</span>
            <span>·</span>
            <span>{timeAgo(comment.created_at)}</span>
            {comment.block_id && (
              <>
                <span>·</span>
                <code className="text-[10px] bg-[var(--surface-2)] px-1 rounded">{comment.block_id}</code>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleResolve(comment.id)}
          className={`shrink-0 rounded p-1 transition-colors ${
            comment.resolved
              ? "text-emerald-500 hover:text-emerald-600"
              : "text-[var(--text-muted)] hover:text-amber-500"
          }`}
          aria-label={comment.resolved ? "Mark as unresolved" : "Mark as resolved"}
          title={comment.resolved ? "Reopen" : "Resolve"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {comment.resolved ? (
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
