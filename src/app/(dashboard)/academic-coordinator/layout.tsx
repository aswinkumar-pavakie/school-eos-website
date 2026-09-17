import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AcademicCoordinatorShell, type StageOption } from "@/components/academic-coordinator-ui/AcademicCoordinatorShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { getCoordinatorMe } from "@/lib/faculty-coordinator-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function AcademicCoordinatorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  // Two ways to legitimately reach this portal: a faculty member using their
  // own shared FACULTY login for a coordinator grant they also hold, OR a
  // genuinely separate coordinator-only login (Admin's own "coordinator
  // login" flow -- persons.service.ts's createAcademicCoordinatorLogin --
  // whose JWT carries ACADEMIC_COORDINATOR only, no FACULTY at all). Either
  // way, faculty-academic-coordinator.controller.ts's own guard accepts both
  // role_codes and re-derives real coordinator scope from role_assignment on
  // every call, never trusting a cached flag -- getCoordinatorMe() below is
  // that same live check, not a second, separate one.
  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  const hasPlausibleAccess = actor.roles.includes("FACULTY") || actor.roles.includes("ACADEMIC_COORDINATOR");
  if (!hasPlausibleAccess) redirect("/login");

  const coordinatorMe = await getCoordinatorMe().catch(() => ({ isCoordinator: false, stages: [], grades: [] }));
  // A FACULTY account that isn't a coordinator goes back to /faculty -- a
  // valid user, just not authorized for this portal. A coordinator-only
  // login that somehow isn't a real coordinator (role_assignment revoked
  // after the login was created, say) has nowhere else on this site to go.
  if (!coordinatorMe.isCoordinator) redirect(actor.roles.includes("FACULTY") ? "/faculty" : "/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // "Grades 1–5" per real stage -- computed from this coordinator's own
  // real grade list (coordinatorMe.grades), never hardcoded, since a
  // school's own stage-to-grade mapping can differ from the design's demo
  // (g1_5/g6_8/g9_10/g11_12).
  const stageOptions: StageOption[] = coordinatorMe.stages.map((stage) => {
    const gradesInStage = coordinatorMe.grades.filter((g) => g.stage === stage).sort((a, b) => a.levelNo - b.levelNo);
    const gradeRangeLabel =
      gradesInStage.length === 0
        ? stage
        : gradesInStage.length === 1
          ? `Grade ${gradesInStage[0].gradeName}`
          : `Grades ${gradesInStage[0].gradeName}–${gradesInStage[gradesInStage.length - 1].gradeName}`;
    return { value: stage, gradeRangeLabel };
  });

  return (
    <AcademicCoordinatorShell personName={personName} stageOptions={stageOptions} hasFacultyAccess={actor.roles.includes("FACULTY")} onSignOut={logoutAction}>
      {children}
    </AcademicCoordinatorShell>
  );
}
