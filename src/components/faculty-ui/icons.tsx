// Faculty portal icon set -- ported verbatim from the design's own navIcons()
// (brain/SIS Class teacher/Class Teacher Portal.dc.html). Nav icons: 2 <path>s,
// stroke-width 1.7, 18x18 in the sidebar. Other UI icons here follow the
// design's own stroke-width-2 convention. Separate file from
// src/components/dashboard/icons.tsx -- doesn't touch it, other roles unaffected.

type IconProps = { className?: string };

const NAV_ICON_PATHS: Record<string, [string, string]> = {
  dashboard: ["M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z", ""],
  reports: ["M4 16.5l5-5 3.5 2.5L19 6", "M3 20h18 M15 6h4v4"],
  notice: ["M3 11l12-5v12L3 13z", "M6 13.5V17a2 2 0 0 0 4 0"],
  calendar: ["M4 6h16v14H4z", "M8 3v4 M16 3v4 M4 11h16"],
  timetable: ["M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", "M12 8v4.5l3 2"],
  students: [
    "M9 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M2 21c0-3.8 3.3-5.8 7-5.8s7 2 7 5.8 M17 4.3a3.8 3.8 0 0 1 0 6.9 M18.5 15.4c2.1.8 3.5 2.4 3.5 5.6",
  ],
  attendance: ["M4 5h16v15H4z", "M8 12.5l2.5 2.5L16 9"],
  performance: ["M4 17l5-5 3.5 2.5L20 7", "M4 21h16 M16 7h4v4"],
  fees: ["M3 7h18v11H3z", "M3 11h18 M15 15h3"],
  leave: ["M10 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M3 21c0-3.6 3.2-5.5 7-5.5 M15.5 17.5l2 2 4-4"],
  exam: ["M6 6h12v15H6z", "M9 3h6v3H9z M10 12h5 M10 16h5"],
  permissions: ["M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z", "M9 12l2.2 2.2L16 9.5"],
  "sub-homework": ["M12 16V5", "M8 9l4-4 4 4 M4 19h16"],
  "sub-online": ["M3 6h12v12H3z", "M15 10l6-4v12l-6-4"],
  "sub-term": ["M4 5h7v15H4z", "M13 5h7v15h-7"],
  "sub-exams": ["M6 6h12v15H6z", "M9 3h6v3H9z M10 12h5"],
  "sub-marks": ["M4 20h4l10-10-4-4L4 16z", "M14 6l4 4"],
  "sub-message": ["M21 12a8 8 0 0 1-8 8H8l-5 3 1.6-4.6A8 8 0 1 1 21 12z", ""],
  "emp-attendance": ["M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", "M12 8v4.5l3 2"],
  "emp-leave": ["M4 6h16v14H4z", "M8 3v4 M16 3v4 M10 13l4 4 M14 13l-4 4"],
  "emp-od": ["M3 8h18v11H3z", "M9 8V5h6v3 M3 13h18"],
  "emp-payroll": [
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    "M9.5 8h5 M9.5 11h5 M13 11c0 2.5-3.5 2-3.5 2l4 3.5",
  ],
  "emp-payslip": ["M6 3h12v18l-3-2-3 2-3-2-3 2z", "M9.5 8h5 M9.5 12h5"],
  "emp-appraisal": ["M12 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z", "M9 12.5L7 21l5-2.8 5 2.8-2-8.5"],
  "emp-library": ["M4 4h5v16H4z", "M11 4h5v16h-5 M18 6l3 14"],
  // Not in navIcons() (design reuses coordinator/sports/bus icons from the
  // sitewide set conceptually) -- simple, consistent placeholders in the same
  // 2-path style for the MORE group this rebuild adds back.
  coordinator: ["M12 3.5 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6Z", "m9 12 2 2 4-4"],
  sports: ["M12 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z", "M12 4.5v12 M6 10.5h12"],
  bus: ["M3.5 5.5h17v11h-17z", "M3.5 10.5h17 M7.5 19v-1.5M16.5 19v-1.5"],
  // New feature (AI assistant chat), no reference design equivalent -- same
  // 2-path/1.7-stroke placeholder convention as coordinator/sports/bus above.
  assistant: ["M4 5.5h16v11H9l-4 3.5v-3.5H4z", "M8 10h8 M8 13h5"],
  // Campus + mobile-parity items (Food Court, Medical, Feedback, House, Hostel, Events) -- same
  // 2-path/1.7-stroke convention as the rest of this set.
  food: ["M6 3v8a2 2 0 0 0 2 2v8 M10 3v8 M18 3c-2 1.5-3 4-3 7h3v11", ""],
  medical: ["M12 5v14 M5 12h14", "M4 4h16v16H4z"],
  feedback: ["M4 5h16v11H9l-5 4z", "M8 9h8 M8 12h5"],
  house: ["M4 11l8-7 8 7", "M6 10v10h12V10 M10 20v-5h4v5"],
  hostel: ["M3 20V9l9-5 9 5v11", "M3 20h18 M8 20v-6h8v6"],
  events: ["M4 6h16v14H4z", "M8 3v4 M16 3v4 M9 14l2 2 4-4"],
};

export function NavIcon({
  id,
  className,
  stroke,
}: {
  id: keyof typeof NAV_ICON_PATHS;
  className?: string;
  stroke: string;
}) {
  const paths = NAV_ICON_PATHS[id] ?? ["M5 12h14", ""];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={paths[0]} />
      {paths[1] ? <path d={paths[1]} /> : null}
    </svg>
  );
}

export type NavIconId = keyof typeof NAV_ICON_PATHS;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} width="15" height="15" stroke="#94a3b8" strokeWidth={2} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} width="14" height="14" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="#94a3b8" strokeWidth={2} className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} width="14" height="14" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
