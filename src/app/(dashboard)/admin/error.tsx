"use client";

// Catches any render-time failure across every /admin/* page (a backend
// restart mid-request, a genuinely unhandled exception, etc.) and shows this
// instead of Next.js's raw dev-mode crash overlay. Each page still has its own
// "Couldn't load X" fallback for a clean !res.ok -- this is the safety net for
// everything that isn't that (fetch() itself rejecting because the backend was
// unreachable, for one).

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 rounded-[16px] border border-border bg-surface p-10 text-center">
      <p className="text-[15px] font-extrabold leading-[20px] text-text">Something went wrong loading this page</p>
      <p className="text-sm text-text-muted">
        Nothing was changed. This is usually momentary (e.g. the server restarting) — try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
