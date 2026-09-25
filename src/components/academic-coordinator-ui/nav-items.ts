import type { AcademicCoordinatorIconId } from "./icons";

export interface AcademicCoordinatorNavItem {
  id: AcademicCoordinatorIconId;
  label: string;
  href: string;
  countKey?: "students" | "teachers";
}

export interface AcademicCoordinatorNavGroup {
  title: string;
  items: AcademicCoordinatorNavItem[];
}

// Ported verbatim from the design's own `nav` array (3 groups, 15 items) in
// brain/SIS ACAD co-ord/Academic Coordinator Portal.dc.html -- same group
// titles, same order, same item labels. `href` is this build's own addition
// (the design uses an in-page `page` state machine instead of routes).
export const ACADEMIC_COORDINATOR_NAV: AcademicCoordinatorNavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/academic-coordinator" },
      { id: "reports", label: "Reports", href: "/academic-coordinator/reports" },
      { id: "notice", label: "Notice", href: "/academic-coordinator/notice" },
    ],
  },
  {
    title: "PEOPLE",
    items: [
      { id: "students", label: "Students", href: "/academic-coordinator/students", countKey: "students" },
      { id: "teachers", label: "Teachers", href: "/academic-coordinator/teachers", countKey: "teachers" },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      { id: "attendance", label: "Attendance", href: "/academic-coordinator/attendance" },
      { id: "attendance", label: "Attendance diary", href: "/academic-coordinator/attendance-diary" },
      { id: "performance", label: "Performance", href: "/academic-coordinator/performance" },
      { id: "syllabus", label: "Syllabus tracking", href: "/academic-coordinator/syllabus" },
      { id: "approvals", label: "Academic approvals", href: "/academic-coordinator/approvals" },
      { id: "examSetup", label: "Exam setup", href: "/academic-coordinator/exams" },
      { id: "marksWindow", label: "Marks entry window", href: "/academic-coordinator/marks-window" },
      { id: "timetable", label: "Create timetable", href: "/academic-coordinator/timetable" },
      { id: "teacherTt", label: "Teacher timetable", href: "/academic-coordinator/teacher-timetable" },
      { id: "substitute", label: "Substitute teacher", href: "/academic-coordinator/substitute" },
      { id: "marksVerify", label: "Marks verification", href: "/academic-coordinator/marks-verify" },
    ],
  },
  // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
  // sidebar entry, matching the reference design.
];

// Ported from the design's implicit per-page title (each screen renders its
// own <h1>-equivalent inline; there's no separate TITLES map in the source),
// used by the Shell only for the browser tab / a11y landmark, not a visible
// header duplicate -- every page renders its own big title matching the
// design exactly.
export const ACADEMIC_COORDINATOR_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Reports",
  notice: "Notice",
  students: "Students",
  teachers: "Teachers",
  attendance: "Attendance",
  performance: "Performance",
  syllabus: "Syllabus tracking",
  approvals: "Academic approvals",
  examSetup: "Exam setup",
  marksWindow: "Marks entry window",
  timetable: "Create timetable",
  teacherTt: "Teacher timetable",
  substitute: "Substitute teacher",
  marksVerify: "Marks verification",
};
