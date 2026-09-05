"use client";

// Staff attendance filters -- teaching status, and (for teaching staff) which
// class/section/subject they're actually assigned to, via the real
// subject_offering teaching-assignment table (same join Faculty's own filter
// uses). Defaults to no filter at all, i.e. every active staff member.

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

export function StaffAttendanceFilterBar({
  date,
  isTeaching,
  gradeId,
  sectionId,
  subjectId,
  grades,
  sections,
  subjects,
}: {
  date: string;
  isTeaching: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
}) {
  const [selectedIsTeaching, setSelectedIsTeaching] = useState(isTeaching);
  const [selectedGradeId, setSelectedGradeId] = useState(gradeId);
  const visibleSections = selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : [];

  return (
    <form action="/admin/attendance" className="mt-6 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Date</span>
        <AutoSubmitSearchInput
          type="date"
          name="date"
          defaultValue={date}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Staff type</span>
        <AutoSubmitSelect
          name="isTeaching"
          defaultValue={isTeaching}
          onChange={(e) => setSelectedIsTeaching(e.target.value)}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All faculty &amp; staff</option>
          <option value="true">Teaching only</option>
          <option value="false">Non-teaching only</option>
        </AutoSubmitSelect>
      </label>

      {selectedIsTeaching === "true" && (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Standard</span>
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
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Section</span>
            <AutoSubmitSelect
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
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Subject</span>
            <AutoSubmitSelect
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
          </label>
        </>
      )}
    </form>
  );
}
