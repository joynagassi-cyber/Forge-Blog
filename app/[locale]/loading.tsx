export default function LocaleLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
        <div className="space-y-4">
          <div className="h-10 bg-[var(--surface-2)] rounded w-3/4" />
          <div className="h-6 bg-[var(--surface-2)] rounded w-1/2" />
          <div className="h-4 bg-[var(--surface-2)] rounded w-2/3" />
        </div>
        <div className="aspect-[16/9] bg-[var(--surface-2)] rounded-xl" />
      </div>

      {/* Articles grid skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden"
          >
            <div className="aspect-video bg-[var(--surface-2)]" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-[var(--surface-2)] rounded w-3/4" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-full" />
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
