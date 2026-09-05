"use client";

// Centralized "which staff member advises which section" screen -- one row per
// section, current advisor (if any) shown inline, Assign/Change opens a search
// picker right there. Chosen over editing this from each staff member's own
// profile one at a time, since a single table showing every section's advisor at
// a glance is the clearer way to answer "who's the advisor for 5-B?" -- the
// Faculty profile still shows a staff member's own advisor assignments, read-only,
// linking back here to change them.

import { useActionState, useState } from "react";
import { assignClassAdvisorAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StaffPersonPicker } from "./StaffPersonPicker";

const initialState: FormActionState = {};

export interface Section {
  id: string;
  gradeId: string;
  name: string;
}
export interface Grade {
  id: string;
  name: string;
}
export interface ClassAdvisorAssignment {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  scopeId: string | null;
}

export function ClassAdvisorsPanel({
  sections,
  grades,
  assignments,
  academicYearId,
}: {
  sections: Section[];
  grades: Grade[];
  assignments: ClassAdvisorAssignment[];
  academicYearId?: string;
}) {
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const gradeById = new Map(grades.map((g) => [g.id, g.name]));
  const advisorBySection = new Map(assignments.map((a) => [a.scopeId, a]));
  const sectionsInGrade = gradeFilter ? sections.filter((s) => s.gradeId === gradeFilter) : [];
  const visibleSections = sectionFilter
    ? sectionsInGrade.filter((s) => s.id === sectionFilter)
    : gradeFilter
      ? sectionsInGrade
      : sections;

  if (!academicYearId) {
    return <p className="text-sm text-text-muted">Set a current academic year first (Academic years tab).</p>;
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-text-muted">
        One advisor per section, for the current academic year. Assigning a new one automatically ends the previous
        assignment.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-text">Filter by standard</span>
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setSectionFilter("");
            }}
            className="rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">All</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-text">Section</span>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!gradeFilter}
            className="rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">All</option>
            {sectionsInGrade.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {visibleSections.map((section) => (
          <SectionAdvisorRow
            key={section.id}
            section={section}
            gradeName={gradeById.get(section.gradeId) ?? "—"}
            current={advisorBySection.get(section.id) ?? null}
            academicYearId={academicYearId}
          />
        ))}
      </ul>
    </div>
  );
}

function SectionAdvisorRow({
  section,
  gradeName,
  current,
  academicYearId,
}: {
  section: Section;
  gradeName: string;
  current: ClassAdvisorAssignment | null;
  academicYearId: string;
}) {
  const [editing, setEditing] = useState(false);
  const action = assignClassAdvisorAction.bind(null, section.id, current?.id, academicYearId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-text">
          {gradeName} · {section.name}
        </p>
        <div className="flex items-center gap-3">
          {current ? (
            <span className="text-sm text-text">
              {current.personFirstName} {current.personLastName ?? ""}
            </span>
          ) : (
            <span className="text-sm text-text-muted">Not assigned</span>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[13px] font-semibold text-primary"
          >
            {current ? "Change" : "Assign"}
          </button>
        </div>
      </div>

      {editing && (
        <form
          action={(formData) => {
            formAction(formData);
            setEditing(false);
          }}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-[11px] bg-field p-3"
        >
          {state.error && (
            <p className="w-full rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
          )}
          <div className="min-w-[240px]">
            <StaffPersonPicker disabled={isPending} />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </li>
  );
}
