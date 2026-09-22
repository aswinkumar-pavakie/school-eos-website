// Every path below is ported verbatim (same d= data, same viewBox, same
// stroke-width) from the design's own inline navIcons()-equivalent SVGs in
// brain/SIS LIBRARY/School Library Module.dc.html. "reservations" and
// "audit" have no design source (those two nav items are real, working
// screens the design doesn't show -- see LibraryShell's own comment) so
// their icons are new, drawn in the same 2-stroke-path idiom as the rest.

import type { ReactNode } from "react";

export type LibraryIconId =
  | "dashboard"
  | "books"
  | "ebooks"
  | "catrack"
  | "issue"
  | "returns"
  | "overdue"
  | "lost"
  | "history"
  | "members"
  | "reports"
  | "settings"
  | "reservations"
  | "audit"
  | "assistant"
  | "messages";

const PATHS: Record<LibraryIconId, ReactNode> = {
  dashboard: (
    <>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </>
  ),
  books: (
    <>
      <path d="M3 4h5a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H3z" />
      <path d="M17 4h-5a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h5z" />
    </>
  ),
  ebooks: (
    <>
      <rect x="2.5" y="5" width="15" height="10" rx="1.6" />
      <path d="M10 5v10" />
    </>
  ),
  catrack: (
    <>
      <circle cx="6" cy="6" r="3" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
      <path d="M3 17h5" />
    </>
  ),
  issue: (
    <>
      <rect x="4" y="3" width="12" height="14" rx="2" />
      <path d="M7.5 10l2 2 3.5-4" />
    </>
  ),
  returns: (
    <>
      <rect x="4" y="3" width="12" height="14" rx="2" />
      <path d="M10 12V7M7.5 9.5L10 7l2.5 2.5" />
    </>
  ),
  overdue: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4.3l3 1.7" />
    </>
  ),
  lost: (
    <>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v5M10 13.6v.2" />
    </>
  ),
  history: (
    <>
      <path d="M3 10a7 7 0 1 0 2.1-5" />
      <path d="M3 3v3.5h3.5" />
      <path d="M10 6.5V10l2.6 1.6" />
    </>
  ),
  members: (
    <>
      <circle cx="7.5" cy="7" r="2.8" />
      <path d="M2.5 16c.6-2.8 2.6-4.2 5-4.2s4.4 1.4 5 4.2" />
      <circle cx="14.5" cy="7.6" r="2.2" />
    </>
  ),
  reports: (
    <>
      <path d="M5 2.5h7L15.5 6v11.5h-11z" />
      <path d="M7.5 10h5M7.5 13h5" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.6" />
      <circle cx="10" cy="10" r="7" />
    </>
  ),
  reservations: (
    <>
      <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
      <path d="M8 2.5v6l2-1.6 2 1.6v-6" />
    </>
  ),
  audit: (
    <>
      <rect x="3.5" y="3" width="13" height="14" rx="2" />
      <path d="M7 7.5h6M7 10.5h6M7 13.5h4" />
    </>
  ),
  // New feature (AI assistant chat), also no design source -- same
  // 2-stroke-path idiom as reservations/audit above.
  assistant: (
    <>
      <path d="M3 4.5h14v9.5H8l-3.5 3v-3H3z" />
      <path d="M6.5 8.5h7M6.5 11h4.5" />
    </>
  ),
  // Real E2EE messaging, no design source -- same 2-stroke-path idiom,
  // distinct from the assistant icon above.
  messages: (
    <>
      <path d="M2.5 5h15v9H9l-3 2.5V14h-3.5z" />
      <path d="M6 8.5h7.5M6 11h5" />
    </>
  ),
};

export function NavIcon({ id, stroke, size = 17 }: { id: LibraryIconId; stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.6} style={{ flex: "0 0 auto" }}>
      {PATHS[id]}
    </svg>
  );
}

export function SearchIcon({ size = 17, stroke = "#94A3B8" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.7} style={{ flex: "0 0 auto" }}>
      <circle cx="9" cy="9" r="5.6" />
      <path d="M13.2 13.2L17 17" />
    </svg>
  );
}

export function CampusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#1D4ED8" strokeWidth={1.6}>
      <path d="M10 2.5l6.5 3-6.5 3-6.5-3z" />
      <path d="M3.5 9.5l6.5 3 6.5-3M3.5 13l6.5 3 6.5-3" />
    </svg>
  );
}

export function SettingsGearIcon({ stroke = "currentColor" }: { stroke?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.6}>
      <circle cx="10" cy="10" r="2.6" />
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}

export function BellIcon({ stroke = "currentColor" }: { stroke?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.6}>
      <path d="M5.5 8a4.5 4.5 0 0 1 9 0c0 3.5 1.2 4.6 1.2 4.6H4.3S5.5 11.5 5.5 8z" />
      <path d="M8.4 15.2a1.8 1.8 0 0 0 3.2 0" />
    </svg>
  );
}

export function SignOutIcon({ stroke = "currentColor" }: { stroke?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.6}>
      <path d="M12 3.5H5.5v13H12" />
      <path d="M10 10h6.5M14 7.5l2.5 2.5L14 12.5" />
    </svg>
  );
}

export function EditIcon({ stroke = "currentColor" }: { stroke?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={1.6}>
      <path d="M13.5 3.5l3 3-8.5 8.5H5v-3z" />
    </svg>
  );
}

export function CloseXIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}
