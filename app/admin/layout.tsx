import AdminAuthGate from "./AdminAuthGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGate>
      <div className="min-h-screen flex bg-[var(--bg)]">
        <AdminSidebar />
        <div className="flex-1 min-w-0 lg:ml-0">
          <header className="h-14 border-b border-[var(--border)] flex items-center px-6 justify-between lg:pl-6 pl-16">
            <span className="text-sm text-[var(--text-muted)]">
              Auth: Google OAuth via Supabase
            </span>
            <span
              className="text-xs rounded-full bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]"
              id="admin-auth-badge"
            >
              Checking…
            </span>
          </header>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </AdminAuthGate>
  );
}
