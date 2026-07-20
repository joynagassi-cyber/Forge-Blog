"use client";

import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type Props = {
  latex: string;
  /** Display mode: block (centered) or inline. Default block. */
  inline?: boolean;
};

/**
 * Renders LaTeX equations using KaTeX.
 * - Block mode: displayed equation centered on its own line.
 * - Inline mode: rendered within text flow.
 * Falls back to raw LaTeX if rendering fails.
 */
export function EquationBlockView({ latex, inline = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !latex.trim()) return;
    try {
      katex.render(latex, containerRef.current, {
        displayMode: !inline,
        throwOnError: false,
        errorColor: "#ef4444",
        trust: true,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\CC": "\\mathbb{C}",
        },
      });
      setError(false);
    } catch {
      setError(true);
    }
  }, [latex, inline]);

  if (!latex.trim()) {
    return null;
  }

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-300 bg-red-50 px-4 py-3 font-mono text-sm text-red-700 ${
          inline ? "inline-block" : ""
        }`}
        role="alert"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-red-500 block mb-1">
          Equation error
        </span>
        {latex}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`katex-block my-4 ${inline ? "inline-block" : "text-center"}`}
      aria-label={`LaTeX equation: ${latex}`}
      role="math"
    />
  );
}
