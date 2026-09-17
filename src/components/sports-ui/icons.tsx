// Sports Admin's own inline icon set -- pixel-matched in spirit to the
// design's own ICON_DEFS (24x24 viewBox, stroke="currentColor",
// strokeWidth 1.7, round caps/joins, fill none, rendered ~18x18), same
// hand-drawn-SVG convention media-ui/icons.tsx already established.

import type { CSSProperties } from "react";

type IconProps = { style?: CSSProperties; size?: number };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function DashboardIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function MessagesIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M4 5h16v11H8l-4 4V5z" />
    </svg>
  );
}

export function CalendarIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

export function StudentsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6.5 7-6.5s7 3 7 6.5" />
    </svg>
  );
}

export function TeamsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <path d="M15 8.2a2.6 2.6 0 1 1 3 2.6" />
      <path d="M16 14.3c2.3.4 4 2.3 4 5.7" />
    </svg>
  );
}

export function TrialsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HousesIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function OdIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function PtIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 13.5l1.7 1.7L14.5 11.5" />
    </svg>
  );
}

export function SessionsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function FixturesIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M6 3v18" />
      <path d="M6 4h11l-3 3.5L17 11H6" />
    </svg>
  );
}

export function AchievementsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5L7.5 21 12 18.5 16.5 21 15 13.5" />
    </svg>
  );
}

export function CoachesIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6.5 7-6.5s7 3 7 6.5" />
      <path d="M9 12.5l2 2 3.5-4" />
    </svg>
  );
}

export function InventoryIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M3.5 8l8.5-4.5L20.5 8 12 12.5 3.5 8z" />
      <path d="M3.5 8v8l8.5 4.5 8.5-4.5V8M12 12.5V21" />
    </svg>
  );
}

export function IndentsIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4M9 13h6M9 16.5h4" />
    </svg>
  );
}

export function InjuriesIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function BudgetIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 12.5h8M8 16h5" />
    </svg>
  );
}

export function BellIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function SearchIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function ChevronLeftIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ style, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} style={style}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function PlusIcon({ style, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...base} strokeWidth={2.4} style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
