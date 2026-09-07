"use client";

// Fee status filter row -- search + Academic year + Grade + Section, auto-
// submitting, same pattern as StudentsFilterBar/InventoryFilterBar. State is a
// set of top-level tabs on the page itself.

import { useState } from "react";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

interface AcademicYear {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

export function FeeStatusFilterBar({
  search,
  academicYearId,
  gradeId,
  sectionId,
  state,
  academicYears,
  grades,
  sections,
}: {
  search: string;
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  state?: string;
  academicYears: AcademicYear[];
  grades: Grade[];
  sections: Section[];
}) {
  const [selectedGradeId, setSelectedGradeId] = useState(gradeId);
  const visibleSections = selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : [];

  return (
    <form action="/admin/finance/overview" className="mt-6 flex flex-wrap items-end gap-3">
      {state && <input type="hidden" name="state" value={state} />}
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by student name or admission number…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="academicYearId"
        defaultValue={academicYearId}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All academic years</option>
        {academicYears.map((y) => (
          <option key={y.id} value={y.id}>
            {y.name}
          </option>
        ))}
      </AutoSubmitSelect>
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
      {selectedGradeId && (
        <AutoSubmitSelect
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
      )}
    </form>
  );
}
