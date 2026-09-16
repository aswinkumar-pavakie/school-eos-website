// Shared header chrome for the design reframe -- the academic-year pill, the
// term pill, and the Messages button, matching the approved mockup exactly.
// Rendered via Shell's `headerExtra` slot (right of search, left of the role
// pill) on every reframed role's layout (Principal/Admin/Vice Principal).
//
// Messages button: visual only, by explicit user decision -- no real
// messaging/chat backend exists yet, building one is deferred. No fake unread
// count is shown (the mockup's "10" badge is not real data); the button
// currently does nothing on click rather than link to a page that doesn't
// exist. Replace this with a real link + real count once the messaging
// feature is actually built.

interface ReframeHeaderChromeProps {
  academicYearName?: string | null;
  termName?: string | null;
}

export function ReframeHeaderChrome({ academicYearName, termName }: ReframeHeaderChromeProps) {
  return (
    <>
      {academicYearName && (
        <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-text md:flex">
          {academicYearName}
        </span>
      )}
      {termName && (
        <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#0f2342] px-3.5 py-2 text-[13px] font-bold text-white md:flex">
          {termName}
        </span>
      )}
      <button
        type="button"
        disabled
        title="Messaging is coming in a later phase"
        aria-disabled
        className="hidden shrink-0 items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-white opacity-90 md:flex"
      >
        Messages
      </button>
    </>
  );
}
