// Timetable -- real data from timetable_slot/timetable_period/subject_offering,
// which already existed fully populated in the database with no API in front of
// it (see query.md). Pick a Standard + Section, see that section's real weekly
// grid.
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

import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { TimetableGrid, type TimetableSlot } from "@/components/academics/TimetableGrid";
import { apiFetch } from "@/lib/api";

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ gradeId?: string; sectionId?: string }>;
}) {
  const params = await searchParams;

  const [gradesRes, sectionsRes] = await Promise.all([
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
  ]);
  const grades: Grade[] = gradesRes.ok ? ((await gradesRes.json()) as { data: Grade[] }).data : [];
  const sections: Section[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: Section[] }).data : [];
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

  const selectedSection = sections.find((s) => s.id === effectiveSectionId);
  const selectedSectionLabel = selectedSection
    ? `${gradeById.get(selectedSection.gradeId) ?? "—"} · Section ${selectedSection.name}`
    : null;

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Timetable</h1>
      <p className="mt-1 text-sm text-text-muted">Real weekly schedule, by class and section.</p>

      <form action="/admin/timetable" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Standard</span>
          <AutoSubmitSelect
            name="gradeId"
            defaultValue={effectiveGradeId ?? ""}
            className="min-w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">Select a standard</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Section</span>
          <AutoSubmitSelect
            name="sectionId"
            defaultValue={effectiveSectionId ?? ""}
            className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">Select a section</option>
            {visibleSections.map((s) => (
              <option key={s.id} value={s.id}>
                {effectiveGradeId ? s.name : `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6">
        {!effectiveSectionId ? (
          <p className="text-sm text-text-muted">Pick a standard and section to see its timetable.</p>
        ) : (
          <>
            <h2 className="text-[17px] font-extrabold leading-[22px] text-text">
              {selectedSectionLabel ?? "Timetable"}
            </h2>
            <div className="mt-3">
              <TimetableGrid slots={slots} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
