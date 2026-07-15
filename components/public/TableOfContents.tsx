"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function TableOfContents({
  items,
  label,
}: {
  items: TocItem[];
  label: string;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const list = (
    <nav aria-label={label} className="text-sm">
      <div className="font-semibold text-[var(--text-muted)] uppercase tracking-wide text-xs mb-3">
        {label}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${item.id}`}
              className={
                active === item.id
                  ? "font-semibold text-[var(--accent)] underline decoration-2 underline-offset-4"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile collapsible */}
      <div className="lg:hidden mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {label}
          <span aria-hidden>{open ? "▴" : "▾"}</span>
        </button>
        {open && <div className="px-4 pb-4">{list}</div>}
      </div>

      {/* Desktop sticky */}
      <div className="hidden lg:block sticky top-20">{list}</div>
    </>
  );
}
