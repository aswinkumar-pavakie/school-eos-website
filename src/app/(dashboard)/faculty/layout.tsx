import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getCoordinatorMe } from "@/lib/faculty-coordinator-api";
import { listStudentLeaveRequests } from "@/lib/faculty-api";
// logoutAction is genuinely shared with the Admin Console -- same reasoning
// finance/layout.tsx's own copy of this comment gives: one real sign-out
// action, not a lookalike rebuild per module.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Same Shell as Admin/Finance/Media -- one design system. Nav is flat (no
// group headers), matching Shell's own established convention exactly.
// Academic Coordinator is a single entry (its own 5 sub-screens live behind
// a hub page, same pattern the Faculty mobile app already uses) rather than
// bloating this sidebar to 25 items -- and only appears at all for a real,
// currently-active coordinator, checked live on every load.
const BASE_NAV_ITEMS: ShellNavItem[] = [
  { href: "/faculty", label: "Dashboard", icon: "dashboard" },
  { href: "/faculty/attendance", label: "Student Attendance", icon: "attendance" },
  { href: "/faculty/student-leave", label: "Student Leave", icon: "requests" },
  { href: "/faculty/subject-records", label: "Subject Records", icon: "reports" },
  { href: "/faculty/marks-entry", label: "Marks Entry", icon: "academics" },
  { href: "/faculty/announcements", label: "Announcements", icon: "announcements" },
  { href: "/faculty/class-results", label: "Class Results", icon: "reports" },
  { href: "/faculty/homework", label: "Homework", icon: "academics" },
  { href: "/faculty/class-teacher", label: "Class Teacher", icon: "students" },
  { href: "/faculty/parent-meetings", label: "Parent Meetings", icon: "parents" },
  { href: "/faculty/lms", label: "Current Term", icon: "academics" },
  { href: "/faculty/timetable", label: "Timetable", icon: "timetable" },
  { href: "/faculty/calendar", label: "Academic Calendar", icon: "calendar" },
  { href: "/faculty/bus", label: "My Bus", icon: "transport" },
  { href: "/faculty/my-attendance", label: "My Attendance", icon: "attendance" },
  { href: "/faculty/staff-leave", label: "Leave & OD", icon: "requests" },
  { href: "/faculty/hr-requests", label: "HR Payroll", icon: "finance" },
  { href: "/faculty/payslip", label: "Payslip", icon: "finance" },
  { href: "/faculty/appraisal", label: "Appraisal", icon: "settings" },
  { href: "/faculty/library", label: "Library", icon: "inventory" },
];
const COORDINATOR_NAV_ITEM: ShellNavItem = { href: "/faculty/coordinator", label: "Academic Coordinator", icon: "coordinator" };

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function FacultyLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor || !actor.roles.includes("FACULTY")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Real, live check -- never cached, never assumed from a role on the login
  // token. A plain Faculty member simply never sees this nav entry; every
  // route behind it re-checks the same thing server-side regardless.
  const coordinatorMe = await getCoordinatorMe().catch(() => ({ isCoordinator: false }));
  const navItems = coordinatorMe.isCoordinator ? [...BASE_NAV_ITEMS, COORDINATOR_NAV_ITEM] : BASE_NAV_ITEMS;

  // The bell's one honest thing to say: real student-leave requests (as
  // class advisor) still awaiting this faculty member's own decision.
  const pendingRequestsCount = await listStudentLeaveRequests()
    .then((rows) => rows.filter((r) => r.state === "PENDING").length)
    .catch(() => 0);

  return (
    <Shell
      personName={personName}
      roleLabel="Faculty"
      onSignOut={logoutAction}
      pendingRequestsCount={pendingRequestsCount}
      navItems={navItems}
      requestsHref="/faculty/student-leave"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
