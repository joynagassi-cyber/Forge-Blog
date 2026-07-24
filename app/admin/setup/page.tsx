"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Initial setup page — defines admin password on first use.
 * Only accessible when admin_credentials table is empty.
 */
export default function AdminSetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) {
      setError("Minimum 4 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.ok) {
        // Redirect to login page now that password is defined
        window.location.href = "/admin/login";
      } else {
        setError(data.error || "Erreur lors de la définition du mot de passe.");
      }
    } catch {
      setError("Impossible de se connecter à l'API. Vérifie que la table admin_credentials existe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full space-y-6 bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-[var(--text-primary)]">Configuration initiale</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Définissez votre mot de passe administrateur</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 rounded-md px-3 py-2">{error}</div>
        )}

        <p className="text-xs text-[var(--text-secondary)]">
          ⚠️ Cette page n'est visible qu'une seule fois. Après cela, utilisez la page de connexion.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 4 caractères"
              autoFocus
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Définir le mot de passe"}
        </button>
      </form>
    </div>
  );
}
