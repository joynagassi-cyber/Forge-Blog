"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarArticle = {
  id: string;
  title: string;
  locale: string;
  status: string;
  pillar_slug: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  cover_image_url?: string | null;
};

type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  articles: CalendarArticle[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  scheduled: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  drafting: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  in_review: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
  idea: "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400",
};

// ---------------------------------------------------------------------------
// Month navigation
// ---------------------------------------------------------------------------

function useMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const next = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else { setMonth((m) => m + 1); }
  };

  const prev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else { setMonth((m) => m - 1); }
  };

  const today = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return { year, month, next, prev, today };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCalendarGrid(year: number, month: number, articles: CalendarArticle[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon-first
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const today = new Date();
  const todayStr = today.toDateString();

  const articleMap = new Map<string, CalendarArticle[]>();
  for (const a of articles) {
    const dateKey = a.scheduled_at?.slice(0, 10) ?? a.published_at?.slice(0, 10);
    if (!dateKey) continue;
    const list = articleMap.get(dateKey) ?? [];
    list.push(a);
    articleMap.set(dateKey, list);
  }

  const days: CalendarDay[] = [];

  for (let i = 0; i < totalCells; i++) {
    const offset = i - startPad;
    const date = new Date(year, month, offset + 1);
    const day = date.getDate();
    const isCurrentMonth = offset >= 0 && offset < lastDay.getDate();
    const dateStr = date.toDateString();
    const dateKey = dateStr === todayStr
      ? todayStr
      : `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Find articles for this day by ISO date string
    const isoKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayArticles = articleMap.get(isoKey) ?? [];

    days.push({
      date,
      day,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      articles: dayArticles,
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  articles: CalendarArticle[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorialCalendar({ articles }: Props) {
  const { year, month, next, prev, today } = useMonth();

  const calendarDays = useMemo(
    () => buildCalendarGrid(year, month, articles),
    [year, month, articles]
  );

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={today}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prev}
            className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {DAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-xs font-medium text-[var(--text-muted)] text-center border-r border-[var(--border)] last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid grid-cols-7 border-b border-[var(--border)] last:border-b-0"
          >
            {week.map((day, di) => (
              <div
                key={di}
                className={`min-h-[120px] border-r border-[var(--border)] last:border-r-0 p-1.5 transition-colors ${
                  !day.isCurrentMonth
                    ? "bg-[var(--surface-1)]/40"
                    : "bg-[var(--surface-1)]"
                } ${day.isToday ? "ring-2 ring-inset ring-[var(--accent)]" : ""}`}
              >
                <span
                  className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                    day.isToday
                      ? "bg-[var(--accent)] text-white"
                      : day.isCurrentMonth
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]"
                  }`}
                >
                  {day.day}
                </span>

                {/* Article events */}
                <div className="mt-1 space-y-0.5">
                  {day.articles.slice(0, 3).map((a) => (
                    <Link
                      key={a.id}
                      href={`/admin/articles/${a.id}`}
                      className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight transition-colors hover:opacity-80 ${
                        STATUS_BADGE[a.status] ?? STATUS_BADGE.drafting
                      }`}
                      title={`${a.title} (${a.locale})`}
                    >
                      {a.title}
                    </Link>
                  ))}
                  {day.articles.length > 3 && (
                    <span className="block text-[10px] text-[var(--text-muted)] px-1">
                      +{day.articles.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/40" /> Published
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-blue-500/40" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/40" /> Drafting
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-violet-500/40" /> In review
        </span>
      </div>
    </div>
  );
}
