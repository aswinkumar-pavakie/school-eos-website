// Vice Principal's Class Timetable -- same read-only oversight as Principal's
// own copy (Phase 9 mobile Class Timetable module), reusing the shared
// ClassTimetableView (pixel-matched to the SIS mockup's classtt page) and the
// same real data: /timetable?sectionId=, /grades, /sections, /academic-terms
// and coordinator role_assignments for the meta line. No write capability
// exists anywhere in this app for Class Timetable yet, for any role.

import {
  ClassTimetableView,
  type Grade,
  type Section,
  type AcademicTerm,
  type CoordinatorAssignment,
} from "@/components/academics/ClassTimetableView";
import { type TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";

export default async function VicePrincipalClassTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ gradeId?: string; sectionId?: string; termId?: string }>;
}) {
  const params = await searchParams;

  const [gradesRes, sectionsRes, termsRes, coordinatorsRes] = await Promise.all([
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    apiFetch("/academic-terms"),
    apiFetch("/role-assignments?roleCode=ACADEMIC_COORDINATOR&status=ACTIVE"),
  ]);
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
  const terms: AcademicTerm[] = termsRes.ok ? ((await termsRes.json()) as { data: AcademicTerm[] }).data : [];
  const coordinatorAssignments: CoordinatorAssignment[] = coordinatorsRes.ok
    ? ((await coordinatorsRes.json()) as { data: CoordinatorAssignment[] }).data
    : [];

  const gradeById = new Map(grades.map((g) => [g.id, g.name]));
  const visibleSections = (
    params.gradeId ? sections.filter((s) => s.gradeId === params.gradeId) : sections
  )
    .slice()
    .sort((a, b) => {
      if (params.gradeId) return a.name.localeCompare(b.name);
      const gradeCompare = (gradeById.get(a.gradeId) ?? "").localeCompare(gradeById.get(b.gradeId) ?? "");
      return gradeCompare !== 0 ? gradeCompare : a.name.localeCompare(b.name);
    });

  let slots: TimetableSlot[] = [];
  if (params.sectionId) {
    const res = await apiFetch(`/timetable?sectionId=${params.sectionId}`);
    if (res.ok) slots = ((await res.json()) as { data: TimetableSlot[] }).data;
  }

  const effectiveTermId = params.termId ?? terms.find((t) => t.isCurrent)?.id;

  return (
    <ClassTimetableView
      formAction="/vice-principal/academics/class-timetable"
      subtitle="Published by the academic co-ordinators · read only for the vice principal"
      grades={grades}
      visibleSections={visibleSections}
      gradeId={params.gradeId}
      sectionId={params.sectionId}
      gradeById={gradeById}
      terms={terms}
      termId={effectiveTermId}
      slots={slots}
      coordinatorAssignments={coordinatorAssignments}
    />
  );
}
