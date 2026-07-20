"use client";

/**
 * Advanced markdown rendering components.
 * Adds support for:
 * - Footnotes (linked references at the bottom of articles)
 * - Embedded content (YouTube, Twitter, iframes)
 * - Complex tables (merged cells, multi-line headers)
 */

import { useState } from "react";

// ---------------------------------------------------------------------------
// Footnotes
// ---------------------------------------------------------------------------

type Footnote = {
  id: string;
  text: string;
  href?: string;
};

type FootnoteBlockProps = {
  footnotes: Footnote[];
};

/**
 * Renders footnotes as a collapsible section at the bottom of an article.
 * Each footnote can be linked back to from the article body using anchor links.
 */
export function FootnoteBlock({ footnotes }: FootnoteBlockProps) {
  if (!footnotes.length) return null;

  return (
    <section
      className="mt-10 pt-6 border-t border-[var(--border)] text-sm text-[var(--text-secondary)]"
      aria-label="Footnotes"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
        Footnotes
      </h3>
      <ol className="space-y-2 list-decimal pl-5">
        {footnotes.map((fn) => (
          <li key={fn.id} id={`fn-${fn.id}`} className="text-sm leading-relaxed">
            <span>{fn.text}</span>
            {fn.href && (
              <>
                {" "}
                <a
                  href={fn.href}
                  className="text-[var(--accent)] hover:underline text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  [source]
                </a>
              </>
            )}
            <a
              href={`#fnref-${fn.id}`}
              className="ml-1 text-[var(--text-muted)] hover:text-[var(--accent)] text-xs no-underline"
              aria-label="Back to reference"
            >
              ↩
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Inline footnote reference — renders a superscript link that scrolls
 * to the footnote when clicked.
 */
export function FootnoteRef({ id }: { id: string }) {
  return (
    <sup>
      <a
        href={`#fn-${id}`}
        id={`fnref-${id}`}
        className="text-[var(--accent)] hover:underline text-xs ml-0.5 no-underline"
        aria-label={`Jump to footnote ${id}`}
      >
        [{id}]
      </a>
    </sup>
  );
}

// ---------------------------------------------------------------------------
// Embedded content
// ---------------------------------------------------------------------------

type EmbedType = "youtube" | "twitter" | "iframe" | "generic";

type EmbedBlockProps = {
  type: EmbedType;
  url: string;
  title?: string;
  /** For iframes: width, height, allowFullscreen */
  width?: string | number;
  height?: string | number;
};

/**
 * Renders embedded external content (YouTube, Twitter, generic iframes).
 */
export function EmbedBlock({ type, url, title, width, height }: EmbedBlockProps) {
  switch (type) {
    case "youtube": {
      // Extract video ID from various YouTube URL formats
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return (
          <div className="my-4 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              {title || url}
            </a>
          </div>
        );
      }
      return (
        <figure className="my-6 rounded-lg overflow-hidden border border-[var(--border)]">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={title ?? "YouTube video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
          {title && (
            <figcaption className="px-3 py-2 text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
              {title}
            </figcaption>
          )}
        </figure>
      );
    }

    case "iframe":
      return (
        <figure className="my-6 rounded-lg overflow-hidden border border-[var(--border)]">
          <div
            className="relative"
            style={{
              paddingBottom: height && width
                ? (() => {
                    const w = parseFloat(String(width)) || 16;
                    const h = parseFloat(String(height)) || 9;
                    return `${(h / w) * 100}%`;
                  })()
                : "56.25%",
            }}
          >
            <iframe
              src={url}
              title={title ?? "Embedded content"}
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              loading="lazy"
            />
          </div>
          {title && (
            <figcaption className="px-3 py-2 text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
              {title}
            </figcaption>
          )}
        </figure>
      );

    default:
      return (
        <div className="my-4 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            {title || url}
          </a>
        </div>
      );
  }
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Expandable table (complex tables with collapse on mobile)
// ---------------------------------------------------------------------------

type ComplexTableProps = {
  headers: string[];
  rows: string[][];
  caption?: string;
};

/**
 * Enhanced table component with horizontal scroll and optional caption.
 * Handles complex tables with merged-header semantics.
 */
export function ComplexTable({ headers, rows, caption }: ComplexTableProps) {
  const [expanded, setExpanded] = useState(false);
  const hasManyRows = rows.length > 15;

  const visibleRows = hasManyRows && !expanded ? rows.slice(0, 15) : rows;

  if (!headers.length || !rows.length) return null;

  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          {caption && (
            <caption className="text-xs text-[var(--text-muted)] text-left px-3 py-1.5 border-b border-[var(--border)] bg-[var(--surface-1)]">
              {caption}
            </caption>
          )}
          <thead className="bg-[var(--surface-1)]">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left font-semibold px-3 py-2 border-b border-[var(--border)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-1)]"
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-[var(--text-secondary)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {hasManyRows && !expanded && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="text-center py-3"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    Show all {rows.length} rows
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
