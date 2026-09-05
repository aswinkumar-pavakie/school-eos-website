"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createEnrolmentAction,
  transferEnrolmentSectionAction,
  updateEnrolmentAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/students/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface EnrolmentRow {
  id: string;
  academicYearId: string;
  sectionId: string;
  rollNo: number | null;
  enrolmentType: string;
  outcome: string | null;
  enrolledOn: string;
  status: string;
  remarks: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Section {
  id: string;
  name: string;
  academicYearId: string;
  gradeId: string;
}

interface Grade {
  id: string;
  name: string;
}

const initialState: FormActionState = {};

export function EnrolmentsSection({
  studentId,
  enrolments,
  academicYears,
  sections,
  grades,
}: {
  studentId: string;
  enrolments: EnrolmentRow[];
  academicYears: AcademicYear[];
  sections: Section[];
  grades: Grade[];
}) {
  const [adding, setAdding] = useState(false);
  const createAction = createEnrolmentAction.bind(null, studentId);
  const [createState, createFormAction, isCreating] = useActionState(createAction, initialState);

  const gradeById = new Map(grades.map((g) => [g.id, g.name]));
  const sectionLabel = (s: Section) => `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`;
  const yearName = (id: string) => academicYears.find((y) => y.id === id)?.name ?? id;
  const sectionName = (id: string) => {
    const s = sections.find((s) => s.id === id);
    return s ? sectionLabel(s) : id;
  };
  const sortedSections = [...sections].sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)));

  // Active enrolment(s) first, then the rest of the history newest-first --
  // transfers create new rows, so this list is a real timeline now, not a
  // single mutable record.
  const sortedEnrolments = [...enrolments].sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
    return new Date(b.enrolledOn).getTime() - new Date(a.enrolledOn).getTime();
  });

  return (
    <div className="mt-4">
      {enrolments.length === 0 && !adding && (
        <p className="rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No enrolment on record yet.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {sortedEnrolments.map((enrolment) => (
          <EnrolmentRowItem
            key={enrolment.id}
            studentId={studentId}
            enrolment={enrolment}
            yearLabel={yearName(enrolment.academicYearId)}
            sectionsForYear={sections.filter((s) => s.academicYearId === enrolment.academicYearId)}
            currentSectionName={sectionName(enrolment.sectionId)}
            sectionLabel={sectionLabel}
          />
        ))}
      </ul>

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 text-[13px] font-semibold text-primary"
        >
          + Add enrolment
        </button>
      ) : (
        <form action={createFormAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {createState.error && (
            <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">
              {createState.error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Academic year *</span>
              <select
                name="academicYearId"
                required
                disabled={isCreating}
                defaultValue=""
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select
                </option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                    {y.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Section *</span>
              <select
                name="sectionId"
                required
                disabled={isCreating}
                defaultValue=""
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select
                </option>
                {sortedSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Roll no.</span>
              <input
                name="rollNo"
                type="number"
                min={1}
                disabled={isCreating}
                placeholder="Auto-assigned if left blank"
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Type</span>
              <select
                name="enrolmentType"
                disabled={isCreating}
                defaultValue="REGULAR"
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              >
                <option value="REGULAR">Regular</option>
                <option value="PROMOTED">Promoted</option>
                <option value="DETAINED">Detained</option>
                <option value="READMITTED">Readmitted</option>
                <option value="TRANSFER_IN">Transfer in</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isCreating ? "Adding…" : "Add enrolment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED") return "critical";
  return "pending";
}

function EnrolmentRowItem({
  studentId,
  enrolment,
  yearLabel,
  sectionsForYear,
  currentSectionName,
  sectionLabel,
}: {
  studentId: string;
  enrolment: EnrolmentRow;
  yearLabel: string;
  sectionsForYear: Section[];
  currentSectionName: string;
  sectionLabel: (s: Section) => string;
}) {
  const [transferring, setTransferring] = useState(false);
  const [editing, setEditing] = useState(false);
  const action = transferEnrolmentSectionAction.bind(null, studentId, enrolment.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const editAction = updateEnrolmentAction.bind(null, studentId, enrolment.id);
  const [editState, editFormAction, isEditing] = useActionState(editAction, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {yearLabel} · {currentSectionName}
            {enrolment.rollNo && <span className="text-text-muted"> · Roll {enrolment.rollNo}</span>}
          </p>
          <p className="text-xs text-text-muted">
            Enrolled {formatDate(enrolment.enrolledOn)} · {enrolment.enrolmentType.toLowerCase()}
          </p>
          {enrolment.remarks && <p className="mt-0.5 text-xs italic text-text-muted">{enrolment.remarks}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone(enrolment.status)} label={enrolment.status.replace(/_/g, " ")} />
          <Link
            href={`/admin/audit?objectType=student_enrolment&objectId=${enrolment.id}&returnTo=${encodeURIComponent(`/admin/students/${studentId}`)}`}
            className="text-[13px] font-semibold text-primary"
          >
            View details
          </Link>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-[13px] font-semibold text-primary"
          >
            Edit
          </button>
          {enrolment.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setTransferring((v) => !v)}
              className="text-[13px] font-semibold text-primary"
            >
              Transfer section
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form action={editFormAction} className="mt-2.5 flex flex-wrap items-center gap-2">
          {editState.error && <span className="text-xs text-critical-text">{editState.error}</span>}
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Roll no.
            <input
              name="rollNo"
              type="number"
              min={1}
              defaultValue={enrolment.rollNo ?? undefined}
              disabled={isEditing}
              className="w-20 rounded-[11px] border border-border bg-field px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Status
            <select
              name="status"
              defaultValue={enrolment.status}
              disabled={isEditing}
              className="rounded-[11px] border border-border bg-field px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="ACTIVE">Active</option>
              <option value="TRANSFERRED_SECTION">Transferred section</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Outcome
            <select
              name="outcome"
              defaultValue={enrolment.outcome ?? ""}
              disabled={isEditing}
              className="rounded-[11px] border border-border bg-field px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">—</option>
              <option value="PROMOTED">Promoted</option>
              <option value="DETAINED">Detained</option>
              <option value="LEFT">Left</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Remarks
            <input
              name="remarks"
              type="text"
              defaultValue={enrolment.remarks ?? ""}
              disabled={isEditing}
              placeholder="Reason / note"
              className="w-40 rounded-[11px] border border-border bg-field px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={isEditing}
            className="rounded-[11px] bg-primary px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isEditing ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {transferring && (
        <form action={formAction} className="mt-2.5 flex flex-wrap items-center gap-2">
          {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
          <select
            name="sectionId"
            required
            disabled={isPending}
            defaultValue=""
            className="rounded-[11px] border border-border bg-field px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
          >
            <option value="" disabled>
              Select new section
            </option>
            {[...sectionsForYear].sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b))).map((s) => (
              <option key={s.id} value={s.id}>
                {sectionLabel(s)}
              </option>
            ))}
          </select>
          <input
            name="rollNo"
            type="number"
            min={1}
            disabled={isPending}
            placeholder="Roll no. (auto if blank)"
            className="w-40 rounded-[11px] border border-border bg-field px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
          />
          <input
            name="remarks"
            type="text"
            disabled={isPending}
            placeholder="Reason (e.g. transfer, promotion)"
            className="w-52 rounded-[11px] border border-border bg-field px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[11px] bg-primary px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Moving…" : "Confirm"}
          </button>
        </form>
      )}
    </li>
  );
}
