/**
 * Admin layout — sidebar + sticky top bar + content area.
 */
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar — always visible on lg+, slide-in on mobile */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-12 border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-sm px-3 sm:px-6 flex items-center justify-between">
          <span className="hidden lg:block text-xs text-[var(--text-muted)]">Éditeur · Forge-Blog</span>

          <Link href="/admin/articles/new" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] text-white font-medium px-2.5 py-1.5 text-xs hover:bg-[var(--accent-hover)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Nouvel article</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
