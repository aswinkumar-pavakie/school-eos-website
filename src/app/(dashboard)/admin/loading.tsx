// Shown instantly while an admin page's server data loads, so a slow query
// reads as "loading" instead of a frozen click.

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-[1024px] animate-pulse" role="status" aria-label="Loading">
      <div className="h-9 w-56 rounded-[10px] bg-field" />
      <div className="mt-3 h-4 w-96 max-w-full rounded-[8px] bg-field" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[16px] border border-border bg-surface" />
        ))}
      </div>
      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[22px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mb-3 h-8 rounded-[8px] bg-field last:mb-0" />
        ))}
      </div>
    </div>
  );
}
