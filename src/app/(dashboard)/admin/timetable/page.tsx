// Timetable -- real data from timetable_slot/timetable_period/subject_offering,
// which already existed fully populated in the database with no API in front of
// it (see query.md). Pick a Standard + Section, see that section's real weekly
// grid, rendered through the shared ClassTimetableView (pixel-matched to the
// SIS mockup's classtt page, and reused as-is by Principal/Vice Principal's own
// read-only copies of this page).
//
// On a fresh page load (neither gradeId nor sectionId in the URL yet) this
// defaults to the lowest standard's first section instead of an empty
// "pick something" prompt -- GET /grades already returns grades ordered by
// the real level_no column (grade.repository.ts: `ORDER BY level_no`), so
// grades[0] is genuinely the lowest standard, not an arbitrary/alphabetical
// pick (which would wrongly put "Standard 10" before "Standard 2"). Once the
// admin explicitly picks a standard or section via the selects below, that
// explicit choice always wins -- this default only fills the truly blank
// first-visit state.

import {
  ClassTimetableView,
  type Grade,
  type Section,
  type AcademicTerm,
  type CoordinatorAssignment,
} from "@/components/academics/ClassTimetableView";
import { type TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";

export default async function TimetablePage({
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

  const isFreshLoad = !params.gradeId && !params.sectionId;
  const defaultGradeId = grades[0]?.id;
  const defaultSectionId = defaultGradeId
    ? sections
        .filter((s) => s.gradeId === defaultGradeId)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))[0]?.id
    : undefined;
  const effectiveGradeId = isFreshLoad ? defaultGradeId : params.gradeId;
  const effectiveSectionId = isFreshLoad ? defaultSectionId : params.sectionId;

  const visibleSections = (
    effectiveGradeId ? sections.filter((s) => s.gradeId === effectiveGradeId) : sections
  )
    .slice()
    .sort((a, b) => {
      if (effectiveGradeId) return a.name.localeCompare(b.name);
      const gradeCompare = (gradeById.get(a.gradeId) ?? "").localeCompare(gradeById.get(b.gradeId) ?? "");
      return gradeCompare !== 0 ? gradeCompare : a.name.localeCompare(b.name);
    });

  let slots: TimetableSlot[] = [];
  if (effectiveSectionId) {
    const res = await apiFetch(`/timetable?sectionId=${effectiveSectionId}`);
    if (res.ok) slots = ((await res.json()) as { data: TimetableSlot[] }).data;
  }

  const effectiveTermId = params.termId ?? terms.find((t) => t.isCurrent)?.id;

  return (
    <ClassTimetableView
      formAction="/admin/timetable"
      subtitle="Published by the academic co-ordinators · real weekly schedule, by class and section."
      grades={grades}
      visibleSections={visibleSections}
      gradeId={effectiveGradeId}
      sectionId={effectiveSectionId}
      gradeById={gradeById}
      terms={terms}
      termId={effectiveTermId}
      slots={slots}
      coordinatorAssignments={coordinatorAssignments}
    />
  );
}
