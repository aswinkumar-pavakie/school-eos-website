import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ShellNavItem } from "@/components/dashboard/Shell";
import { AppShell } from "@/components/shared-ui/AppShell";
import { shellNavItemsToGroups } from "@/components/shared-ui/shell-nav";
import { HeaderBell } from "@/components/shared-ui/HeaderBell";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { ReframeThemeStyle, reframeThemeClassName } from "@/components/dashboard/ReframeTheme";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { listApprovals, listAcademicYears } from "@/lib/finance-api";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";
import { listAcademicTerms } from "@/lib/academic-term-api";
import { listNotifications } from "@/lib/notifications-api";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const REFRAME_SCOPE = "correspondent-theme";

// Correspondent's own operational shell -- a genuinely new, separate real
// login (see backend query.md's "Correspondent role" entry: its own person/
// login_identifier/user_credential/role_assignment rows, role_code
// CORRESPONDENT, is_core_login=true -- not a second role on an existing
// Principal account). The SIS Correspondent reference design is literally
// Principal Console.dc.html relabeled, so this shell is Principal's own
// layout.tsx cloned verbatim (same nav items, same real backend calls, same
// reframe palette) with only the role check, route prefix, and chrome copy
// changed -- every backend endpoint this page's data comes from already had
// its own @Roles widened to include CORRESPONDENT alongside PRINCIPAL
// (additive only, nothing narrowed), so this gets the exact same real scope
// Principal has, not a re-approximation of it.
// Trimmed to exactly the SIS Correspondent reference's own NAV array
// (Principal Console.dc.html lines 960-966: OVERVIEW/Dashboard,
// PEOPLE/Students+Teachers, ACADEMICS/[6 items], OPERATIONS/[5 items],
// ADMINISTRATION/Requests & approvals+Notices+Inbox) -- explicit correction
// after an earlier pass wrongly carried over Principal's own additional real
// features (Attendance Sessions, Health, Finance, Reports, Communities, My
// Attendance/Leave, Audit, Settings) that aren't in this design at all.
// Those route directories have been deleted from correspondent/, not just
// unlinked. "Parents" is the one deliberate exception, kept per explicit
// instruction even though the reference's own PEOPLE group only lists
// Students/Teachers. "Inbox" from the reference's own nav is now real, as
// "Notifications" -- Phase 2 found a genuine, already-populated backend
// module (notifications.controller.ts, 230 real rows written by
// OutboxService across approvals/attendance-alerts/hostel-call-requests)
// with zero frontend consumer anywhere in the app until now. This isn't the
// earlier honest omission reversed on a whim -- that was correct at the
// time (no real backend existed to point it at), this corrects it now that
// one genuinely does.
const CORRESPONDENT_NAV_ITEMS: ShellNavItem[] = [
  { href: "/correspondent", label: "Dashboard", icon: "dashboard", group: "OVERVIEW" },

  { href: "/correspondent/students", label: "Students", icon: "students", group: "PEOPLE" },
  // Phase 9 addition -- real, threshold-free attendance ranking (see
  // students/attention/page.tsx's own comment for why academics/examinations
  // aren't included: marks/results are Faculty-only everywhere in this
  // backend).
  { href: "/correspondent/students/attention", label: "Student Attention", icon: "students", group: "PEOPLE" },
  // Kept as the one explicit exception beyond the reference's own PEOPLE
  // group (Students/Teachers only) -- direct instruction.
  { href: "/correspondent/parents", label: "Parents", icon: "parents", group: "PEOPLE" },
  // Labelled "Faculty" (not the reference's literal "Teachers") for
  // consistency with the rest of the app's own nav wording -- explicit
  // standing instruction elsewhere to pick one name and use it everywhere;
  // same real page/data either way.
  { href: "/correspondent/faculty", label: "Faculty", icon: "faculty", group: "PEOPLE" },

  { href: "/correspondent/academics", label: "Academics", icon: "academics", group: "ACADEMICS" },
  { href: "/correspondent/attendance", label: "Staff attendance", icon: "attendance", group: "ACADEMICS" },
  { href: "/correspondent/attendance-diary", label: "Attendance diary", icon: "attendance", group: "ACADEMICS" },
  { href: "/correspondent/academics/subject-mapping", label: "Subjects & mapping", icon: "subjectMapping", group: "ACADEMICS" },
  { href: "/correspondent/academics/class-timetable", label: "Class timetable", icon: "timetable", group: "ACADEMICS" },
  { href: "/correspondent/academics/examination-timetable", label: "Exam timetable", icon: "examTimetable", group: "ACADEMICS" },
  { href: "/correspondent/academics/academic-calendar", label: "Academic calendar", icon: "calendar", group: "ACADEMICS" },

  { href: "/correspondent/inventory", label: "Sports inventory", icon: "inventory", group: "OPERATIONS" },
  { href: "/correspondent/maintenance", label: "Repair & maintenance", icon: "maintenance", group: "OPERATIONS" },
  { href: "/correspondent/hostel", label: "Hostel", icon: "hostel", group: "OPERATIONS" },
  { href: "/correspondent/transport", label: "Transport", icon: "transport", group: "OPERATIONS" },
  { href: "/correspondent/library", label: "Library", icon: "library", group: "OPERATIONS" },
  // Phase 5 addition -- GET /sports/overview already grants CORRESPONDENT
  // (sports-admin-overview.controller.ts), same real Admin oversight data,
  // just never had a frontend consumer at this role tier before now.
  { href: "/correspondent/sports", label: "Sports", icon: "sports", group: "OPERATIONS" },
  // Phase 8 additions -- both real, already-authorized aggregation views over
  // existing modules (Repair & Maintenance/Inventory/Hostel for Action Center;
  // vehicle_document/driver_document for Compliance), not new systems.
  { href: "/correspondent/actions", label: "Action Center", icon: "requests", group: "OPERATIONS" },
  { href: "/correspondent/compliance", label: "Compliance", icon: "audit", group: "OPERATIONS" },

  { href: "/correspondent/requests", label: "Requests & approvals", icon: "requests", group: "ADMINISTRATION" },
  { href: "/correspondent/messages", label: "Messages", icon: "messages", group: "ADMINISTRATION" },
  { href: "/correspondent/announcements", label: "Notices", icon: "announcements", group: "ADMINISTRATION" },
  { href: "/correspondent/notifications", label: "Notifications", icon: "requests", group: "ADMINISTRATION" },
  // Phase 7 addition -- same real GET /admin/reports-summary data Principal's
  // own /principal/reports already shows (already grants CORRESPONDENT).
  // Audit Log deliberately gets NO nav entry here, matching Principal's own
  // real design exactly -- it's reached only via object-scoped "View history"
  // drill-down links (inventory items, maintenance requests), never as a
  // standalone sidebar destination.
  { href: "/correspondent/reports", label: "Reports", icon: "reports", group: "ADMINISTRATION" },
  // Phase 9 addition -- factual framing over the same real Reports data, no
  // new aggregation engine (see governance/page.tsx's own comment).
  { href: "/correspondent/governance", label: "Governance Insights", icon: "reports", group: "ADMINISTRATION" },

  // Phase 6 addition -- fee-heads/fee-structures/fee-overview/fee-demands/
  // payments all already grant CORRESPONDENT read access (see
  // fee-*.controller.ts/payments.controller.ts), same real data Principal's
  // own /principal/finance already shows; this app's own FINANCE group
  // convention (Principal/VP layouts) is reused rather than nesting it under
  // ADMINISTRATION or OPERATIONS.
  { href: "/correspondent/finance", label: "Finance", icon: "finance", group: "FINANCE" },

  // Moved to the navbar "Ask AI" widget (AskAiWidget in Shell's own header)
  // -- no longer a sidebar entry, matching the reference design.
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function CorrespondentLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately CORRESPONDENT-only, not "|| PRINCIPAL"/"|| ADMIN" -- same
  // precedent as every other role's own shell (Library's own layout, VP's own
  // layout): oversight of another role's module is a separate, narrower page
  // under that other role's own route, never "viewing as" this shell.
  if (!actor.roles.includes("CORRESPONDENT")) redirect("/login");

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
  const [pendingRequestsCount, dashboardSummary, academicYears, notificationsSummary] = await Promise.all([
    listApprovals({ status: "PENDING" }).then((rows) => rows.length).catch(() => 0),
    getPrincipalDashboardSummary().catch(() => null),
    listAcademicYears().catch(() => []),
    listNotifications({ unreadOnly: true, limit: 1 }).catch(() => null),
  ]);
  const currentYear = academicYears.find((y) => y.isCurrent) ?? academicYears[0];
  // Real Term pill -- see academic-term-api.ts; resolves to [] (so the pill
  // just doesn't render) until the user runs query.md's new academic_term
  // migration.
  const terms = currentYear ? await listAcademicTerms(currentYear.id).catch(() => []) : [];
  const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];

  // Real nav badges -- same counts the Dashboard/Students/Faculty/Requests
  // pages themselves already show, just surfaced in the sidebar too. Omitted
  // (undefined) rather than "0" wherever the underlying fetch failed, so a
  // transient error never shows a fake zero.
  const navBadges: Record<string, string | number | undefined> = {
    "/correspondent/students": dashboardSummary?.activeStudents,
    "/correspondent/faculty": dashboardSummary?.activeStaff,
    "/correspondent/requests": pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    "/correspondent/notifications":
      notificationsSummary && notificationsSummary.unreadCount > 0 ? notificationsSummary.unreadCount : undefined,
  };
  const navItemsWithBadges: ShellNavItem[] = CORRESPONDENT_NAV_ITEMS.map((item) =>
    navBadges[item.href] !== undefined ? { ...item, badge: navBadges[item.href] } : item,
  );

  return (
    <div className={reframeThemeClassName(REFRAME_SCOPE)}>
      <ReframeThemeStyle scope={REFRAME_SCOPE} />
      <E2eeBootstrapMount personId={actor.personId} />
      <AppShell
        rootHref="/correspondent"
        navGroups={shellNavItemsToGroups(navItemsWithBadges)}
        personName={personName}
        personRoleLabel="Correspondent"
        academicYear={currentYear?.name}
        termLabel={currentTerm?.name}
        profileHref="/correspondent/profile"
        customSearch={
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <GlobalSearch />
          </div>
        }
        headerExtra={
          <>
            <HeaderBell pendingRequestsCount={pendingRequestsCount} requestsHref="/correspondent/requests" />
            <button
              type="button"
              disabled
              title="Messaging is coming in a later phase"
              aria-disabled
              className="hidden shrink-0 items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-white opacity-90 md:flex"
            >
              Messages
            </button>
          </>
        }
      >
        {children}
      </AppShell>
    </div>
  );
}
