import type { RichTextSpan } from "@/lib/blocks/types";
import type { ReactNode } from "react";

export function RichText({ spans }: { spans: RichTextSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        let node: ReactNode = span.text;

        if (span.marks?.code) {
          node = (
            <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-[0.9em] font-mono">
              {node}
            </code>
          );
        }
        if (span.marks?.italic) {
          node = <em>{node}</em>;
        }
        if (span.marks?.bold) {
          node = (
            <strong className="font-semibold text-[var(--accent)]">{node}</strong>
          );
        }
        if (span.marks?.link) {
          node = (
            <a
              href={span.marks.link}
              className="text-[var(--accent)] underline decoration-2 underline-offset-2 link-accent hover:decoration-[var(--accent-hover)]"
            >
              {node}
            </a>
          );
        }

        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
