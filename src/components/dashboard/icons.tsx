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

// Dashboard/Students/Teachers/Academics/Staff attendance/Subjects & mapping/
// Class timetable/Exam timetable/Academic calendar/Sports inventory/Repair &
// maintenance/Hostel/Transport/Library/Requests & approvals/Notices below are
// pixel-matched to the reference design's own sidebar nav icon set (SIS
// Principal\Principal Console.dc.html's NAV array, line 985-989) -- same 24px
// viewBox/stroke-only rendering this app already used, so the reference's raw
// path data drops in unchanged. Every nav item this app has that ISN'T in
// that reference (Parents, Finance, Communities, Audit, Reports, Settings,
// Admin's separate Sports module) keeps its own existing icon untouched, per
// explicit instruction -- the reference simply doesn't cover those features.
export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

export function StudentsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
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
      <path d="M3 5h18v11H3zM9 20h6M12 16v4" />
    </svg>
  );
}

export function AttendanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 4h16v16H4zM8 12l3 3 5-6" />
    </svg>
  );
}

export function AcademicsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5h7v14H4zM13 5h7v14h-7z" />
    </svg>
  );
}

/** Subjects & mapping -- no dedicated icon existed before (this nav item
 * reused Academics'); the reference design has its own distinct path. */
export function SubjectMappingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
    </svg>
  );
}

/** Exam timetable -- no dedicated icon existed before (this nav item reused
 * Class timetable's); the reference design has its own distinct path. */
export function ExamTimetableIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 4h6v3H9zM6 7h12v13H6z" />
    </svg>
  );
}

/** Notices -- distinct from the header notification BellIcon (which stays
 * unchanged); the reference design's Notices/announcements nav icon is a
 * megaphone, not a bell. */
export function NoticesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 10v4l10 4V6L4 10zM14 8a4 4 0 010 8" />
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
      <path d="M4 6h16v9H4zM4 11h16M7 15v4M17 15v4" />
    </svg>
  );
}

export function HostelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V20H4zM9.5 20v-6h5v6" />
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
      <path d="M4 6h16v14H4zM4 10.5h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 6h16v14H4zM4 11h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 4h6v16H4zM12 4h3v16h-3zM17 4h3v16h-3z" />
    </svg>
  );
}

export function InventoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" />
    </svg>
  );
}

export function MaintenanceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M14.5 4a4.5 4.5 0 00-4.2 6.1L4 16.4V20h3.6l6.3-6.3A4.5 4.5 0 0014.5 4z" />
    </svg>
  );
}

export function RequestsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-6" />
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

export function CoordinatorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3.5 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6Z" />
      <path d="m9 12 2 2 4-4" />
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

// New feature (AI assistant chat), no reference design to match -- same
// 24px/1.5px-stroke/outline/currentColor set as every icon above, a plain
// chat-bubble glyph.
export function AssistantIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4z" />
      <path d="M8 10h8M8 13h5" />
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
  examTimetable: ExamTimetableIcon,
  subjectMapping: SubjectMappingIcon,
  calendar: CalendarIcon,
  announcements: NoticesIcon,
  audit: AuditIcon,
  library: LibraryIcon,
  inventory: InventoryIcon,
  maintenance: MaintenanceIcon,
  requests: RequestsIcon,
  settings: SettingsIcon,
  profile: IdCardIcon,
  coordinator: CoordinatorIcon,
  sports: SportsIcon,
  assistant: AssistantIcon,
} as const;
