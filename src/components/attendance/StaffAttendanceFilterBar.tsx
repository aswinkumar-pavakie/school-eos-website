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
  formAction,
}: {
  date: string;
  isTeaching: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  // Additive, defaults to Admin's own page so its existing usage is
  // unaffected -- Principal's oversight view passes its own route.
  formAction?: string;
}) {
  const [selectedIsTeaching, setSelectedIsTeaching] = useState(isTeaching);
  const [selectedGradeId, setSelectedGradeId] = useState(gradeId);
  const visibleSections = selectedGradeId ? sections.filter((s) => s.gradeId === selectedGradeId) : [];

  return (
    <form action={formAction ?? "/admin/attendance"} className="mt-6 grid grid-cols-1 gap-[18px] rounded-[14px] border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>Date</span>
        <AutoSubmitSearchInput
          type="date"
          name="date"
          defaultValue={date}
          className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>Staff type</span>
        <AutoSubmitSelect
          name="isTeaching"
          defaultValue={isTeaching}
          onChange={(e) => setSelectedIsTeaching(e.target.value)}
          className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none transition-colors focus:border-primary"
        >
          <option value="">All faculty &amp; staff</option>
          <option value="true">Teaching only</option>
          <option value="false">Non-teaching only</option>
        </AutoSubmitSelect>
      </label>

      {selectedIsTeaching === "true" && (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>Standard</span>
            <AutoSubmitSelect
              name="gradeId"
              defaultValue={gradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none transition-colors focus:border-primary"
            >
              <option value="">All standards</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>Section</span>
            <AutoSubmitSelect
              name="sectionId"
              defaultValue={sectionId}
              disabled={!selectedGradeId}
              className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none transition-colors focus:border-primary disabled:opacity-50"
            >
              <option value="">All sections</option>
              {visibleSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </AutoSubmitSelect>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-label, var(--color-text-muted))" }}>Subject</span>
            <AutoSubmitSelect
              name="subjectId"
              defaultValue={subjectId}
              className="rounded-[10px] border border-[#dfe5ef] bg-surface p-[14px] text-[15px] text-text outline-none transition-colors focus:border-primary"
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
