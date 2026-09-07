import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { listApprovals } from "@/lib/finance-api";
// logoutAction is genuinely shared across Admin/Finance/Library/Principal -- see
// finance/layout.tsx's own comment for why it lives under admin/ rather than a
// since-removed placeholder route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Principal's own operational shell -- same Shell component Admin/Finance/Library
// use, grouped into sections per the agreed information architecture (derived from
// Admin's own sidebar, not a new design). Foundation phase only: most hrefs below
// don't have a page yet (Students/Parents/Academics/etc. are later phases), so
// clicking them 404s until that module's own round is built -- expected, not a bug.
const PRINCIPAL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/principal", label: "Dashboard", icon: "dashboard", group: "MAIN" },

  { href: "/principal/students", label: "Students", icon: "students", group: "PEOPLE" },
  { href: "/principal/parents", label: "Parents", icon: "parents", group: "PEOPLE" },
  { href: "/principal/faculty", label: "Faculty", icon: "faculty", group: "PEOPLE" },

  { href: "/principal/academics", label: "Academics", icon: "academics", group: "ACADEMICS" },
  { href: "/principal/academics/class-timetable", label: "Class Timetable", icon: "timetable", group: "ACADEMICS" },
  { href: "/principal/academics/examination-timetable", label: "Examination Timetable", icon: "timetable", group: "ACADEMICS" },
  { href: "/principal/academics/examinations", label: "Examinations", icon: "reports", group: "ACADEMICS" },
  { href: "/principal/academics/academic-calendar", label: "Academic Calendar", icon: "calendar", group: "ACADEMICS" },

  { href: "/principal/attendance", label: "Attendance", icon: "attendance", group: "ATTENDANCE" },

  // "SCHOOL OPERATIONS" per the agreed Principal IA -- same five items as Admin's
  // "CAMPUS & OPERATIONS" group, same icons (including Library's reused "academics"
  // book icon -- no dedicated library icon exists, matches Admin's own reuse).
  { href: "/principal/transport", label: "Transport", icon: "transport", group: "SCHOOL OPERATIONS" },
  { href: "/principal/hostel", label: "Hostel", icon: "hostel", group: "SCHOOL OPERATIONS" },
  { href: "/principal/inventory", label: "Inventory", icon: "inventory", group: "SCHOOL OPERATIONS" },
  { href: "/principal/library", label: "Library", icon: "academics", group: "SCHOOL OPERATIONS" },
  { href: "/principal/maintenance", label: "Repair & Maintenance", icon: "maintenance", group: "SCHOOL OPERATIONS" },

  { href: "/principal/finance", label: "Finance", icon: "finance", group: "FINANCE" },

  { href: "/principal/community", label: "Communities", icon: "community", group: "COMMUNICATION" },
  { href: "/principal/announcements", label: "Announcements", icon: "announcements", group: "COMMUNICATION" },

  { href: "/principal/reports", label: "Reports", icon: "reports", group: "ADMINISTRATION" },
  { href: "/principal/audit", label: "Audit Log", icon: "audit", group: "ADMINISTRATION" },
  { href: "/principal/requests", label: "Requests & Approvals", icon: "requests", group: "ADMINISTRATION" },

  { href: "/principal/settings", label: "Settings", icon: "settings", group: "SYSTEM" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function PrincipalLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately PRINCIPAL-only, not "|| ADMIN" -- matching Library's own precedent
  // (Admin's oversight of another role's module is a separate, narrower page under
  // /admin/*, never "viewing as" that role's own operational shell).
  if (!actor.roles.includes("PRINCIPAL")) redirect("/login");

  // Real name for the avatar/menu -- same direct /auth/me fetch pattern
  // Finance's/Library's own layouts use (getCurrentActor() only returns
  // personId/roles, not a display name).
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // The bell's one real, honest "notification" -- Principal's own pending decisions
  // on the generic approvals engine (the same call Principal's account already
  // triggers today from inside Finance's layout) -- not a fabricated alerts feed.
  const pendingRequestsCount = await listApprovals({ status: "PENDING" })
    .then((rows) => rows.length)
    .catch(() => 0);

  return (
    <Shell
      personName={personName}
      roleLabel="Principal"
      onSignOut={logoutAction}
      pendingRequestsCount={pendingRequestsCount}
      navItems={PRINCIPAL_NAV_ITEMS}
      requestsHref="/principal/requests"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
