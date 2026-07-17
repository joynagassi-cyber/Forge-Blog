"use client";

import { useState } from "react";
import type { ArticleContent, BodyBlock, HeroMeta, KeyTakeaway, ConversionBlock } from "@/lib/blocks/types";
import { BlockNoteEditor } from "./BlockNoteEditor";

type Props = {
  id: string;
  initial: ArticleContent;
  isLive: boolean;
  locale: string;
  slug: string;
  onSave?: (content: ArticleContent) => Promise<boolean>;
};

export function ArticleEditorClient({ id, initial, isLive, locale, slug, onSave }: Props) {
  const [content, setContent] = useState<ArticleContent>(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const hero = content.sequence.find((b) => b.type === "hero_meta") as HeroMeta | undefined;
  const takeaway = content.sequence.find((b) => b.type === "key_takeaway") as KeyTakeaway | undefined;
  const conversion = content.sequence.find((b) => b.type === "conversion_block") as ConversionBlock | undefined;
  const bodyBlocks = content.sequence.find((b) => b.type === "body_blocks");

  function updateBodyBlocks(blocks: BodyBlock[]) {
    setContent((c) => ({
      ...c,
      sequence: c.sequence.map((b) =>
        b.type === "body_blocks" ? { ...b, blocks } : b
      ),
    }));
    setSaved(false);
  }

  function updateHero(field: keyof HeroMeta, value: string | number) {
    setContent((c) => ({
      ...c,
      sequence: c.sequence.map((b) =>
        b.type === "hero_meta" ? { ...b, [field]: value } : b
      ),
    }));
    setSaved(false);
  }

  function updateTakeaway(items: string[]) {
    setContent((c) => ({
      ...c,
      sequence: c.sequence.map((b) =>
        b.type === "key_takeaway" ? { ...b, items } : b
      ),
    }));
    setSaved(false);
  }

  function updateConversion(field: keyof ConversionBlock, value: string) {
    setContent((c) => ({
      ...c,
      sequence: c.sequence.map((b) =>
        b.type === "conversion_block" ? { ...b, [field]: value } : b
      ),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(content);
      } else {
        const res = await fetch(`/api/admin/articles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Save failed — check console");
    } finally {
      setSaving(false);
    }
  }

  if (!hero || !takeaway || !conversion) return <p className="status-error">Invalid scaffold structure.</p>;

  return (
    <div className="space-y-6">
      {/* Hero meta */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)]">Hero meta</h2>
        <Field label="Title">
          <input
            value={hero.title}
            onChange={(e) => updateHero("title", e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Dek">
          <textarea
            value={hero.dek}
            onChange={(e) => updateHero("dek", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Author">
            <input
              value={hero.author}
              onChange={(e) => updateHero("author", e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Read time (min)">
            <input
              type="number"
              value={hero.readTimeMinutes}
              onChange={(e) => updateHero("readTimeMinutes", Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      {/* Key takeaways */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)]">Key takeaways</h2>
        {takeaway.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...takeaway.items];
                next[i] = e.target.value;
                updateTakeaway(next);
              }}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => updateTakeaway(takeaway.items.filter((_, j) => j !== i))}
              className="text-xs text-[var(--text-muted)] hover:text-red-500 px-2"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateTakeaway([...takeaway.items, "New takeaway"])}
          className="text-xs text-[var(--accent)] hover:underline"
        >
          + Add takeaway
        </button>
      </section>

      {/* Conversion block */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)]">Conversion block</h2>
        <Field label="Headline">
          <input
            value={conversion.headline}
            onChange={(e) => updateConversion("headline", e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Body">
          <textarea
            value={conversion.body}
            onChange={(e) => updateConversion("body", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="CTA label">
            <input
              value={conversion.ctaLabel}
              onChange={(e) => updateConversion("ctaLabel", e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </Field>
          <Field label="CTA href">
            <input
              value={conversion.ctaHref}
              onChange={(e) => updateConversion("ctaHref", e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      {/* BlockNote body editor */}
      <section className="rounded-lg border border-[var(--border)] p-5">
        <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-[var(--text-muted)]">Body blocks (BlockNote)</h2>
        <BlockNoteEditor
          id={id}
          initial={content}
          onSave={async (fullScaffold) => {
            setContent(fullScaffold);
            setSaved(false);
            return true;
          }}
        />
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save all changes"}
        </button>
        {saved && <span className="text-sm status-published">Saved ✓</span>}
        {!isLive && (
          <span className="text-xs text-[var(--text-muted)]">Demo mode: changes are local only</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      {children}
    </div>
  );
}
