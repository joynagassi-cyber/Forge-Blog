import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/articles/new", label: "Create" },
  { href: "/admin/settings/ai", label: "AI providers" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <aside className="w-56 border-r border-[var(--border)] bg-[var(--surface-1)] p-4 flex flex-col gap-6 shrink-0">
        <div>
          <Link
            href="/admin"
            className="font-semibold text-[var(--text-primary)]"
          >
            Forge Editorial
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-1">Dashboard</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <ThemeToggle />
          <Link
            href="/en"
            className="block text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            ← Public blog
          </Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-14 border-b border-[var(--border)] flex items-center px-6 justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            Auth: Google OAuth via Supabase (wire when project is connected)
          </span>
          <span className="text-xs rounded-full bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
            Demo mode
          </span>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
