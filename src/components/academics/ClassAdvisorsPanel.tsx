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
  // grades is already ordered by the real level_no column (GET /grades --
  // see grade.repository.ts's own `ORDER BY level_no`), so its array
  // position is the correct LKG/UKG-first, ascending-standard rank -- sort
  // the "all sections" view by that instead of leaving it in GET /sections'
  // own name-only order (which ties across every standard's "A" section and
  // otherwise shows standards in an arbitrary order).
  const gradeRank = new Map(grades.map((g, index) => [g.id, index]));
  const visibleSections = (
    sectionFilter ? sectionsInGrade.filter((s) => s.id === sectionFilter) : gradeFilter ? sectionsInGrade : sections
  )
    .slice()
    .sort((a, b) => {
      const rankDiff = (gradeRank.get(a.gradeId) ?? 0) - (gradeRank.get(b.gradeId) ?? 0);
      return rankDiff !== 0 ? rankDiff : a.name.localeCompare(b.name);
    });

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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Standard</th>
              <th className="py-2.5 pr-3">Section</th>
              <th className="py-2.5 pr-3">Faculty name</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleSections.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-text-muted">
                  No sections match this filter.
                </td>
              </tr>
            )}
            {visibleSections.map((section) => (
              <SectionAdvisorRow
                key={section.id}
                section={section}
                gradeName={gradeById.get(section.gradeId) ?? "—"}
                current={advisorBySection.get(section.id) ?? null}
                academicYearId={academicYearId}
              />
            ))}
          </tbody>
        </table>
      </div>
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
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{gradeName}</td>
        <td className="py-3 pr-3 text-text">{section.name}</td>
        <td className="py-3 pr-3">
          {current ? (
            <span className="text-text">
              {current.personFirstName} {current.personLastName ?? ""}
            </span>
          ) : (
            <span className="text-text-muted">Not assigned</span>
          )}
        </td>
        <td className="py-3 text-right">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[13px] font-semibold text-primary"
          >
            {current ? "Change" : "Assign"}
          </button>
        </td>
      </tr>

      {editing && (
        <tr>
          <td colSpan={4} className="pb-3">
            <form
              action={(formData) => {
                formAction(formData);
                setEditing(false);
              }}
              className="flex flex-wrap items-end gap-3 rounded-[11px] bg-field p-3"
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
          </td>
        </tr>
      )}
    </>
  );
}
