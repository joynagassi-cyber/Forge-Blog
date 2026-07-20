"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BlockNoteViewRaw, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import type { Block } from "@blocknote/core";
import "katex/dist/katex.min.css";
import "@blocknote/react/style.css";
import type { ArticleContent, BodyBlock } from "@/lib/blocks/types";
import { fromBlockNote, toBlockNote } from "@/lib/blocks/from-blocknote";
import { MathBlock, MermaidBlockSpec } from "./BlockNoteCustomBlocks";
import { uploadImage } from "@/lib/upload";
import { AIGenerationTool } from "./AIGenerationTool";
import type { AiMode } from "./AIGenerationTool";

type Props = {
  id: string;
  initial: ArticleContent;
  onSave: (content: ArticleContent) => Promise<boolean>;
  /** Optional callback when body blocks change (from AI generation) */
  onBlocksChange?: (blocks: BodyBlock[]) => void;
};

// Build schema once with custom blocks
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    math: MathBlock,
    mermaid: MermaidBlockSpec,
  },
});

export function BlockNoteEditor({ id, initial, onSave, onBlocksChange }: Props) {
  // Upload handler for pasted/dropped images
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const result = await uploadImage(file, "inline/", 1920);
    if (result.ok) return result.url;
    throw new Error(result.error);
  }, []);

  const editor = useCreateBlockNote({ schema, uploadFile });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const uid = useId();
  const mountedRef = useRef(false);

  // Hydrate from scaffold on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const body = initial.sequence.find((b) => b.type === "body_blocks");
    if (body && body.type === "body_blocks" && body.blocks.length > 0) {
      try {
        const bnBlocks = toBlockNote(body.blocks) as never[];
        editor.replaceBlocks(editor.document, bnBlocks);
      } catch {
        // leave editor empty
      }
    }
  }, [editor, initial]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const scaffold = fromBlockNote(editor.document as unknown as Block[]);
      const sequence = scaffold.sequence.map((block, i) => ({

        ...block,
        ...(i < initial.sequence.length && initial.sequence[i].type === block.type
          ? initial.sequence[i]
          : {}),
      }));
      const content: ArticleContent = { ...scaffold, sequence };
      const ok = await onSave(content);
      if (ok) {
        setSavedAt(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [editor, initial, onSave]);

  // Handle AI-generated content insertion
  const handleAiInsert = useCallback(
    (content: string, mode: AiMode) => {
      try {
        let newBlock: Record<string, unknown>;

        switch (mode) {
          case "equation":
            newBlock = {
              id: `eq-${Date.now()}`,
              type: "math",
              props: { latex: content },
              children: [],
            };
            break;

          case "diagram":
            newBlock = {
              id: `md-${Date.now()}`,
              type: "mermaid",
              props: { definition: content, title: "AI-generated diagram" },
              children: [],
            };
            break;

          default:
            // summary / rewrite / custom: insert as paragraph
            newBlock = {
              id: `p-${Date.now()}`,
              type: "paragraph",
              props: { text: content },
              children: [],
            };
        }

        // Append the new block at the end of the document
        const currentDoc = editor.document;
        editor.replaceBlocks(
          currentDoc,
          [...currentDoc, newBlock] as never[],
        );

        // Notify parent of block change
        if (onBlocksChange) {
          const updatedBlocks = fromBlockNote(
            [...currentDoc, newBlock] as unknown as Block[],
          );
          const bodySection = updatedBlocks.sequence.find(
            (b) => b.type === "body_blocks",
          );
          if (bodySection && bodySection.type === "body_blocks") {
            onBlocksChange(bodySection.blocks);
          }
        }
      } catch (e) {
        console.error("AI insert failed:", e);
      }
    },
    [editor, onBlocksChange],
  );

  return (
    <div className="space-y-3">
      <BlockNoteViewRaw editor={editor} editable={true} key={uid} />

      {/* AI Assistant tool */}
      <AIGenerationTool
        currentBlockText={editor.document
          .filter((b) => (b as any).props?.text)
          .map((b) => (b as any).props?.text as string)
          .filter(Boolean)
          .slice(-3)
          .join("\n")}
        onInsert={handleAiInsert}
      />

      {/* Hint for image insertion */}
      <p className="text-xs text-[var(--text-muted)] italic">
        Tip: Paste images from clipboard or drag & drop them into the editor to
        upload and insert them automatically. Use the AI Assistant to generate
        equations and diagrams from natural language.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2 text-sm btn-shimmer disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save scaffold"}
        </button>
        {savedAt && (
          <span className="text-xs text-[var(--text-muted)]">Saved {savedAt}</span>
        )}
      </div>
    </div>
  );
}
