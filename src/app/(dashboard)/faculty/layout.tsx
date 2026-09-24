import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FacultyShell } from "@/components/faculty-ui/FacultyShell";
import { buildClassTeacherNavGroups, buildFacultyNavGroups } from "@/components/faculty-ui/nav-items";
import type { SwitcherData } from "@/components/faculty-ui/AccountSwitcher";
import { labelForRoles, readActiveClass, readActiveIdentity, readHomeAccount } from "@/lib/account-switch";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getCoordinatorMe } from "@/lib/faculty-coordinator-api";
import { apiFetch } from "@/lib/api";
import { getFacultyCommute, listAdvisorSections, listStudentLeaveRequests } from "@/lib/faculty-api";
import { listEvents } from "@/lib/faculty-permissions-api";
import { isUpcoming } from "@/lib/faculty-time";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

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

  const actorOrNull = await getCurrentActor().catch(() => null);
  // /faculty serves two logins: Faculty, and a Class Teacher login (a
  // per-section login carrying only CLASS_ADVISOR) in its own, smaller view.
  if (!actorOrNull || !(actorOrNull.roles.includes("FACULTY") || actorOrNull.roles.includes("CLASS_ADVISOR"))) {
    redirect("/login");
  }
  const actor = actorOrNull;
  const isClassTeacherLogin = !actor.roles.includes("FACULTY");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Real, live checks -- never cached, never assumed from a role on the login
  // token. Same posture the previous flat-nav layout already established.
  // Coordinator / sports / consent-event reads are Faculty-only on the
  // backend, so a Class Teacher login skips them instead of collecting 403s.
  const [coordinatorMe, commute, sections, pendingLeave, events] = await Promise.all([
    isClassTeacherLogin ? Promise.resolve({ isCoordinator: false }) : getCoordinatorMe().catch(() => ({ isCoordinator: false })),
    isClassTeacherLogin ? Promise.resolve(null) : getFacultyCommute().catch(() => null),
    listAdvisorSections().catch(() => []),
    listStudentLeaveRequests()
      .then((rows) => rows.filter((r) => r.state === "PENDING").length)
      .catch(() => 0),
    // Real: /faculty/events -- badge = upcoming (not-yet-past) consent
    // requests needing attention, same convention as the leave badge.
    isClassTeacherLogin ? Promise.resolve([]) : listEvents().catch(() => []),
  ]);
  const pendingPermissions = events.filter((e) => isUpcoming(e.endsAt)).length;

  // "8-B", "9-A" etc -- the design's own "MY CLASS · 8-B" / "Class teacher ·
  // 8-B" convention. A faculty member with multiple advised sections (rare)
  // just shows the first here; each screen needing a specific section still
  // resolves it independently via listAdvisorSections(), same as before.
  const sectionLabel = sections[0] ? `${sections[0].gradeName}-${sections[0].sectionName}` : null;
  const sectionRoleLabel = sectionLabel ? `Class teacher · ${sectionLabel}` : "Faculty";

  // Account switcher (Faculty <-> Class Teacher). The active identity is the
  // one recorded at sign-in/switch; a session that predates the switcher
  // falls back to what the roles imply. Shown only when there is something
  // to switch to, so a plain Faculty's footer is unchanged.
  const cookieStoreForSwitch = await cookies();
  const activeIdentity = readActiveIdentity(cookieStoreForSwitch);
  const home = readHomeAccount(cookieStoreForSwitch);
  // The classes the ADMIN has mapped to this Faculty login (the backend is the
  // authority). Class Teacher logins have nothing to add -- only a way back.
  const available: SwitcherData["available"] = isClassTeacherLogin
    ? []
    : await apiFetch("/auth/linked-accounts/available")
        .then(async (r) => (r.ok ? ((await r.json()) as { data: SwitcherData["available"] }).data : []))
        .catch(() => []);
  // Always offered: a teacher the admin has not mapped to a class yet still sees the
  // switcher (with "no class assigned yet"), so it is there the moment they are mapped.
  const switcher: SwitcherData = {
    activeLabel: activeIdentity?.label ?? labelForRoles(actor.roles),
    activeIdentifier: activeIdentity?.identifier ?? null,
    activeClass: readActiveClass(cookieStoreForSwitch),
    home: home ? { personId: home.personId, title: home.title } : null,
    available,
  };

  // Display-only "2026–27"-style label for the topbar pill -- ScopedSection's
  // own academicYearId is an opaque id, not a display label, and there's no
  // FACULTY-authorized academic-year label endpoint today. Derived from the
  // current date (India's academic year runs June-May) rather than adding a
  // new backend dependency for a cosmetic pill.
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYear = `${startYear}–${String(startYear + 1).slice(-2)}`;

  const navGroups = isClassTeacherLogin
    ? buildClassTeacherNavGroups({ sectionLabel, pendingLeaveCount: pendingLeave })
    : buildFacultyNavGroups({
        pendingLeaveCount: pendingLeave,
        pendingPermissionsCount: pendingPermissions,
        isCoordinator: coordinatorMe.isCoordinator,
        isHosteller: commute?.isHosteller ?? false,
        usesSchoolTransport: commute?.usesSchoolTransport ?? false,
      });

  return (
    <>
      <E2eeBootstrapMount personId={actor.personId} />
      <FacultyShell
        personName={personName}
        sectionRoleLabel={sectionRoleLabel}
        academicYear={academicYear}
        navGroups={navGroups}
        switcher={switcher}
      >
        {children}
      </FacultyShell>
    </>
  );
}
