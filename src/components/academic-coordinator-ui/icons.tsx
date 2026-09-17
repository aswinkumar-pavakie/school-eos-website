// Every path below is ported verbatim (same d= data, same viewBox 0 0 24 24,
// stroke-width 1.7) from the design's own `ICONS` map in
// brain/SIS ACAD co-ord/Academic Coordinator Portal.dc.html.

export type AcademicCoordinatorIconId =
  | "dashboard"
  | "reports"
  | "notice"
  | "messages"
  | "students"
  | "teachers"
  | "planning"
  | "attendance"
  | "performance"
  | "syllabus"
  | "analytics"
  | "approvals"
  | "examSetup"
  | "marksWindow"
  | "timetable"
  | "teacherTt"
  | "substitute"
  | "marksVerify";

const PATHS: Record<AcademicCoordinatorIconId, string> = {
  dashboard: "M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z",
  reports: "M4 19V5M4 16l5-5 4 3 7-8",
  notice: "M4 10v4h3l5 4V6L7 10zM17 8a5 5 0 0 1 0 8",
  messages: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  students: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5M17 8.5a2.8 2.8 0 1 0 0-5M18 20c0-2.4-1-4.2-2.6-5.2",
  teachers: "M12 4 2.5 8.5 12 13l9.5-4.5zM6 11v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3V11M21.5 8.5v5",
  planning: "M7 3v3M17 3v3M3.5 9h17M4.5 6h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM8 13h3M8 17h6",
  attendance: "M4.5 5h15v15h-15zM4.5 9.5h15M8 3v3M16 3v3M8.5 14l1.7 1.7 4-4",
  performance: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z",
  syllabus: "M5 4.5h9a3 3 0 0 1 3 3V20a3 3 0 0 0-3-2.5H5zM19 4.5v13M8.5 9h6",
  analytics: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  approvals: "M4 12.5 9 17.5 20 6.5",
  examSetup: "M6 3h9l4 4v14H6zM15 3v4h4M9.5 12.5l2 2 4-4",
  marksWindow: "M4 5.5h16v13H4zM4 10h16M9 5.5v13M14.5 14.5l1.6 1.6 3-3",
  timetable: "M4 6h16v14H4zM4 10h16M9 6v14M14.5 6v14M7 3v3M17 3v3",
  teacherTt: "M4 6h16v14H4zM4 10h16M9 6v14M7 3v3M17 3v3M13 14.5l1.8 1.8 3.5-3.5",
  substitute: "M8 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 8 11zM2 20c0-3.2 2.7-5.3 6-5.3 1.3 0 2.5.3 3.5.9M17 13v7M13.5 16.5h7",
  marksVerify: "M6 3h12v18l-6-3.5L6 21zM9.5 10l1.8 1.8 3.5-3.5",
};

export function NavIcon({ id, stroke, size = 18 }: { id: AcademicCoordinatorIconId; stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
      <path d={PATHS[id]} />
    </svg>
  );
}

export function CloseXIcon({ size = 15, stroke = "currentColor" }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function EmptyDocIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h7" />
      <path d="M9 17h5" />
    </svg>
  );
}
