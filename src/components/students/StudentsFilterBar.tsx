"use client";

// Students filter row -- search + Standard + Section, auto-submitting (no Apply
// button). With a Standard picked, Section narrows to that standard's own
// sections (shows just "A", "B" -- the standard is already picked by the sibling
// dropdown, so repeating it in every option was noise). With no Standard picked,
// the same section letter exists once per grade (a school has an "A" section in
// every standard) -- showing one raw option per grade+section row would repeat
// "A" a dozen times, so this collapses to the distinct letters instead and
// filters by name across every standard (sectionName, not sectionId).

import { useState } from "react";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

export function StudentsFilterBar({
  search,
  gradeId,
  sectionId,
  sectionName,
  status,
  grades,
  sections,
}: {
  search: string;
  gradeId: string;
  sectionId: string;
  sectionName?: string;
  status?: string;
  grades: Grade[];
  sections: Section[];
}) {
  const [selectedGradeId, setSelectedGradeId] = useState(gradeId);
  const visibleSections = selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : [];
  const distinctSectionNames = [...new Set(sections.map((s) => s.name))].sort();

  return (
    <form action="/admin/students" className="mt-6 flex flex-wrap items-end gap-3">
      {status && <input type="hidden" name="status" value={status} />}
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by name or admission number…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="gradeId"
        defaultValue={gradeId}
        onChange={(e) => setSelectedGradeId(e.target.value)}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All standards</option>
        {grades.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </AutoSubmitSelect>
      {selectedGradeId ? (
        <AutoSubmitSelect
          key="sectionId"
          name="sectionId"
          defaultValue={sectionId}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All sections</option>
          {visibleSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </AutoSubmitSelect>
      ) : (
        <AutoSubmitSelect
          key="sectionName"
          name="sectionName"
          defaultValue={sectionName ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All sections</option>
          {distinctSectionNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </AutoSubmitSelect>
      )}
    </form>
  );
}
