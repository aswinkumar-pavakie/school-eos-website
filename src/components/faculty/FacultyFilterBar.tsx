"use client";

// Faculty & Staff filter row -- search + status (hidden, tab bar owns it) +
// teaching-status, auto-submitting (no Apply button). What comes after the
// teaching-status select depends on it: Teaching only shows Standard/Section
// (real teaching assignments, via subject_offering)/Subject filters, since
// "which class do they teach" is what actually distinguishes teaching staff;
// Non-teaching only shows a Function dropdown (real distinct designations for
// non-teaching roles -- there's no separate department table on staff, so
// designation doubles as the "function"). With neither picked, falls back to
// the original free-text designation search across everyone.

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

interface Subject {
  id: string;
  name: string;
}

export function FacultyFilterBar({
  search,
  status,
  isTeaching,
  designation,
  gradeId,
  sectionId,
  subjectId,
  grades,
  sections,
  subjects,
  nonTeachingDesignations,
}: {
  search: string;
  status?: string;
  isTeaching: string;
  designation: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  nonTeachingDesignations: string[];
}) {
  const [selectedIsTeaching, setSelectedIsTeaching] = useState(isTeaching);
  const [selectedGradeId, setSelectedGradeId] = useState(gradeId);
  const visibleSections = selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : [];

  return (
    <form action="/admin/faculty" className="mt-6 flex flex-wrap items-end gap-3">
      {status && <input type="hidden" name="status" value={status} />}
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by name or employee number…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="isTeaching"
        defaultValue={isTeaching}
        onChange={(e) => setSelectedIsTeaching(e.target.value)}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">Teaching &amp; non-teaching</option>
        <option value="true">Teaching only</option>
        <option value="false">Non-teaching only</option>
      </AutoSubmitSelect>

      {selectedIsTeaching === "true" ? (
        <>
          <AutoSubmitSelect
            key="gradeId"
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
          <AutoSubmitSelect
            key="sectionId"
            name="sectionId"
            defaultValue={sectionId}
            disabled={!selectedGradeId}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-50"
          >
            <option value="">All sections</option>
            {visibleSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect
            key="subjectId"
            name="subjectId"
            defaultValue={subjectId}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </>
      ) : selectedIsTeaching === "false" ? (
        <AutoSubmitSelect
          key="designation-nonteaching"
          name="designation"
          defaultValue={designation}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All functions</option>
          {nonTeachingDesignations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </AutoSubmitSelect>
      ) : (
        <AutoSubmitSearchInput
          key="designation-free"
          type="search"
          name="designation"
          defaultValue={designation}
          placeholder="Designation (e.g. PGT, Librarian)…"
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        />
      )}
    </form>
  );
}
