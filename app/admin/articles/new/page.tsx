"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PILLARS } from "@/lib/pillars/mapping";

const STATUSES = [
  "idea",
  "researching",
  "brief_ready",
  "drafting",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "updating",
  "archived",
] as const;

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const slugPreview = title ? slugify(title) : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          working_title: formData.get("title"),
          locale: formData.get("locale"),
          pillar_slug: formData.get("pillar"),
          status: formData.get("status"),
        }),
      });

      const data = await res.json() as { ok?: boolean; article_id?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `Server error: ${res.status}`);
      }

      if (data.ok && data.article_id) {
        router.push(`/admin/articles/${data.article_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create article</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Define the idea — the full editor opens after creation.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Working title">
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. The Forgetting Curve: What You Lose and How Fast"
          />
          {slugPreview && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Slug: <code className="bg-[var(--surface-2)] px-1 rounded">{slugPreview}</code>
            </p>
          )}
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Source language">
            <select name="locale" className={inputClass} defaultValue="en">
              <option value="en">English (en)</option>
              <option value="fr">Français (fr)</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={inputClass} defaultValue="idea">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Pillar">
          <select name="pillar" className={inputClass} defaultValue="">
            <option value="" disabled>
              Select pillar
            </option>
            {PILLARS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name_en} / {p.name_fr}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Audience & problem solved">
          <textarea
            name="problem"
            rows={3}
            className={inputClass}
            placeholder="Who is this for, what pain does it remove?"
          />
        </Field>

        <Field label="Primary keyword">
          <input
            name="keyword"
            className={inputClass}
            placeholder="spaced repetition"
          />
        </Field>

        {error && (
          <p className="text-sm status-error" role="alert">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm btn-shimmer disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create article"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>
      {children}
    </label>
  );
}
