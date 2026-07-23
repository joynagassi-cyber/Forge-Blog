import Link from "next/link";

/**
 * Landing page — point d'entrée unique.
 * Deux options claires : consulter le blog ou écrire des articles.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg)] via-[var(--surface-1)] to-[var(--bg)] px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] tracking-tight">
            Forge-Blog
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
            Sciences cognitives, sans jargon.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Choisir</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Two big buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Button 1: Public blog */}
          <Link
            href="/fr"
            className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="space-y-1">
              <span className="block text-base font-semibold text-[var(--text-primary)]">
                Lire le blog
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                Articles et publications
              </span>
            </div>
          </Link>

          {/* Button 2: Editor / Admin */}
          <Link
            href="/admin"
            className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div className="space-y-1">
              <span className="block text-base font-semibold text-[var(--text-primary)]">
                Éditeur
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                Connexion requise
              </span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-[var(--text-muted)] pt-4">
          Écrit par les équipes Forge · Sciences de l'apprentissage
        </p>
      </div>
    </div>
  );
}
