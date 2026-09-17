// Shared "Class timetable" view for Principal/Vice Principal/Admin -- pixel
// matches the SIS mockup's classtt page (Principal Console.dc.html, timetable()
// around line 1323 and the "classtt" page block around line 1582): a
// Standard/Section/Term filter bar of bordered selects, a card with a
// "Class {grade}-{section} timetable" heading + a real "CLASSES x-y ·
// published by <name>, academic co-ordinator" meta line, and a period x day
// grid of hover-lift tiles (same hover spec as RouteRow.tsx's dense grid rows).
//
// Term is real (fetched from /academic-terms, defaults to the current term)
// and included in the filter bar/URL for parity with the mockup, but
// timetable_slot has no term_id column in the real schema -- there is only
// one live weekly timetable per section, not one per term -- so changing the
// Term select intentionally does not change which slots are shown. Nothing
// here is fabricated: every subject/teacher/period cell comes straight from
// GET /timetable?sectionId=.

import { Fragment } from "react";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { TimetableSlot } from "./TimetableGrid";

const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface Grade {
  id: string;
  name: string;
  levelNo?: number;
  stage?: string | null;
}
export interface Section {
  id: string;
  gradeId: string;
  name: string;
}
export interface AcademicTerm {
  id: string;
  name: string;
  termNumber: number;
  isCurrent: boolean;
}
export interface CoordinatorAssignment {
  id: string;
  personFirstName: string;
  personLastName: string | null;
  roleCode: string;
  scopeId: string | null;
  scopeStage: string | null;
}

// Same hover spec as RouteRow.tsx's dense grid rows: a -3px lift, a light
// blue fill, a real outline (not border, so it doesn't shove siblings), and a
// shadow -- reused verbatim, just applied to a small tile instead of a full
// row.
const TILE_HOVER =
  "rounded-[10px] border border-border bg-surface p-3 outline outline-1 outline-transparent -outline-offset-1 transition-[transform,outline-color,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:outline-primary hover:shadow-[0_10px_22px_rgba(29,78,216,0.14)] hover:z-[2] relative";

function eyebrow(label: string) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">{label}</span>;
}

const FIELD_CLASS =
  "min-w-[160px] rounded-[10px] border border-border bg-surface px-3.5 py-2.5 text-[15px] text-text outline-none transition-colors focus:border-primary";

export function ClassTimetableView({
  formAction,
  subtitle,
  grades,
  visibleSections,
  gradeId,
  sectionId,
  gradeById,
  terms,
  termId,
  slots,
  coordinatorAssignments,
}: {
  formAction: string;
  subtitle: string;
  grades: Grade[];
  visibleSections: Section[];
  gradeId?: string;
  sectionId?: string;
  gradeById: Map<string, string>;
  terms: AcademicTerm[];
  termId?: string;
  slots: TimetableSlot[];
  coordinatorAssignments: CoordinatorAssignment[];
}) {
  const selectedGrade = grades.find((g) => g.id === gradeId);
  const selectedSection = visibleSections.find((s) => s.id === sectionId);
  const cardTitle =
    selectedGrade && selectedSection ? `Class ${selectedGrade.name}-${selectedSection.name} timetable` : "Timetable";

  // Real "who covers this standard" lookup -- an Academic Coordinator's real
  // role_assignment scopes to a stage (see CoordinatorsPanel.tsx), so find the
  // one whose scopeStage matches this grade's own real stage, or a
  // grade-scoped one whose scopeId is this exact grade. No fabricated name is
  // ever shown -- if no coordinator assignment covers this grade, the meta
  // line just omits the "published by" clause.
  const coordinator = selectedGrade
    ? coordinatorAssignments.find(
        (c) =>
          c.roleCode === "ACADEMIC_COORDINATOR" &&
          (c.scopeId === selectedGrade.id || (c.scopeStage && c.scopeStage === selectedGrade.stage)),
      )
    : undefined;
  const stageGrades = selectedGrade?.stage ? grades.filter((g) => g.stage === selectedGrade.stage) : [];
  const stageLevels = stageGrades.map((g) => g.levelNo).filter((n): n is number => typeof n === "number");
  const classesRange =
    stageLevels.length > 0 ? `Classes ${Math.min(...stageLevels)}-${Math.max(...stageLevels)}` : null;
  const metaParts = [
    classesRange,
    coordinator
      ? `published by ${coordinator.personFirstName} ${coordinator.personLastName ?? ""}, academic co-ordinator`.trim()
      : null,
  ].filter(Boolean);

  const periods = [...new Map(slots.map((s) => [s.periodNo, s])).values()].sort((a, b) => a.periodNo - b.periodNo);
  const days = [...new Set(slots.map((s) => s.dayOfWeek))].sort((a, b) => a - b);
  const byCell = new Map<string, TimetableSlot>();
  for (const s of slots) byCell.set(`${s.dayOfWeek}-${s.periodNo}`, s);

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Class timetable</h1>
      <p className="mt-1 text-sm text-text-muted">{subtitle}</p>

      <form
        action={formAction}
        className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] items-end gap-4 rounded-[14px] border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-2">
          {eyebrow("Standard")}
          <AutoSubmitSelect name="gradeId" defaultValue={gradeId ?? ""} className={FIELD_CLASS}>
            <option value="">Select a standard</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-2">
          {eyebrow("Section")}
          <AutoSubmitSelect name="sectionId" defaultValue={sectionId ?? ""} className={FIELD_CLASS}>
            <option value="">Select a section</option>
            {visibleSections.map((s) => (
              <option key={s.id} value={s.id}>
                {gradeId ? s.name : `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-2">
          {eyebrow("Term")}
          <AutoSubmitSelect name="termId" defaultValue={termId ?? ""} className={FIELD_CLASS}>
            {terms.length === 0 && <option value="">No terms on file</option>}
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isCurrent ? " · current" : ""}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6">
        {!sectionId ? (
          <p className="text-sm text-text-muted">Pick a standard and section to see its timetable.</p>
        ) : (
          <div className="rounded-[16px] border border-border bg-surface p-5">
            <h2 className="text-[17px] font-extrabold leading-[22px] text-text">{cardTitle}</h2>
            {metaParts.length > 0 && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">
                {metaParts.join(" · ")}
              </p>
            )}

            <div className="mt-4">
              {slots.length === 0 ? (
                <p className="text-sm text-text-muted">No timetable published for this class, section and term yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div
                    className="grid min-w-[860px] gap-2.5"
                    style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(130px, 1fr))` }}
                  >
                    <div />
                    {days.map((d) => (
                      <div key={d} className="px-1 text-[14px] font-semibold text-text">
                        {DAY_LABELS[d]}
                      </div>
                    ))}
                    {periods.map((period) => (
                      <Fragment key={period.periodNo}>
                        <div className="flex flex-col gap-0.5 px-1 py-2">
                          <span className="text-[13px] font-semibold text-text">{period.periodLabel}</span>
                          <span className="font-mono text-[11px] text-text-muted">
                            {period.startTime.slice(0, 5)}-{period.endTime.slice(0, 5)}
                          </span>
                        </div>
                        {days.map((d) => {
                          const slot = byCell.get(`${d}-${period.periodNo}`);
                          return (
                            <div key={`${d}-${period.periodNo}`} className={TILE_HOVER}>
                              {slot ? (
                                <>
                                  <p className="text-[13px] font-semibold text-text">{slot.subjectName}</p>
                                  <p className="mt-0.5 text-xs text-text-muted">
                                    {slot.teacherFirstName} {slot.teacherLastName ?? ""}
                                  </p>
                                </>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
