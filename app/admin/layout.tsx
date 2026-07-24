/**
 * Admin layout — sidebar on left, content area with sticky header bar.
 */
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Persistent sidebar on lg+, overlay on mobile */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-[var(--border)] bg-[var(--surface-1)]/80 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between">
          {/* Spacer for mobile hamburger */}
          <div className="lg:hidden w-10" />

          <div className="hidden lg:block text-xs text-[var(--text-muted)] ml-4">
            Forge-Blog · Administration
          </div>

          <Link href="/admin/articles/new">
            <button className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] text-white font-semibold px-3 py-1.5 text-xs hover:bg-[var(--accent-hover)] transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouvel article
            </button>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
