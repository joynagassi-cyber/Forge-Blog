"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"setup" | "login">("setup");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "setup") {
      if (password.length < 4) { setError("Minimum 4 caractères."); return; }
      if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    } else {
      if (!password) { setError("Mot de passe requis."); return; }
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "setup" ? "/api/admin/setup" : "/api/admin/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok && mode === "login") {
        // Login successful — go to admin dashboard directly
        window.location.href = "/admin";
      } else if (data.ok && mode === "setup") {
        // Setup done — now switch to login form
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Erreur.");
      }
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <form onSubmit={handleSubmit} className="max-w-sm w-full space-y-5 bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-6 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-xl text-[var(--text-primary)]">{mode === "setup" ? "Configuration initiale" : "Connexion éditeur"}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {mode === "setup"
              ? "Définis ton mot de passe pour la première fois."
              : "Entre ton mot de passe pour accéder à l'éditeur."}
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-xs bg-red-50 dark:bg-red-950/30 rounded-md px-3 py-2">{error}</div>
        )}

        {mode === "setup" && (
          <>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mot de passe</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 4 caractères" autoFocus className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Confirmer</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Retape le mot de passe" className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--accent)] text-white py-2 rounded-md font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">
              {loading ? "Enregistrement..." : "Définir le mot de passe"}
            </button>
          </>
        )}

        {mode === "login" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="loginPassword" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mot de passe</label>
              <input id="loginPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ton mot de passe" autoFocus className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[var(--accent)] text-white py-2 rounded-md font-semibold text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            <p className="text-center text-[10px] text-[var(--text-muted)]">
              Mot de passe défini plus tôt via /admin/setup
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
