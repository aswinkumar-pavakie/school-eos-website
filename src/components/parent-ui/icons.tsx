// Nav icon path data ported verbatim from the design's own navDefs
// (brain/Copy of Parent web login design/Parent Web Portal.dc.html) --
// same viewBox/stroke conventions as every other pixel-rebuilt module.

const ICON_PATHS = {
  home: "M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v6H4zM14 16h6v6h-6z",
  notices: "M4 10l13-5v11L4 14zM7 14v5",
  dailytasks: "M6 4h12v17H6zM9 3h6v3H9zM9 11h6M9 15h4",
  online: "M3 7h11v10H3zM14 11l6-3.5v9L14 13",
  academics: "M12 6l9-3v13l-9 3-9-3V3zM12 6v13",
  timetable: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5.5l3.5 2",
  calendar: "M4 6h16v15H4zM8 3v4M16 3v4M4 10h16",
  attendance: "M4 4h16v16H4zM8.5 12.5l2.5 2.5 4.5-5",
  performance: "M4 17l5-5 3 3 6-7M15 8h5v5",
  fees: "M3 6h18v12H3zM3 10h18M6.5 14h3",
  meetings:
    "M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 20.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5M17 5.2a3.3 3.3 0 0 1 0 6.4M18.5 15.3c1.9.9 2.9 2.5 2.9 5.2",
  library: "M4 4h5v16H4zM11 4h5v16h-5zM18.2 5l3 14.6",
  messages: "M4 5h16v11H8.5L4 20.5z",
  documents: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4",
  feedback:
    "M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.9l6-.9z",
  bus: "M4 6h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 12h16M7 17v2M17 17v2M7 9h3M14 9h3",
  leave: "M14 4h6v16h-6M10 8l-5 4 5 4M5 12h11",
  permissions: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z M9 12l2 2 4-4",
  myclass: "M4 5h16v11H8.5L4 20.5zM8 9h8M8 12.5h5",
} as const;

export type ParentIconId = keyof typeof ICON_PATHS;

export function NavIcon({ id, style }: { id: ParentIconId; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 18, height: 18, flex: "none", ...style }}
    >
      <path d={ICON_PATHS[id]} />
    </svg>
  );
}
