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
 * The website's Faculty and Class Teacher navigation. Its feature set is the
 * mobile app's, one for one -- no more, no fewer -- laid out in the website's
 * own sidebar design. The mobile groups map onto sidebar groups:
 *
 *   Faculty (mobile tabs Home / Class / Progress / Campus + a conditional 5th):
 *     HOME     -> Dashboard
 *     CLASS    -> the mobile Class hub's tiles
 *     PROGRESS -> the mobile Progress hub's tiles (own attendance, leave, HR)
 *     CAMPUS   -> the mobile Campus hub's tiles
 *     MORE     -> Coordinator Hub (only for a coordinator) and, by the
 *                 faculty member's own commute record, Hostel or My Bus (both
 *                 absent for someone with their own vehicle)
 *
 *   Class Teacher (mobile tabs Home / Class):
 *     HOME     -> Dashboard, Message, Notice (the mobile Home's own menu)
 *     CLASS    -> the mobile Class Teacher hub's tiles
 *
 * The Class Teacher login is a separate per-section login (see
 * faculty/layout.tsx); the two are joined by the account switcher.
 */

export function buildFacultyNavGroups(params: {
  pendingLeaveCount?: number;
  pendingPermissionsCount?: number;
  isCoordinator: boolean;
  isHosteller: boolean;
  usesSchoolTransport: boolean;
}): FacultyNavGroup[] {
  const { pendingLeaveCount, pendingPermissionsCount, isCoordinator, isHosteller, usesSchoolTransport } = params;

  const groups: FacultyNavGroup[] = [
    {
      label: "HOME",
      items: [{ href: "/faculty", label: "Dashboard", icon: "dashboard" }],
    },
    {
      label: "CLASS",
      items: [
        { href: "/faculty/attendance", label: "Student attendance", icon: "attendance" },
        { href: "/faculty/attendance-diary", label: "Attendance diary", icon: "attendance" },
        { href: "/faculty/online-class", label: "Online class", icon: "sub-online" },
        { href: "/faculty/announcements", label: "Notices", icon: "notice" },
        { href: "/faculty/timetable", label: "Timetable", icon: "timetable" },
        { href: "/faculty/calendar", label: "Calendar", icon: "calendar" },
        { href: "/faculty/class-exams", label: "Exams", icon: "exam" },
        { href: "/faculty/marks-entry", label: "Marks entry", icon: "sub-marks" },
        { href: "/faculty/class-results", label: "Class results", icon: "performance" },
        { href: "/faculty/subject-records", label: "Subject records", icon: "sub-exams" },
        { href: "/faculty/lms", label: "LMS", icon: "sub-term" },
        { href: "/faculty/homework", label: "Homework", icon: "sub-homework" },
        { href: "/faculty/student-leave", label: "Student leave", icon: "leave", badge: pendingLeaveCount },
        { href: "/faculty/parent-meetings", label: "Parent meetings", icon: "permissions" },
        { href: "/faculty/message", label: "Messages", icon: "sub-message" },
        { href: "/faculty/permissions", label: "Events", icon: "events", badge: pendingPermissionsCount },
      ],
    },
    {
      label: "PROGRESS",
      items: [
        { href: "/faculty/my-attendance", label: "Attendance", icon: "emp-attendance" },
        { href: "/faculty/staff-leave", label: "Leave", icon: "emp-leave" },
        { href: "/faculty/staff-od", label: "OD", icon: "emp-od" },
        { href: "/faculty/hr-requests", label: "HR payroll", icon: "emp-payroll" },
        { href: "/faculty/payslip", label: "Payslip", icon: "emp-payslip" },
        { href: "/faculty/appraisal", label: "Appraisal", icon: "emp-appraisal" },
      ],
    },
    {
      label: "CAMPUS",
      items: [
        { href: "/faculty/campus/food-court", label: "Food court", icon: "food" },
        { href: "/faculty/campus/medical", label: "Medical", icon: "medical" },
        { href: "/faculty/campus/feedback", label: "Feedback", icon: "feedback" },
        { href: "/faculty/campus/house", label: "House", icon: "house" },
        { href: "/faculty/library", label: "Library", icon: "emp-library" },
      ],
    },
  ];

  const more: FacultyNavItem[] = [];
  // Points at the standalone Academic Coordinator portal.
  if (isCoordinator) more.push({ href: "/academic-coordinator", label: "Coordinator hub", icon: "coordinator" });
  // Hostel wins if both are somehow set, exactly as on mobile.
  if (isHosteller) more.push({ href: "/faculty/hostel", label: "Hostel", icon: "hostel" });
  else if (usesSchoolTransport) more.push({ href: "/faculty/bus", label: "My bus", icon: "bus" });
  if (more.length > 0) groups.push({ label: "MORE", items: more });

  return groups;
}

export function buildClassTeacherNavGroups(params: {
  sectionLabel: string | null;
  pendingLeaveCount?: number;
}): FacultyNavGroup[] {
  const { sectionLabel, pendingLeaveCount } = params;
  return [
    {
      label: "HOME",
      items: [
        { href: "/faculty", label: "Dashboard", icon: "dashboard" },
        { href: "/faculty/message", label: "Message", icon: "sub-message" },
        { href: "/faculty/announcements", label: "Notice", icon: "notice" },
      ],
    },
    {
      label: sectionLabel ? `CLASS · ${sectionLabel}` : "CLASS",
      items: [
        { href: "/faculty/students", label: "Student data", icon: "students" },
        { href: "/faculty/attendance", label: "Attendance", icon: "attendance" },
        { href: "/faculty/attendance-diary", label: "Attendance diary", icon: "attendance" },
        { href: "/faculty/timetable", label: "Time table", icon: "timetable" },
        { href: "/faculty/calendar", label: "Calendar", icon: "calendar" },
        { href: "/faculty/class-exams", label: "Exams", icon: "exam" },
        { href: "/faculty/parent-meetings", label: "Parent meetings", icon: "permissions" },
        { href: "/faculty/student-leave", label: "Leave", icon: "leave", badge: pendingLeaveCount },
        { href: "/faculty/fees", label: "Fees", icon: "fees" },
      ],
    },
  ];
}
