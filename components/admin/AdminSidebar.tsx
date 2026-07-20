"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/articles/calendar", label: "Calendar" },
  { href: "/admin/articles/new", label: "Create" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings/ai", label: "AI providers" },
];

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close sidebar on route change (Link clicks close it)
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lg:hidden fixed top-3 left-3 z-50 rounded-md p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        aria-label={open ? "Close sidebar navigation" : "Open sidebar navigation"}
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </>
          )}
        </svg>
      </button>

      {/* Overlay backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-56 border-r border-[var(--border)] bg-[var(--surface-1)] p-4 flex flex-col gap-6 shrink-0
          transition-transform duration-200 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Admin navigation"
      >
        <div>
          <Link
            href="/admin"
            className="font-semibold text-[var(--text-primary)]"
            onClick={close}
          >
            Forge-Blog
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-1">Dashboard</p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin pages">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              onClick={close}
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
    </>
  );
}
