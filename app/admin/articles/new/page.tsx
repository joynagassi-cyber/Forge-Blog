"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";
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

export default function NewArticlePage() {
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    const data = form ? new FormData(form) : null;
    posthog.capture("article_idea_saved", {
      pillar: data?.get("pillar") as string | null,
      locale: data?.get("locale") as string | null,
      target_product: data?.get("product") as string | null,
      status: data?.get("status") as string | null,
    });
    setSaved(true);
  }

  function onAiBriefRequested() {
    const form = formRef.current;
    const data = form ? new FormData(form) : null;
    posthog.capture("ai_brief_requested", {
      pillar: data?.get("pillar") as string | null,
      locale: data?.get("locale") as string | null,
    });
    alert(
      "AI brief_generation requires a configured provider (admin settings). Human approval required before In review → Published."
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Define the idea</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Step 1 of the editorial workflow. Full draft requires brief first
          unless explicitly requested.
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <Field label="Working title">
          <input
            name="title"
            required
            className={inputClass}
            placeholder="e.g. Courbe d'oubli for SOC onboarding"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Source language">
            <select name="locale" className={inputClass} defaultValue="en">
              <option value="en">English (en)</option>
              <option value="fr">Français (fr)</option>
            </select>
          </Field>
          <Field label="Target languages">
            <select name="targets" className={inputClass} defaultValue="both">
              <option value="en">en only</option>
              <option value="fr">fr only</option>
              <option value="both">en + fr</option>
            </select>
          </Field>
        </div>

        <Field label="Pillar">
          <select name="pillar" className={inputClass} required defaultValue="">
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

        <Field label="Target product">
          <select name="product" className={inputClass} defaultValue="none">
            <option value="nainoforge">NainoForge</option>
            <option value="scyforge">SCYForge</option>
            <option value="both">Both</option>
            <option value="none">Neither</option>
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

        <Field label="Status">
          <select name="status" className={inputClass} defaultValue="idea">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm btn-shimmer"
          >
            Save idea
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium"
            onClick={onAiBriefRequested}
          >
            Generate brief (AI)
          </button>
        </div>

        {saved && (
          <p className="text-sm status-published" role="status">
            Idea saved locally (demo). Connect Supabase to persist.
          </p>
        )}
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
