import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ReframeThemeStyle, reframeThemeClassName } from "@/components/dashboard/ReframeTheme";
import { ReframeHeaderChrome } from "@/components/dashboard/ReframeHeaderChrome";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { listApprovals, listAcademicYears, getSchoolProfile } from "@/lib/finance-api";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";
import { listAcademicTerms } from "@/lib/academic-term-api";
// logoutAction is genuinely shared across Admin/Finance/Library/Principal -- see
// finance/layout.tsx's own comment for why it lives under admin/ rather than a
// since-removed placeholder route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const REFRAME_SCOPE = "principal-theme";

// Principal's own operational shell -- same Shell component Admin/Finance/Library
// use, grouped into sections per the agreed information architecture (derived from
// Admin's own sidebar, not a new design). Foundation phase only: most hrefs below
// don't have a page yet (Students/Parents/Academics/etc. are later phases), so
// clicking them 404s until that module's own round is built -- expected, not a bug.
const PRINCIPAL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/principal", label: "Dashboard", icon: "dashboard", group: "MAIN" },

  { href: "/principal/students", label: "Students", icon: "students", group: "PEOPLE" },
  { href: "/principal/parents", label: "Parents", icon: "parents", group: "PEOPLE" },
  // Labelled "Faculty" for consistency with Admin/Vice Principal's own nav
  // wording (explicit user instruction to pick one name and use it
  // everywhere) -- same real page/content as before, only the label changed.
  { href: "/principal/faculty", label: "Faculty", icon: "faculty", group: "PEOPLE" },
  { href: "/principal/academics", label: "Academics", icon: "academics", group: "ACADEMICS" },
  { href: "/principal/attendance", label: "Staff attendance", icon: "attendance", group: "ACADEMICS" },
  // Real data (subject_offering, previously Admin-only) -- see this route's
  // own page.tsx comment.
  { href: "/principal/academics/subject-mapping", label: "Subjects & mapping", icon: "subjectMapping", group: "ACADEMICS" },
  { href: "/principal/academics/class-timetable", label: "Class timetable", icon: "timetable", group: "ACADEMICS" },
  // Per the mockup's literal nav label. Previously two separate items
  // ("Examinations" list+detail, and this cross-exam schedule view) --
  // collapsed into one per explicit instruction, since both showed the same
  // real exam/exam_subject data with just a different picker UX. This single
  // page now covers both: pick an examination, then drill into one class's
  // section to see its real per-subject schedule.
  { href: "/principal/academics/examination-timetable", label: "Exam timetable", icon: "examTimetable", group: "ACADEMICS" },
  { href: "/principal/academics/academic-calendar", label: "Academic calendar", icon: "calendar", group: "ACADEMICS" },

  // Real, distinct module -- class/student attendance oversight, not the
  // staff daily roll call above. Mockup has no separate "Attendance Sessions"
  // group of its own, so this stays adjacent to Academics rather than being
  // its own top-level group.
  { href: "/principal/attendance-sessions", label: "Attendance Sessions", icon: "attendance", group: "ACADEMICS" },

  // "SCHOOL OPERATIONS" per the agreed Principal IA -- same five items as Admin's
  // "CAMPUS & OPERATIONS" group, same icons (including Library's reused "academics"
  // book icon -- no dedicated library icon exists, matches Admin's own reuse).
  // Order + labels now mirror the mockup's OPERATIONS group exactly (Sports
  // inventory, Repair & maintenance, Hostel, Transport, Library) -- same real
  // page/data as before, only the chrome label changed.
  { href: "/principal/inventory", label: "Sports inventory", icon: "inventory", group: "SCHOOL OPERATIONS" },
  { href: "/principal/maintenance", label: "Repair & maintenance", icon: "maintenance", group: "SCHOOL OPERATIONS" },
  { href: "/principal/hostel", label: "Hostel", icon: "hostel", group: "SCHOOL OPERATIONS" },
  { href: "/principal/transport", label: "Transport", icon: "transport", group: "SCHOOL OPERATIONS" },
  { href: "/principal/library", label: "Library", icon: "library", group: "SCHOOL OPERATIONS" },
  // Real data (health_profile/infirmary_visit/health_alert/medical_escalation,
  // all already-existing tables) -- not in the mockup at all, so appended
  // after the mockup's own five OPERATIONS items rather than inserted among
  // them. Same "requests" icon reuse as Admin's own nav entry for this page.
  { href: "/principal/health", label: "Health & Infirmary", icon: "requests", group: "SCHOOL OPERATIONS" },

  { href: "/principal/finance", label: "Finance", icon: "finance", group: "FINANCE" },

  { href: "/principal/reports", label: "Reports", icon: "reports", group: "ADMINISTRATION" },
  // "Audit Log" nav entry removed (explicit user request) -- route/backend
  // still exists and works, just no longer surfaced in the sidebar.
  { href: "/principal/requests", label: "Requests & approvals", icon: "requests", group: "ADMINISTRATION" },
  // Labelled "Notices" per the mockup -- same real Announcements route/page,
  // only the sidebar chrome label changed.
  { href: "/principal/announcements", label: "Notices", icon: "announcements", group: "ADMINISTRATION" },
  // Moved out of its own now-empty "COMMUNICATION" group (Notices, its only
  // other former member, already lives here) -- same real route/data, just
  // folded into Administration instead of a single-item group of its own.
  { href: "/principal/community", label: "Communities", icon: "community", group: "ADMINISTRATION" },

  // Principal's own employment self-service -- distinct from the school-wide
  // staff Attendance module above (Principal's own write-capable roster tool).
  // Backed by GET /staff/me/attendance-history and /staff/me/leave-requests,
  // both already @Roles('ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL') on the backend
  // and already live on Principal's own mobile app -- this was the missing
  // web equivalent. Placed after Administration, before System, per explicit
  // placement request.
  { href: "/principal/my-attendance", label: "My Attendance", icon: "attendance", group: "MY RECORD" },
  { href: "/principal/my-leave", label: "My Leave", icon: "requests", group: "MY RECORD" },

  // Moved to the navbar "Ask AI" widget (AskAiWidget in Shell's own header)
  // -- no longer a sidebar entry, matching the reference design.
];

// Initials for the sidebar's logo/avatar tiles -- same simple first-letter-of-
// each-word approach the mockup's own "PPS" / "AK" tiles use, capped at 3.
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

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
  const [pendingRequestsCount, dashboardSummary, academicYears, schoolProfile] = await Promise.all([
    listApprovals({ status: "PENDING" }).then((rows) => rows.length).catch(() => 0),
    getPrincipalDashboardSummary().catch(() => null),
    listAcademicYears().catch(() => []),
    getSchoolProfile().catch(() => null),
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
    "/principal/students": dashboardSummary?.activeStudents,
    "/principal/faculty": dashboardSummary?.activeStaff,
    "/principal/requests": pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
  };
  const navItemsWithBadges: ShellNavItem[] = PRINCIPAL_NAV_ITEMS.map((item) =>
    navBadges[item.href] !== undefined ? { ...item, badge: navBadges[item.href] } : item,
  );

  const schoolName = schoolProfile?.name ?? "School EOS";

  return (
    <div className={reframeThemeClassName(REFRAME_SCOPE)}>
      <ReframeThemeStyle scope={REFRAME_SCOPE} />
      <Shell
        personName={personName}
        roleLabel="Principal"
        onSignOut={logoutAction}
        pendingRequestsCount={pendingRequestsCount}
        navItems={navItemsWithBadges}
        requestsHref="/principal/requests"
        showGlobalSearch
        headerExtra={
          <ReframeHeaderChrome academicYearName={currentYear?.name} termName={currentTerm?.name} />
        }
        // Sidebar logo tile + real school name + role subtitle, per the SIS
        // mockup's own sidebar header markup (Principal Console.dc.html lines
        // 27-33) -- checked against the literal source, not inferred.
        sidebarHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[#0f2342] text-[13px] font-bold text-white">
              {initials(schoolName)}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[16px] font-semibold leading-tight tracking-[-0.01em] text-text">{schoolName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">Principal&apos;s office</div>
            </div>
          </div>
        }
        // Sidebar footer identity card, per the mockup's own sidebar footer
        // markup (lines 67-73) -- purely additive visual chrome; the header's
        // existing notification bell + avatar sign-out menu is untouched, so
        // signing out still works exactly as before.
        sidebarFooter={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f2342] text-[13px] font-semibold text-white">
              {initials(personName || "Principal")}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[14px] font-semibold leading-tight text-text">{personName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">Principal</div>
            </div>
          </div>
        }
      >
        {children}
      </Shell>
    </div>
  );
}
