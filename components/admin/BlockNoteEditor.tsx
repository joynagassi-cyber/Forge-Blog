"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BlockNoteViewRaw, useCreateBlockNote } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import "@blocknote/react/style.css";
import type { ArticleContent } from "@/lib/blocks/types";
import { fromBlockNote, toBlockNote } from "@/lib/blocks/from-blocknote";

type Props = {
  id: string;
  initial: ArticleContent;
  onSave: (content: ArticleContent) => Promise<boolean>;
};

export function BlockNoteEditor({ id, initial, onSave }: Props) {
  const editor = useCreateBlockNote();
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

  return (
    <div className="space-y-3">
      <BlockNoteViewRaw editor={editor} editable={true} key={uid} />
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
