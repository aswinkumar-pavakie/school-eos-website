"use client";

// Route detail's "Assigned students" list -- the missing link between Vehicle ->
// Route -> Driver (already covered by the Transport tabs) and Student -> Route ->
// Stop -> Vehicle, which Transport needs to actually know who is riding.

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  addStudentTransportAllocationAction,
  cancelStudentTransportAllocationAction,
  changeStudentTransportStopAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/transport/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { StudentPersonPicker } from "@/components/parents/StudentPersonPicker";
import { formatDate } from "@/lib/format";

export interface RouteStopOption {
  id: string;
  stopName: string;
  sequenceNo: number;
}

export interface AssignedStudent {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  routeStopId: string;
  stopName: string;
  direction: string;
  feeSlab: string | null;
  validFrom: string;
  status: string;
}

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

const initialState: FormActionState = {};

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export function RouteAssignedStudents({
  routeId,
  academicYearId,
  stops,
  students,
}: {
  routeId: string;
  academicYearId?: string;
  stops: RouteStopOption[];
  students: AssignedStudent[];
}) {
  const [adding, setAdding] = useState(false);
  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{students.length} assigned</p>
        {!adding && academicYearId && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add student
          </button>
        )}
      </div>

      {!academicYearId && (
        <p className="mt-2 text-xs text-text-muted">
          Set a current academic year first (Academics → Academic years) before assigning students.
        </p>
      )}

      {adding && academicYearId && (
        <AddStudentForm
          routeId={routeId}
          academicYearId={academicYearId}
          stops={sortedStops}
          onDone={() => setAdding(false)}
        />
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {students.length === 0 && (
          <li className="py-6 text-center text-sm text-text-muted">No students assigned to this route yet.</li>
        )}
        {students.map((s) => (
          <AssignedStudentRow key={s.id} routeId={routeId} student={s} stops={sortedStops} />
        ))}
      </ul>
    </div>
  );
}

function AddStudentForm({
  routeId,
  academicYearId,
  stops,
  onDone,
}: {
  routeId: string;
  academicYearId: string;
  stops: RouteStopOption[];
  onDone: () => void;
}) {
  const [student, setStudent] = useState<StudentHit | null>(null);
  const action = addStudentTransportAllocationAction.bind(null, routeId, student?.id ?? "", academicYearId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={(formData) => {
        formAction(formData);
        onDone();
      }}
      className="mt-3 flex flex-col gap-3 rounded-[11px] bg-field p-3.5"
    >
      {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
      <StudentPersonPicker disabled={isPending} onSelect={setStudent} />
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Stop *</span>
          <select
            name="routeStopId"
            required
            disabled={isPending}
            defaultValue=""
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          >
            <option value="" disabled>
              Select
            </option>
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequenceNo}. {s.stopName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Direction *</span>
          <select
            name="direction"
            required
            disabled={isPending}
            defaultValue="BOTH"
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          >
            <option value="BOTH">Both</option>
            <option value="PICKUP">Pickup</option>
            <option value="DROP">Drop</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Fee slab</span>
          <input
            name="feeSlab"
            disabled={isPending}
            placeholder="e.g. STANDARD"
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !student}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add student"}
        </button>
      </div>
    </form>
  );
}

function AssignedStudentRow({
  routeId,
  student,
  stops,
}: {
  routeId: string;
  student: AssignedStudent;
  stops: RouteStopOption[];
}) {
  const [changingStop, setChangingStop] = useState(false);
  const changeAction = changeStudentTransportStopAction.bind(null, routeId, student.id);
  const [changeState, changeFormAction, isChanging] = useActionState(changeAction, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {student.studentFirstName} {student.studentLastName ?? ""}
          </p>
          <p className="text-xs text-text-muted">
            {student.admissionNo} · Stop: {student.stopName} · {student.direction.toLowerCase()}
            {student.feeSlab ? ` · ${student.feeSlab}` : ""}
          </p>
          <p className="text-xs text-text-muted">Since {formatDate(student.validFrom)}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={tone(student.status)} label={student.status} />
          <Link href={`/admin/students/${student.studentId}`} className="text-[13px] font-semibold text-primary">
            View student
          </Link>
          {student.status === "ACTIVE" && (
            <>
              <button
                type="button"
                onClick={() => setChangingStop((v) => !v)}
                className="text-[13px] font-semibold text-primary"
              >
                {changingStop ? "Cancel" : "Change stop"}
              </button>
              <button
                type="button"
                onClick={() => cancelStudentTransportAllocationAction(routeId, student.id)}
                className="text-[13px] font-semibold text-critical-text"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {changingStop && (
        <form action={changeFormAction} className="mt-2.5 flex items-center gap-2">
          {changeState.error && <span className="text-xs text-critical-text">{changeState.error}</span>}
          <select
            name="routeStopId"
            required
            disabled={isChanging}
            defaultValue={student.routeStopId}
            className="rounded-[11px] border border-border bg-field px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
          >
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequenceNo}. {s.stopName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isChanging}
            className="rounded-[11px] bg-primary px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isChanging ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </li>
  );
}
