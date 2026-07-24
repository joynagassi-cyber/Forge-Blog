/**
 * Admin sidebar — every editor function is here.
 * Layout: brand header | nav items | bottom actions (blog + logout)
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "Articles",
    items: [
      { href: "/admin/articles", label: "Tous les articles" },
      { href: "/admin/articles/new", label: "Créer un article" },
      { href: "/admin/articles/calendar", label: "Calendrier éditorial" },
    ],
  },
  {
    label: "Qualité",
    items: [
      { href: "/admin/reviews", label: "Reviews & corrections" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Paramètres",
    items: [
      { href: "/admin/settings/ai", label: "IA Providers" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => href === pathname || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-2 left-2 z-50 p-2 rounded-md bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
      </button>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60
          border-r border-[var(--border)] bg-[var(--surface-1)]
          flex flex-col transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:w-56
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="p-4 border-b border-[var(--border)] shrink-0">
          <Link href="/admin" onClick={() => setOpen(false)} className="font-serif font-semibold text-base tracking-tight text-[var(--text-primary)]">
            Forge-Blog
          </Link>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wide">Éditeur</p>
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[var(--border)] px-2 py-3 space-y-0.5 shrink-0">
          <Link
            href="/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Voir le blog
          </Link>
          <Link
            href="/auth/logout"
            className="block px-2.5 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    </>
  );
}
