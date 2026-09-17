// Every path below is ported verbatim (same d= data, same viewBox 0 0 24 24,
// same stroke-width 1.6-1.8) from the design's own inline SVGs in
// brain/SIS HOSTEL WARDEN/Warden Console.dc.html.

export type HostelWardenIconId =
  | "dashboard"
  | "approvals"
  | "students"
  | "leave"
  | "study"
  | "gate"
  | "hostels"
  | "rooms"
  | "fees"
  | "complaints"
  | "reports";

const PATHS: Record<HostelWardenIconId, string> = {
  dashboard: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-5H3zM13 8h8V3h-8z",
  approvals: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.9",
  leave: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v4M10 16h4",
  study: "M12 6v14M12 6C10 4 7 4 3 5v13c4-1 7-1 9 1M12 6c2-2 5-2 9-1v13c-4-1-7-1-9 1",
  gate: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  hostels: "M3 21V8l9-5 9 5v13M9 21v-5h6v5",
  rooms: "M3 3h18v18H3zM3 9h18M9 21V9",
  fees: "M2 7h20v10H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M6 12h.01M18 12h.01",
  complaints: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM12 8v4M12 14h.01",
  reports: "M3 3v18h18M7 16V10M12 16V6M17 16v-4",
};

export function NavIcon({ id, stroke, size = 18 }: { id: HostelWardenIconId; stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
      <path d={PATHS[id]} />
    </svg>
  );
}

export function SearchIcon({ size = 16, stroke = "#2a52d8" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
    </svg>
  );
}

export function BellIcon({ stroke = "#2a52d8" }: { stroke?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function ChevronRightIcon({ stroke = "#9aa4b0" }: { stroke?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CloseXIcon({ size = 17, stroke = "currentColor" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon({ size = 16, stroke = "#2a52d8" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
