// Transport's own header chrome -- the "Transport officer" shield pill +
// academic-year pill + Term pill, pixel-matched to the SIS Transport
// mockup's literal header markup (Transport Module.dc.html lines 41-44):
// verified_user shield icon (18px, accent #1D4ED8) + "Transport officer"
// (13.5px/700/#0F172A), year pill outlined (13.5px/700/#334155, not filled --
// only Term is filled with the accent), Term pill filled with this role's own
// accent #1D4ED8 (not Principal's navy -- see ReframeHeaderChrome's own
// version for why this isn't reused verbatim). Replaces Shell's own default
// "{roleLabel} · Institution" pill entirely (Shell's hideRolePill, set by
// this role's layout) rather than showing both. The "+" button is the
// mockup's own `openAdd` -- no real single "quick add" action exists across
// buses/routes/drivers for this role (creating any of those three stays
// Admin-only), so it's shown disabled rather than wired to something fake.

import { MaterialIcon } from "./MaterialIcon";

interface TransportHeaderChromeProps {
  academicYearName?: string | null;
  termName?: string | null;
}

export function TransportHeaderChrome({ academicYearName, termName }: TransportHeaderChromeProps) {
  return (
    <>
      <span className="hidden items-center gap-2 whitespace-nowrap rounded-[10px] border border-border px-3 py-[9px] text-[13.5px] font-bold text-text md:flex">
        <MaterialIcon name="verified_user" size={18} className="text-primary" />
        Transport officer
      </span>
      {academicYearName && (
        <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border bg-surface px-3 py-[9px] text-[13.5px] font-bold text-[#334155] md:flex">
          {academicYearName}
        </span>
      )}
      {termName && (
        <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-primary px-3 py-[9px] text-[13.5px] font-bold text-white md:flex">
          {termName}
        </span>
      )}
      <button
        type="button"
        disabled
        title="No single quick-add action applies across Buses/Routes/Drivers"
        aria-disabled
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border text-[16px] text-[#334155] opacity-60"
      >
        +
      </button>
    </>
  );
}
