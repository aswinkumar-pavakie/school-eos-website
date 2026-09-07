// One icon set, 24px, 1.5px stroke, outline only, currentColor -- Design
// Architecture v0.1 section 15. Kept inline (no icon package) since the set is
// small and fixed: a new module never introduces a new nav icon.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function StudentsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3.5 2.5 8 12 12.5 21.5 8 12 3.5Z" />
      <path d="M6 10.2v5.3c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.3" />
      <path d="M21.5 8v6" />
    </svg>
  );
}

export function ParentsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M3.5 20c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2" />
      <path d="M14 20c0-2.4 1.6-4.2 3.8-4.6 1.6-.3 3.2.5 3.7 1.8" />
    </svg>
  );
}

export function FacultyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="7" width="17" height="12" rx="1.8" />
      <path d="M8.5 7V5.7A1.7 1.7 0 0 1 10.2 4h3.6a1.7 1.7 0 0 1 1.7 1.7V7" />
      <path d="M3.5 12h17" />
    </svg>
  );
}

export function AttendanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="4.5" y="4.5" width="15" height="16" rx="2" />
      <path d="M8.5 3v3M15.5 3v3" />
      <path d="m8.5 13 2.2 2.2L15.5 11" />
    </svg>
  );
}

export function AcademicsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5.5c0-.6.5-1 1.1-1H11a3 3 0 0 1 1 .2V19a3 3 0 0 0-1-.2H5.1c-.6 0-1.1-.4-1.1-1V5.5Z" />
      <path d="M20 5.5c0-.6-.5-1-1.1-1H13a3 3 0 0 0-1 .2V19a3 3 0 0 1 1-.2h5.9c.6 0 1.1-.4 1.1-1V5.5Z" />
    </svg>
  );
}

export function CommunitiesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16.5" cy="9" r="3" />
      <path d="M3 19.5c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M11.5 14.7c.8-.7 1.9-1.2 3-1.2 2.8 0 5 2.2 5 5" />
    </svg>
  );
}

export function TransportIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="11" rx="2" />
      <path d="M3.5 10.5h17" />
      <circle cx="7.5" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
    </svg>
  );
}

export function HostelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 20V9.5L12 4l8 5.5V20" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function FinanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9" />
      <path d="M14.7 9.7c-.4-.9-1.4-1.4-2.7-1.4-1.6 0-2.7.8-2.7 1.9 0 1.2 1 1.6 2.7 2 1.7.4 2.7.9 2.7 2.1 0 1.1-1.1 1.9-2.7 1.9-1.3 0-2.3-.5-2.7-1.4" />
    </svg>
  );
}

export function ReportsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4.5 20V10" />
      <path d="M11 20V4" />
      <path d="M17.5 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.6a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.2 7.5a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H8.8a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

export function SportsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="10.5" r="6" />
      <path d="M12 4.5v12" />
      <path d="M6 10.5h12" />
      <path d="M9 16.5v3M15 16.5v3M9 19.5h6" />
    </svg>
  );
}

export function IdCardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.5 16c.5-1.7 1.9-2.6 2.5-2.6s2 .9 2.5 2.6" />
      <path d="M14.5 10h3.5M14.5 13h3.5" />
    </svg>
  );
}

export function TimetableIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 4.5v-1.5M16 4.5v-1.5" />
      <path d="M7.5 13h2M7.5 16h2M11.5 13h2M11.5 16h2M15.5 13h2M15.5 16h2" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 4.5v-1.5M16 4.5v-1.5" />
      <circle cx="8.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="16.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InventoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 8v8l8.5 4 8.5-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

export function MaintenanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M14.7 9.3a3.5 3.5 0 0 1-4.6 4.6L4.5 19.5 2.5 17.5l5.6-5.6a3.5 3.5 0 0 1 4.6-4.6l-2.2 2.2 1.4 1.4 2.2-2.2Z" />
    </svg>
  );
}

export function RequestsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5V5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3.5" />
      <path d="M8.5 12h7M8.5 15.5h4" />
      <path d="m8.5 9 1.5 1.5L12.5 8" />
    </svg>
  );
}

export function AuditIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v3.2h3.2" />
      <path d="M12 8.5v4l2.8 1.6" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m19.5 19.5-3.9-3.9" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function CollapseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M15 5 8.5 12l6.5 7" />
    </svg>
  );
}

export const NAV_ICONS = {
  dashboard: DashboardIcon,
  students: StudentsIcon,
  parents: ParentsIcon,
  faculty: FacultyIcon,
  attendance: AttendanceIcon,
  academics: AcademicsIcon,
  community: CommunitiesIcon,
  transport: TransportIcon,
  hostel: HostelIcon,
  finance: FinanceIcon,
  reports: ReportsIcon,
  timetable: TimetableIcon,
  calendar: CalendarIcon,
  announcements: BellIcon,
  audit: AuditIcon,
  inventory: InventoryIcon,
  maintenance: MaintenanceIcon,
  requests: RequestsIcon,
  settings: SettingsIcon,
} as const;
