import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ReframeThemeStyle, reframeThemeClassName } from "@/components/dashboard/ReframeTheme";
import { ReframeHeaderChrome } from "@/components/dashboard/ReframeHeaderChrome";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { listAcademicYears, getSchoolProfile } from "@/lib/finance-api";
import { listAcademicTerms } from "@/lib/academic-term-api";
// logoutAction is genuinely shared across Admin/Finance/Library/Principal/Vice
// Principal -- see finance/layout.tsx's own comment for why it lives under
// admin/ rather than a since-removed placeholder route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const REFRAME_SCOPE = "vp-theme";

// Vice Principal's own operational shell -- explicitly NOT a copy of
// Principal's own nav. A direct backend @Roles audit across every controller
// (37 files) found real, concrete differences between what PRINCIPAL and
// VICE_PRINCIPAL are each actually authorized for, so this nav reflects VP's
// own real access, not Principal's:
//
// VP HAS that Principal's web console does NOT:
//   - Attendance Sessions (attendance-sessions.controller.ts: class-level
//     stays ADMIN-only, PRINCIPAL was never broadened onto it either --
//     VICE_PRINCIPAL got its own explicit method-level grant, "Phase 7
//     mobile Attendance module")
//
// Exam timetable (exams.controller.ts: class-level ADMIN-only; list/get/
// listSchedules explicitly broadened to VICE_PRINCIPAL, then by later
// explicit instruction to PRINCIPAL too) is now genuine parity, not a VP-only
// item -- both consume the same real exam/exam_subject data.
//
// VP LACKS that Principal HAS:
//   - Requests & Approvals / Audit Log (audit-log.controller.ts stays
//     @Roles('ADMIN','PRINCIPAL') only; a live DB check this session found
//     zero approval_policy rows ever name VICE_PRINCIPAL as an
//     approver_role_code -- VP is never an approver, so there is no
//     "Awaiting your decision" queue to show)
//   - the per-student Fees/Wallet/Transport sections on a student profile
//     (students.controller.ts: GET :id/fees, :id/wallet, :id/transport all
//     inherit the class-level @Roles('ADMIN','PRINCIPAL') with no VP
//     override, unlike :id, :id/enrolments, :id/guardians and
//     :id/attendance-summary, which explicitly include VICE_PRINCIPAL) --
//     see vice-principal/students/[id]/page.tsx's own comment
//
// Everything else below (Parents, Faculty, Academics reference data, Class
// Timetable, Academic Calendar, Transport, Hostel, Inventory, Library,
// Repair & Maintenance, Finance, Communities, Announcements, Reports) is
// genuine parity -- confirmed class-level @Roles('ADMIN','PRINCIPAL',
// 'VICE_PRINCIPAL') (or an equivalent explicit method-level grant) on every
// one of those controllers, not assumed from Principal's own nav.
const VICE_PRINCIPAL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/vice-principal", label: "Dashboard", icon: "dashboard", group: "MAIN" },

  { href: "/vice-principal/students", label: "Students", icon: "students", group: "PEOPLE" },
  { href: "/vice-principal/parents", label: "Parents", icon: "parents", group: "PEOPLE" },
  { href: "/vice-principal/faculty", label: "Faculty", icon: "faculty", group: "PEOPLE" },
  { href: "/vice-principal/academics", label: "Academics", icon: "academics", group: "ACADEMICS" },
  { href: "/vice-principal/academics/class-timetable", label: "Class Timetable", icon: "timetable", group: "ACADEMICS" },
  { href: "/vice-principal/academics/academic-calendar", label: "Academic Calendar", icon: "calendar", group: "ACADEMICS" },
  // Per the mockup's literal nav label. Previously two separate items
  // ("Examinations" list+detail, and this cross-exam schedule view) --
  // collapsed into one per explicit instruction, since both showed the same
  // real exam/exam_subject data with just a different picker UX. This single
  // page now covers both: pick an examination, then drill into one class's
  // section to see its real per-subject schedule.
  { href: "/vice-principal/academics/examination-timetable", label: "Exam timetable", icon: "examTimetable", group: "ACADEMICS" },

  // VP-only module -- Principal's nav has no equivalent item at all.
  { href: "/vice-principal/attendance-sessions", label: "Attendance Sessions", icon: "attendance", group: "ATTENDANCE" },

  { href: "/vice-principal/transport", label: "Transport", icon: "transport", group: "SCHOOL OPERATIONS" },
  { href: "/vice-principal/hostel", label: "Hostel", icon: "hostel", group: "SCHOOL OPERATIONS" },
  { href: "/vice-principal/inventory", label: "Inventory", icon: "inventory", group: "SCHOOL OPERATIONS" },
  { href: "/vice-principal/library", label: "Library", icon: "library", group: "SCHOOL OPERATIONS" },
  { href: "/vice-principal/maintenance", label: "Repair & Maintenance", icon: "maintenance", group: "SCHOOL OPERATIONS" },
  // Real data (health_profile/infirmary_visit/health_alert/medical_escalation,
  // all already-existing tables) -- genuine parity with Admin/Principal, same
  // "requests" icon reuse as their own nav entries for this page.
  { href: "/vice-principal/health", label: "Health & Infirmary", icon: "requests", group: "SCHOOL OPERATIONS" },

  { href: "/vice-principal/finance", label: "Finance", icon: "finance", group: "FINANCE" },

  { href: "/vice-principal/community", label: "Communities", icon: "community", group: "COMMUNICATION" },
  { href: "/vice-principal/announcements", label: "Announcements", icon: "announcements", group: "COMMUNICATION" },

  // No Audit Log, no Requests & Approvals here -- VP is not authorized for
  // either (see this file's own header comment).
  { href: "/vice-principal/reports", label: "Reports", icon: "reports", group: "ADMINISTRATION" },

  // Own employment self-service -- same real /staff/me/* endpoints Principal's
  // web console uses, both already @Roles('ADMIN','PRINCIPAL','VICE_PRINCIPAL').
  // Placed after Administration, before System, matching Principal's own
  // agreed placement.
  { href: "/vice-principal/my-attendance", label: "My Attendance", icon: "attendance", group: "MY RECORD" },
  { href: "/vice-principal/my-leave", label: "My Leave", icon: "requests", group: "MY RECORD" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

// Same first-letter-of-each-word initials helper Principal's layout uses for
// its sidebar header/footer tiles.
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default async function VicePrincipalLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately VICE_PRINCIPAL-only, not "|| PRINCIPAL" or "|| ADMIN" --
  // matching Principal's own precedent (another role's oversight of this
  // module is a separate, narrower page under its own route, never "viewing
  // as" VP's own operational shell).
  if (!actor.roles.includes("VICE_PRINCIPAL")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Design reframe (per the user's "change the components in admin and
  // vice_principal also" instruction) -- same scoped token/font cascade +
  // header chrome as Principal's own layout, VP's real nav/data/access
  // boundaries (see this file's own header comment) untouched.
  const academicYears = await listAcademicYears().catch(() => []);
  const currentYear = academicYears.find((y) => y.isCurrent) ?? academicYears[0];
  const terms = currentYear ? await listAcademicTerms(currentYear.id).catch(() => []) : [];
  const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];
  const schoolProfile = await getSchoolProfile().catch(() => null);
  const schoolName = schoolProfile?.name ?? "School EOS";

  return (
    <div className={reframeThemeClassName(REFRAME_SCOPE)}>
      <ReframeThemeStyle scope={REFRAME_SCOPE} />
      <Shell
        personName={personName}
        roleLabel="Vice Principal"
        onSignOut={logoutAction}
        pendingRequestsCount={0}
        navItems={VICE_PRINCIPAL_NAV_ITEMS}
        requestsHref="/vice-principal"
        showGlobalSearch
        headerExtra={
          <ReframeHeaderChrome academicYearName={currentYear?.name} termName={currentTerm?.name} />
        }
        // Sidebar logo tile + real school name + role subtitle, and sidebar
        // footer identity card -- same real chrome Principal's layout already
        // has, per the user's "implement in admin and vice_principal also"
        // instruction. Purely additive visual chrome; the header's existing
        // notification bell + avatar sign-out menu is untouched.
        sidebarHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[#0f2342] text-[13px] font-bold text-white">
              {initials(schoolName)}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[16px] font-semibold leading-tight tracking-[-0.01em] text-text">{schoolName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">Vice Principal&apos;s office</div>
            </div>
          </div>
        }
        sidebarFooter={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f2342] text-[13px] font-semibold text-white">
              {initials(personName || "Vice Principal")}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[14px] font-semibold leading-tight text-text">{personName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">Vice Principal</div>
            </div>
          </div>
        }
      >
        {children}
      </Shell>
    </div>
  );
}
