// Timetable -- real data from timetable_slot/timetable_period/subject_offering,
// which already existed fully populated in the database with no API in front of
// it (see query.md). Pick a Standard + Section, see that section's real weekly
// grid.

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

  const selectedSection = sections.find((s) => s.id === params.sectionId);
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
            defaultValue={params.gradeId ?? ""}
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
            defaultValue={params.sectionId ?? ""}
            className="min-w-[160px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="">Select a section</option>
            {visibleSections.map((s) => (
              <option key={s.id} value={s.id}>
                {params.gradeId ? s.name : `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6">
        {!params.sectionId ? (
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
