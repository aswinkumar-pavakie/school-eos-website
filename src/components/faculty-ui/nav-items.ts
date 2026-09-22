import type { NavIconId } from "./icons";

export type FacultyNavItem = {
  href: string;
  label: string;
  icon: NavIconId;
  /** Only ever a REAL count of items needing this teacher's action (never a
   * placeholder/sample value) -- shown only once the owning screen's own
   * real data-fetching exists. Undefined = no badge rendered. */
  badge?: number;
};
export type FacultyNavGroup = { label: string; items: FacultyNavItem[] };

/**
 * The design's 25-item, 4-group nav (brain/SIS Class teacher/Class Teacher
 * Portal.dc.html's own nav()), mapped onto this app's real routes -- plus a
 * 5th "MORE" group preserving Academic Coordinator / Sports / My Bus, three
 * real, currently-working nav items the design has no entry for at all (it
 * never modeled that persona). Dropping them would break real functionality
 * for coordinators / sports staff / bus-riding students' teachers.
 *
 * `sectionLabel` fills the "MY CLASS · 8-B"-style group header -- pass
 * `null` while no section is resolved yet (mirrors today's layout.tsx
 * pattern of resolving section from listAdvisorSections()).
 */
export function buildFacultyNavGroups(params: {
  sectionLabel: string | null;
  pendingLeaveCount?: number;
  pendingPermissionsCount?: number;
  pendingFeesCount?: number;
  isCoordinator: boolean;
  hasSportsTeams: boolean;
}): FacultyNavGroup[] {
  const {
    sectionLabel,
    pendingLeaveCount,
    pendingPermissionsCount,
    pendingFeesCount,
    isCoordinator,
    hasSportsTeams,
  } = params;

  const groups: FacultyNavGroup[] = [
    {
      label: "OVERVIEW",
      items: [
        { href: "/faculty", label: "Dashboard", icon: "dashboard" },
        { href: "/faculty/message", label: "Message", icon: "sub-message" },
        { href: "/faculty/reports", label: "Reports", icon: "reports" },
        { href: "/faculty/announcements", label: "Notice", icon: "notice" },
        { href: "/faculty/calendar", label: "Academic Calendar", icon: "calendar" },
        { href: "/faculty/timetable", label: "Timetable", icon: "timetable" },
      ],
    },
    {
      label: sectionLabel ? `MY CLASS · ${sectionLabel}` : "MY CLASS",
      items: [
        { href: "/faculty/students", label: "Students", icon: "students" },
        { href: "/faculty/attendance", label: "Attendance", icon: "attendance" },
        { href: "/faculty/class-results", label: "Performance", icon: "performance" },
        { href: "/faculty/fees", label: "Fees", icon: "fees", badge: pendingFeesCount },
        { href: "/faculty/student-leave", label: "Approve leave", icon: "leave", badge: pendingLeaveCount },
        { href: "/faculty/exams", label: "Exam", icon: "exam" },
        { href: "/faculty/permissions", label: "Ask permissions", icon: "permissions", badge: pendingPermissionsCount },
      ],
    },
    {
      label: "MY SUBJECTS",
      items: [
        { href: "/faculty/homework", label: "Upload homework", icon: "sub-homework" },
        { href: "/faculty/online-class", label: "Online class", icon: "sub-online" },
        { href: "/faculty/lms", label: "Current term", icon: "sub-term" },
        { href: "/faculty/subject-exams", label: "Exams", icon: "sub-exams" },
        { href: "/faculty/marks-entry", label: "Entry marks", icon: "sub-marks" },
        { href: "/faculty/correction-requests", label: "Correction requests", icon: "sub-marks" },
      ],
    },
    {
      label: "EMPLOYEE",
      items: [
        { href: "/faculty/my-attendance", label: "My attendance", icon: "emp-attendance" },
        { href: "/faculty/staff-leave", label: "Staff leave", icon: "emp-leave" },
        { href: "/faculty/staff-od", label: "Staff OD", icon: "emp-od" },
        { href: "/faculty/hr-requests", label: "HR payroll", icon: "emp-payroll" },
        { href: "/faculty/payslip", label: "Payslip", icon: "emp-payslip" },
        { href: "/faculty/appraisal", label: "Appraisal", icon: "emp-appraisal" },
        { href: "/faculty/library", label: "Library", icon: "emp-library" },
      ],
    },
  ];

  const more: FacultyNavItem[] = [{ href: "/faculty/bus", label: "My Bus", icon: "bus" }];
  // Points at the new, pixel-perfect, standalone Academic Coordinator portal
  // (see brain/SIS ACAD co-ord) -- /faculty/coordinator/* stays in place,
  // fully working, just no longer linked from here.
  if (isCoordinator) more.unshift({ href: "/academic-coordinator", label: "Academic Coordinator", icon: "coordinator" });
  if (hasSportsTeams) more.push({ href: "/sports", label: "Sports", icon: "sports" });
  // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
  // sidebar entry, matching the reference design.
  groups.push({ label: "MORE", items: more });

  return groups;
}
