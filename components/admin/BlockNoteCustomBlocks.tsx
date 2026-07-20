"use client";

/**
 * Custom BlockNote block specs for:
 * - Math equations (KaTeX)
 * - Diagrams (Mermaid)
 *
 * NOTE: BlockNote v0.51.x has strict TypeScript overloads that only accept
 * known block type names (paragraph, heading, audio, etc.). Custom type names
 * like "math" and "mermaid" are rejected by the type checker even though they
 * work at runtime. We use `as any` on exports to bypass this limitation.
 */

import { createReactBlockSpec } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Shared Mermaid initializer (singleton — one init per page load)
// ---------------------------------------------------------------------------
let mermaidInitialized = false;

function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaidInitialized = true;

  const isDark =
    typeof document !== "undefined" &&
    (document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));

  void import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        background: "transparent",
        primaryColor: isDark ? "#18181b" : "#f4f4f5",
        primaryTextColor: isDark ? "#f2f2f3" : "#111114",
        primaryBorderColor: isDark ? "#3f3f46" : "#d4d4d8",
        secondaryColor: isDark ? "#1f1f23" : "#ececee",
        secondaryTextColor: isDark ? "#9a9aa1" : "#5b5b63",
        lineColor: isDark ? "#3f3f46" : "#d4d4d8",
        fontFamily: "Inter, sans-serif",
        fontSize: "12px",
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Math / Equation block
// ---------------------------------------------------------------------------

function MathBlockInner({
  block,
  onChange,
}: {
  block: any;
  onChange: (latex: string) => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftLatex, setDraftLatex] = useState(
    (block.props?.latex as string) ?? "",
  );
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraftLatex((block.props?.latex as string) ?? "");
    }
  }, [block.props?.latex, editing]);

  // KaTeX render preview
  useEffect(() => {
    if (!previewRef.current || editing || !draftLatex.trim()) return;
    let cancelled = false;
    async function render() {
      try {
        const katex = (await import("katex")).default;
        if (!cancelled && previewRef.current) {
          katex.render(draftLatex, previewRef.current, {
            displayMode: true,
            throwOnError: false,
            errorColor: "#ef4444",
            trust: true,
          });
          setRenderError(false);
        }
      } catch {
        if (!cancelled) setRenderError(true);
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [draftLatex, editing]);

  function handleSave() {
    onChange(draftLatex);
    setEditing(false);
  }

  function handleCancel() {
    setDraftLatex((block.props?.latex as string) ?? "");
    setEditing(false);
  }

  return (
    <div className="relative my-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Math equation
        </span>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draftLatex}
            onChange={(e) => setDraftLatex(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
            rows={3}
            placeholder="E = mc^2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {draftLatex ? (
            <div
              ref={previewRef}
              className="text-center min-h-[2rem] flex items-center justify-center"
            />
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              Click Edit to enter LaTeX equation
            </p>
          )}
          {renderError && (
            <p className="text-xs text-red-500 mt-1">
              Render error — check your LaTeX syntax
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper: bypass createReactBlockSpec strict overloads for custom block types
// BlockNote v0.51.x only accepts known type names (paragraph, heading, audio, etc.)
function c(config: any, render: any): any {
  return createReactBlockSpec(config, render);
}

export const MathBlock = c(
  {
    type: "math",
    propSchema: {
      latex: { default: "E = mc^2" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }: { block: Block; editor: any }) => (
      <MathBlockInner
        block={block}
        onChange={(latex: string) => {
          editor.updateBlock(block, { props: { latex } });
        }}
      />
    ),
  },
);

// ---------------------------------------------------------------------------
// Mermaid diagram block
// ---------------------------------------------------------------------------

function MermaidBlockInner({
  block,
  onChange,
}: {
  block: any;
  onChange: (definition: string) => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftDefinition, setDraftDefinition] = useState(
    (block.props?.definition as string) ?? "",
  );
  const [renderError, setRenderError] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraftDefinition((block.props?.definition as string) ?? "");
    }
  }, [block.props?.definition, editing]);

  // Mermaid render preview
  useEffect(() => {
    if (!previewRef.current || editing || !draftDefinition.trim()) return;
    let cancelled = false;

    async function render() {
      setRendering(true);
      setRenderError(false);

      try {
        ensureMermaidInit();
        const mermaid = (await import("mermaid")).default;

        const existing = previewRef.current?.querySelector(".mermaid");
        if (existing) existing.remove();

        const el = document.createElement("div");
        el.className = "mermaid";
        el.textContent = draftDefinition;
        previewRef.current?.appendChild(el);

        await mermaid.run({ nodes: [el], suppressErrors: true });

        if (!cancelled) setRendering(false);
      } catch {
        if (!cancelled) {
          setRendering(false);
          setRenderError(true);
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [draftDefinition, editing]);

  function handleSave() {
    onChange(draftDefinition);
    setEditing(false);
  }

  function handleCancel() {
    setDraftDefinition((block.props?.definition as string) ?? "");
    setEditing(false);
  }

  return (
    <div className="relative my-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Mermaid diagram
        </span>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Edit source
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draftDefinition}
            onChange={(e) => setDraftDefinition(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
            rows={5}
            placeholder="graph TD;%0A  A-->B;"
            autoFocus
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {draftDefinition ? (
            <div className="relative">
              {rendering && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                  <span className="ml-2 text-xs text-[var(--text-muted)]">
                    Rendering…
                  </span>
                </div>
              )}
              <div ref={previewRef} className="overflow-x-auto min-h-[3rem]" />
              {renderError && (
                <p className="text-xs text-red-500 mt-1">
                  Render error — check your Mermaid syntax
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">
              Click Edit to enter Mermaid diagram definition
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const MermaidBlockSpec = c(
  {
    type: "mermaid",
    propSchema: {
      definition: { default: "graph TD;\n  A-->B;" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }: { block: Block; editor: any }) => (
      <MermaidBlockInner
        block={block}
        onChange={(definition: string) => {
          editor.updateBlock(block, { props: { definition } });
        }}
      />
    ),
  },
);
