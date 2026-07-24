/**
 * Admin sidebar — persistent on desktop, hamburger on mobile.
 * Uses CSS variables from globals.css for consistent theming.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/articles/calendar", label: "Calendrier" },
  { href: "/admin/articles/new", label: "Créer un article" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings/ai", label: "IA Providers" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 1024;

  useEffect(() => {
    if (open && !isMobile()) setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {/* Sidebar panel — always visible on lg+, slide-in on mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-56 lg:w-64
          border-r border-[var(--border)] bg-[var(--surface-1)]
          flex flex-col transition-transform duration-200 ease-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="p-4 border-b border-[var(--border)] shrink-0">
          <Link href="/admin" onClick={() => setOpen(false)} className="font-serif font-semibold text-lg tracking-tight text-[var(--text-primary)]">
            Forge-Blog
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Administration</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const active = item.href === pathname || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  block rounded-md px-3 py-2 text-sm transition-colors
                  ${active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-[var(--border)] px-2 py-3 space-y-1 shrink-0">
          <Link
            href="/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Voir le blog
          </Link>

          <ThemeToggle />

          <Link
            href="/auth/logout"
            className="block px-3 py-2 rounded-md text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
