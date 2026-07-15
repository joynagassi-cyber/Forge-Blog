"use client";

import { Button } from "@/components/shared/Button";
import type { BodyBlock } from "@/lib/blocks/types";
import { RichText } from "./RichText";
import { DiagramBlockView } from "./DiagramBlockView";
import { useState } from "react";

function CodeBlockView({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
        <span className="font-mono">{language || "text"}</span>
        <button
          type="button"
          onClick={copy}
          className="hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded px-1"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ToggleView({
  summary,
  children,
}: {
  summary: string;
  children: BodyBlock[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
      <button
        type="button"
        className="w-full text-left px-4 py-3 font-medium flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[var(--text-muted)]" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        {summary}
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[var(--border)] pt-3">
          {children.map((b) => (
            <BlockRenderer key={b.id} block={b} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BlockRenderer({ block }: { block: BodyBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="article-prose text-[var(--text-primary)] leading-relaxed">
          <RichText spans={block.spans} />
        </p>
      );
    case "h2":
      return (
        <h2
          id={block.anchor || block.id}
          className="font-serif text-2xl font-semibold text-[var(--text-primary)] mt-10 mb-3 scroll-mt-24"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          id={block.anchor || block.id}
          className="font-serif text-xl font-semibold text-[var(--text-primary)] mt-8 mb-2 scroll-mt-24"
        >
          {block.text}
        </h3>
      );
    case "callout": {
      const border =
        block.variant === "verify"
          ? "border-amber-500/40"
          : "border-[var(--border)]";
      return (
        <aside
          className={`rounded-lg border ${border} bg-[var(--surface-1)] px-4 py-3`}
        >
          {block.title && (
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
              {block.title}
            </div>
          )}
          <div className="text-[var(--text-primary)] text-sm leading-relaxed">
            <RichText spans={block.spans} />
          </div>
        </aside>
      );
    }
    case "quote":
      return (
        <blockquote className="border-l-2 border-[var(--border-strong)] pl-4 italic text-[var(--text-secondary)]">
          <RichText spans={block.spans} />
          {block.attribution && (
            <footer className="mt-2 text-sm not-italic text-[var(--text-muted)]">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-1)]">
              <tr>
                {block.headers.map((h) => (
                  <th
                    key={h}
                    className="text-left font-semibold px-3 py-2 border-b border-[var(--border)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-[var(--border)] last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-[var(--text-secondary)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return <CodeBlockView language={block.language} code={block.code} />;
    case "toggle":
      return <ToggleView summary={block.summary} children={block.children} />;
    case "checklist": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={
            block.ordered
              ? "list-decimal pl-5 space-y-1.5 text-[var(--text-primary)]"
              : "list-disc pl-5 space-y-1.5 text-[var(--text-primary)]"
          }
        >
          {block.items.map((item, i) => (
            <li key={i}>{item.text}</li>
          ))}
        </Tag>
      );
    }
    case "image":
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-lg border border-[var(--border)]"
          />
          {block.caption && (
            <figcaption className="mt-2 text-sm text-[var(--text-muted)] text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "bookmark":
      return (
        <a
          href={block.url}
          className="block rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--border-strong)]"
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="font-medium text-[var(--accent)] underline decoration-2 underline-offset-2">
            {block.title || block.url}
          </div>
          {block.description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {block.description}
            </p>
          )}
        </a>
      );
    case "equation":
      return (
        <div className="rounded-lg bg-[var(--surface-1)] px-4 py-3 font-mono text-center text-[var(--text-primary)]">
          {block.latex}
        </div>
      );
    case "divider":
      return <hr className="border-[var(--border)] my-8" />;
    case "diagram":
      return <DiagramBlockView nodes={block.nodes} edges={block.edges} />;
    case "product_bridge_inline":
      return (
        <aside className="my-8 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6 flex flex-col gap-3">
          <h4 className="font-serif text-lg text-[var(--text-primary)]">
            {block.headline}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {block.body}
          </p>
          <div>
            <Button href={block.ctaHref} shimmer size="md">
              {block.ctaLabel}
            </Button>
          </div>
        </aside>
      );
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return (
        <div className="text-sm text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded p-3">
          Unsupported block (fallback)
        </div>
      );
    }
  }
}

export function BodyBlocks({ blocks }: { blocks: BodyBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} />
      ))}
    </div>
  );
}
