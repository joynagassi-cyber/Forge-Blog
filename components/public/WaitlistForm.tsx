"use client";

import { Button } from "@/components/shared/Button";
import type { FormEvent } from "react";

type Props = {
  placeholder: string;
  cta: string;
  showOptional?: boolean;
  optionalLabel?: string;
};

export function WaitlistForm({ placeholder, cta, showOptional, optionalLabel }: Props) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const domain = formData.get("domain") as string;
    if (!email) return;

    // FUTURE: send to SCYForge backend
    console.log("Waitlist signup:", { email, domain: domain || undefined });

    // Show success feedback
    const btn = form.querySelector("button[type=submit]") as HTMLButtonElement;
    const originalText = btn.textContent;
    if (btn) {
      btn.textContent = `✓ ${originalText || ""}`;
      btn.disabled = true;
    }
    setTimeout(() => {
      form.reset();
      if (btn) {
        btn.textContent = originalText || "";
        btn.disabled = false;
      }
    }, 2000);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder={placeholder}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        />
        <Button type="submit" shimmer>
          {cta}
        </Button>
      </div>
      {showOptional && optionalLabel && (
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">
            {optionalLabel}
          </label>
          <select
            name="domain"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <option value="">—</option>
            <option value="cybersecurity">Cybersecurity</option>
            <option value="software">Software Engineering</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="research">Research</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}
    </form>
  );
}
