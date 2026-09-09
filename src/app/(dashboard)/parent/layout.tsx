import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { listLeaveRequests, listChildren } from "@/lib/parent-api";
// logoutAction is genuinely shared with the Admin Console -- same reasoning
// faculty/layout.tsx's own copy of this comment gives: one real sign-out
// action, not a lookalike rebuild per module.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Same Shell as Admin/Finance/Media/Faculty -- one design system, flat nav.
// Fees/Canteen/Messages/Permissions are deliberately NOT here -- explicitly
// out of scope for this build (already-shipped elsewhere or deferred).
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/parent", label: "Dashboard", icon: "dashboard" },
  { href: "/parent/attendance", label: "Attendance", icon: "attendance" },
  { href: "/parent/results", label: "Report Card", icon: "reports" },
  { href: "/parent/exams", label: "Exams", icon: "academics" },
  { href: "/parent/subjects", label: "Subjects", icon: "academics" },
  { href: "/parent/term", label: "Current Term", icon: "academics" },
  { href: "/parent/timetable", label: "Timetable", icon: "timetable" },
  { href: "/parent/calendar", label: "Calendar", icon: "calendar" },
  { href: "/parent/homework", label: "Homework", icon: "academics" },
  { href: "/parent/leave", label: "Leave", icon: "requests" },
  { href: "/parent/library", label: "Library", icon: "inventory" },
  { href: "/parent/health", label: "Health", icon: "students" },
  { href: "/parent/feedback", label: "Feedback", icon: "announcements" },
  { href: "/parent/documents", label: "Documents", icon: "requests" },
  { href: "/parent/meetings", label: "Meetings", icon: "parents" },
  { href: "/parent/bus", label: "My Bus", icon: "transport" },
  { href: "/parent/notices", label: "Notices", icon: "announcements" },
  { href: "/parent/profile", label: "Profile", icon: "students" },
  { href: "/parent/settings", label: "Settings", icon: "settings" },
];

interface MeResponse {
  data: { person: { id: string; firstName: string; lastName: string | null } };
}

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor || !actor.roles.includes("PARENT")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // The bell's one honest thing to say: this parent's own leave requests
  // still awaiting a decision, across every linked child.
  const kids = await listChildren().catch(() => []);
  const pendingCounts = await Promise.all(
    kids.map((k) =>
      listLeaveRequests(k.studentId)
        .then((rows) => rows.filter((r) => r.state === "PENDING").length)
        .catch(() => 0),
    ),
  );
  const pendingRequestsCount = pendingCounts.reduce((sum, n) => sum + n, 0);

  return (
    <Shell
      personName={personName}
      roleLabel="Parent"
      onSignOut={logoutAction}
      pendingRequestsCount={pendingRequestsCount}
      navItems={NAV_ITEMS}
      requestsHref="/parent/leave"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
