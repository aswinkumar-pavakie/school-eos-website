"use client";

// "Stops & students" -- reference design's own inline-per-stop breakdown
// (screenshot 7/8: one block per stop, serial badge + stop name + real
// pickup time + real board count, then a real student mini-card grid),
// unlike Transport Manager's own flat "Assigned students" list. Same real
// student_transport_allocation data as RouteAssignedStudents.tsx (the same
// /routes/:id/assigned-students the route detail page already fetches), just
// grouped by stop for this layout instead of rendered as one list. No "roll
// no." shown -- GET /routes/:id/assigned-students has no rollNumber column
// on this endpoint (checked directly), so admission no. is shown instead of a
// fabricated roll number.

import { useActionState, useState } from "react";
import {
  addStudentTransportAllocationAction,
  cancelStudentTransportAllocationAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/transport/actions";
import { StudentPersonPicker } from "@/components/parents/StudentPersonPicker";

export interface RouteStopOption {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
export interface AssignedStudent {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName?: string | null;
  sectionName?: string | null;
  routeStopId: string;
  stopName: string;
  direction: string;
  status: string;
}
interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

const initialState: FormActionState = {};

function initialsOf(first: string, last: string | null): string {
  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function StopsAndStudentsCard({
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
  const active = students.filter((s) => s.status === "ACTIVE");
  // Each real rider has TWO allocation rows here (PICKUP + DROP, a different
  // stop per direction) -- correct to keep per-row for the per-stop grouping
  // below, but the header count needs distinct students, not rows.
  const riderCount = new Set(active.map((s) => s.studentId)).size;
  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const byStop = new Map<string, AssignedStudent[]>();
  for (const s of active) {
    byStop.set(s.routeStopId, [...(byStop.get(s.routeStopId) ?? []), s]);
  }

  return (
    <section className="rounded-[16px] border border-border bg-surface p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Stops &amp; students</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            {riderCount} students across {sortedStops.length} stops
          </p>
        </div>
        {!adding && academicYearId && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add student
          </button>
        )}
      </div>

      {adding && academicYearId && (
        <AddStudentForm routeId={routeId} academicYearId={academicYearId} stops={sortedStops} onDone={() => setAdding(false)} />
      )}

      <div className="mt-4 flex flex-col gap-5">
        {sortedStops.map((stop, i) => {
          const boarders = byStop.get(stop.id) ?? [];
          return (
            <div key={stop.id}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                  style={{ background: "#EFF4FF", border: "1px solid #C7D7F5", color: "#1D4ED8" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[14px] font-bold text-text">{stop.stopName}</p>
              </div>
              <p className="ml-8 mt-0.5 text-[12.5px] text-text-muted">
                {stop.scheduledTime ? `pickup ${stop.scheduledTime} · ` : ""}
                {boarders.length} students board here
              </p>
              {boarders.length > 0 && (
                <div className="ml-8 mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {boarders.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-[10px] bg-field px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-primary"
                          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
                        >
                          {initialsOf(s.studentFirstName, s.studentLastName)}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-text">
                            {s.studentFirstName} {s.studentLastName ?? ""}
                          </p>
                          <p className="text-[11.5px] text-text-muted">
                            {s.gradeName ? `${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""} · ` : ""}
                            {s.admissionNo}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelStudentTransportAllocationAction(routeId, s.id)}
                        className="shrink-0 text-[11.5px] font-semibold text-critical-text"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
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
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
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
