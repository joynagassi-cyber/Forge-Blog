const ADAPTERS = ["anthropic", "openai", "custom"] as const;
const TASKS = [
  "brief_generation",
  "draft_generation",
  "seo_aeo_geo_audit",
] as const;

export default function AiSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI providers</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Provider-agnostic pipeline (section 9). Keys live in Supabase Vault /
          Edge Function env, never in the frontend.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          No providers configured. Add rows to <code>ai_providers</code> after
          migrations, with <code>api_key_secret_ref</code> pointing at a Vault
          secret.
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Adapter type</label>
          <select
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            disabled
            defaultValue=""
          >
            <option value="" disabled>
              Select adapter
            </option>
            {ADAPTERS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Assignable tasks</div>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            {TASKS.map((t) => (
              <li key={t}>
                <code>{t}</code>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          disabled
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
        >
          Test connection
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] p-5 text-sm text-[var(--text-secondary)] space-y-2">
        <p className="font-medium text-[var(--text-primary)]">
          Edge Functions (scaffolded)
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>ai-brief-generation</code>
          </li>
          <li>
            <code>ai-draft-generation</code>
          </li>
          <li>
            <code>ai-seo-aeo-geo-audit</code>
          </li>
          <li>
            <code>sitemap-generate</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
