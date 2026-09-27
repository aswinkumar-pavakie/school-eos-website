"use client";

// Root-level safety net: catches any render-time failure that isn't already
// caught by a more specific boundary (e.g. (dashboard)/admin/error.tsx, which
// still wins for anything under /admin). Every other dashboard area
// (faculty, parent, principal, finance, etc.) previously had no boundary at
// all and fell straight through to Next's raw default error page -- this is
// purely additive: it only ever engages on an uncaught throw, and changes
// nothing about any page's normal, successful behavior. Same curated style
// as the existing /admin one, generalized (no admin-specific wording).

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 rounded-[16px] border border-border bg-surface p-10 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Something went wrong</p>
        <p className="text-sm text-text-muted">
          Nothing was changed. This is usually momentary — try again in a moment. If it keeps happening, contact your school office.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
