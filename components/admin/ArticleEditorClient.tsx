"use client";

import { useEffect, useRef, useState } from "react";
import type { ArticleContent, BodyBlock, HeroMeta, KeyTakeaway, ConversionBlock } from "@/lib/blocks/types";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { ImageUpload } from "@/components/shared/ImageUpload";

export type SeoMetaFields = {
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  robots: string;
};

type Props = {
  id: string;
  initial: ArticleContent;
  isLive: boolean;
  locale: string;
  slug: string;
  onSave?: (content: ArticleContent) => Promise<boolean>;
  /** Pre-populated SEO metadata from server (dedicated DB columns) */
  initialSeo?: SeoMetaFields;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

export function ArticleEditorClient({ id, initial, isLive, locale, slug, onSave, initialSeo }: Props) {
  const [content, setContent] = useState<ArticleContent>(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverAlt, setCoverAlt] = useState<string>("");

  // SEO metadata fields (persisted to dedicated DB columns via API)
  const [seoToggle, setSeoToggle] = useState(false);
  const [seoTitle, setSeoTitle] = useState(initialSeo?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(initialSeo?.meta_description ?? "");
  const [seoCanonical, setSeoCanonical] = useState(initialSeo?.canonical_url ?? "");
  const [seoRobots, setSeoRobots] = useState(initialSeo?.robots ?? "index,follow");

  // Sync SEO state when article changes (navigating between articles)
  const prevId = useRef(id);
  useEffect(() => {
    if (prevId.current !== id) {
      prevId.current = id;
      setSeoTitle(initialSeo?.seo_title ?? "");
      setSeoDesc(initialSeo?.meta_description ?? "");
      setSeoCanonical(initialSeo?.canonical_url ?? "");
      setSeoRobots(initialSeo?.robots ?? "index,follow");
    }
  }, [id, initialSeo]);

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

  function handleCoverUploaded(url: string, alt: string) {
    setCoverImage(url);
    setCoverAlt(alt);
    setSaved(false);
  }

  function removeCover() {
    setCoverImage(null);
    setCoverAlt("");
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build complete content with cover image in hero_meta
      const contentWithCover: ArticleContent = coverImage
        ? {
            ...content,
            sequence: content.sequence.map((b) =>
              b.type === "hero_meta"
                ? { ...b, coverImageUrl: coverImage, coverImageAlt: coverAlt }
                : b
            ),
          }
        : content;

      // Build SEO payload (sent separately from content to dedicated DB columns)
      const seoPayload = {
        seo_title: seoTitle,
        meta_description: seoDesc,
        canonical_url: seoCanonical,
        robots: seoRobots,
      };

      if (onSave) {
        await onSave(contentWithCover);
      } else {
        const res = await fetch(`/api/admin/articles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: contentWithCover,
            seoMeta: seoPayload,
          }),
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
      {/* Cover image */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)]">Cover image</h2>
        {(coverImage || hero.coverImageUrl) ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage || hero.coverImageUrl}
              alt={coverAlt || hero.coverImageAlt || "Cover preview"}
              className="aspect-video w-full max-w-lg rounded-lg border border-[var(--border)] object-cover"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">
                Alt text:
                <input
                  value={coverAlt || hero.coverImageAlt || ""}
                  onChange={(e) => setCoverAlt(e.target.value)}
                  className="ml-2 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs"
                  placeholder="Describe the image"
                />
              </label>
              <button
                type="button"
                onClick={removeCover}
                className="text-xs text-red-500 hover:underline ml-auto"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <ImageUpload
            onUploaded={handleCoverUploaded}
            prefix="covers/"
            maxWidth={1920}
            label="Upload cover image"
          />
        )}
      </section>

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

      {/* SEO Metadata */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <button
          type="button"
          onClick={() => setSeoToggle((v) => !v)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--text-muted)]">
            SEO &amp; Social preview
          </h2>
          <span className="text-[var(--text-muted)] text-xs">{seoToggle ? "▾" : "▸"}</span>
        </button>

        {seoToggle && (
          <div className="space-y-3 pt-1">
            <Field label="SEO title (overrides article title)">
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={hero.title || "Leave empty to use article title"}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                maxLength={60}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{seoTitle.length}/60 chars</p>
            </Field>

            <Field label="Meta description">
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                placeholder={hero.dek || "Brief summary for search results"}
                rows={2}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                maxLength={160}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{seoDesc.length}/160 chars</p>
            </Field>

            <Field label="Canonical URL">
              <input
                value={seoCanonical}
                onChange={(e) => setSeoCanonical(e.target.value)}
                placeholder="Leave empty to auto-detect"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-mono text-xs"
              />
            </Field>

            <Field label="Robots">
              <select
                value={seoRobots}
                onChange={(e) => setSeoRobots(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              >
                <option value="index,follow">index, follow (default)</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="index,nofollow">index, nofollow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </Field>

            {/* Social preview card */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] overflow-hidden max-w-md">
              {coverImage || hero.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage || hero.coverImageUrl}
                  alt={coverAlt || hero.coverImageAlt || ""}
                  className="aspect-[2/1] w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/1] w-full bg-[var(--surface-2)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No image — add a cover for social preview
                </div>
              )}
              <div className="p-3 space-y-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  {SITE_URL.replace("https://", "")}/{locale}/article/{slug}
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
                  {seoTitle || hero.title || "Article title"}
                </p>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {seoDesc || hero.dek || "Meta description"}
                </p>
              </div>
            </div>
          </div>
        )}
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
