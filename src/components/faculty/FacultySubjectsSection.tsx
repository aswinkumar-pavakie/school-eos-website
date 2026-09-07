"use client";

// "Which subject is this faculty handling" -- the real, already-populated
// teaching-assignment table (subject_offering.teacher_staff_id) had no admin
// UI in front of it at all until now. Shows what this faculty currently
// teaches, and lets the admin pick a Standard/Section to see that section's
// subjects and assign one to this faculty -- which takes over from whoever
// currently teaches it, so the current teacher is always shown before
// confirming.

import { useState, useTransition } from "react";
import {
  assignSubjectTeacherAction,
  listSectionSubjectOfferingsAction,
  type SectionSubjectOffering,
} from "@/app/(dashboard)/admin/faculty/actions";

export interface TaughtOffering {
  id: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
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

export function FacultySubjectsSection({
  staffId,
  facultyDetailPath,
  taught,
  grades,
  sections,
}: {
  staffId: string;
  facultyDetailPath: string;
  taught: TaughtOffering[];
  grades: Grade[];
  sections: Section[];
}) {
  const [adding, setAdding] = useState(false);
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [offerings, setOfferings] = useState<SectionSubjectOffering[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleSections = gradeId ? sections.filter((s) => s.gradeId === gradeId) : [];

  function onSectionChange(id: string) {
    setSectionId(id);
    setOfferings(null);
    setLoadError(null);
    setNotice(null);
    if (!id) return;
    setIsLoading(true);
    startTransition(async () => {
      const result = await listSectionSubjectOfferingsAction(id);
      setIsLoading(false);
      if ("error" in result) {
        setLoadError(result.error);
        return;
      }
      setOfferings(result.data);
    });
  }

  function assign(offeringId: string) {
    setAssignError(null);
    setNotice(null);
    setAssigningId(offeringId);
    startTransition(async () => {
      const result = await assignSubjectTeacherAction(offeringId, staffId, facultyDetailPath);
      setAssigningId(null);
      if (result.error) {
        setAssignError(result.error);
        return;
      }
      setNotice("Subject assigned. It now shows under “Currently teaching” above.");
      // Reflect the new teacher in the still-open list without a full reload.
      setOfferings((prev) =>
        prev
          ? prev.map((o) => (o.id === offeringId ? { ...o, teacherStaffId: staffId } : o))
          : prev,
      );
    });
  }

  return (
    <div>
      <p className="mt-1 text-sm text-text-muted">
        {taught.length === 0 ? "Not currently assigned to teach any subject." : "Currently teaching:"}
      </p>
      {taught.length > 0 && (
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {taught.map((t) => (
            <li key={t.id} className="py-2 text-[13.5px] text-text">
              {t.gradeName} {t.sectionName} <span className="text-text-muted">· {t.subjectName}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Assign a subject
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setGradeId("");
              setSectionId("");
              setOfferings(null);
            }}
            className="text-[13px] font-semibold text-text-muted"
          >
            Cancel
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 flex flex-col gap-3 rounded-[11px] bg-field p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Standard</span>
              <select
                value={gradeId}
                onChange={(e) => {
                  setGradeId(e.target.value);
                  onSectionChange("");
                }}
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
              >
                <option value="">Select a standard</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Section</span>
              <select
                value={sectionId}
                onChange={(e) => onSectionChange(e.target.value)}
                disabled={!gradeId}
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">Select a section</option>
                {visibleSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading && <p className="text-xs text-text-muted">Loading subjects…</p>}
          {loadError && <p className="text-xs text-critical-text">{loadError}</p>}
          {assignError && <p className="text-xs text-critical-text">{assignError}</p>}
          {notice && <p className="text-xs text-success-text">{notice}</p>}

          {offerings && (
            <ul className="flex flex-col divide-y divide-border">
              {offerings.length === 0 && <li className="py-2 text-sm text-text-muted">No subjects set up for this section.</li>}
              {offerings.map((o) => {
                const isCurrentTeacher = o.teacherStaffId === staffId;
                return (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-[13px]">
                    <div>
                      <p className="font-semibold text-text">{o.subjectName}</p>
                      <p className="text-xs text-text-muted">
                        {isCurrentTeacher
                          ? "Already assigned to this faculty"
                          : o.teacherFirstName
                            ? `Currently: ${o.teacherFirstName} ${o.teacherLastName ?? ""}`
                            : "Currently unassigned"}
                      </p>
                    </div>
                    {!isCurrentTeacher && (
                      <button
                        type="button"
                        disabled={isPending && assigningId === o.id}
                        onClick={() => assign(o.id)}
                        className="rounded-[7px] bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {isPending && assigningId === o.id ? "Assigning…" : "Assign"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
