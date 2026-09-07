"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateExamScheduleAction, type FormActionState } from "@/app/(dashboard)/admin/examinations/actions";
import { formatDate } from "@/lib/format";

const initialState: FormActionState = {};

export interface ScheduleRow {
  id: string;
  examId: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  examDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  room: string | null;
  maxMarks: string;
  passMarks: string | null;
  hasPractical: boolean;
  practicalMax: string | null;
  internalMax: string | null;
}

export function ExamScheduleRow({ row, locked }: { row: ScheduleRow; locked: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(updateExamScheduleAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setEditing(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  const teacherName = row.teacherFirstName ? `${row.teacherFirstName} ${row.teacherLastName ?? ""}`.trim() : "—";

  if (!editing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-3 text-text">
          {row.gradeName} {row.sectionName}
        </td>
        <td className="px-4 py-3 text-text">{row.subjectName}</td>
        <td className="px-4 py-3 text-text-muted">{teacherName}</td>
        <td className="px-4 py-3 text-text-muted">{row.examDate ? formatDate(row.examDate) : "—"}</td>
        <td className="px-4 py-3 text-text-muted">
          {row.startTime ?? "—"}
          {row.durationMinutes ? ` · ${row.durationMinutes}m` : ""}
        </td>
        <td className="px-4 py-3 text-text-muted">{row.room ?? "—"}</td>
        <td className="px-4 py-3 text-text">
          {row.maxMarks}
          {row.passMarks ? ` (pass ${row.passMarks})` : ""}
        </td>
        <td className="px-4 py-3">
          {!locked && (
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-primary">
              Edit
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border bg-field/40 last:border-0">
      <td colSpan={8} className="px-4 py-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="examId" value={row.examId} />
          {state.error && (
            <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
          )}
          <p className="text-xs font-semibold text-text-muted">
            {row.gradeName} {row.sectionName} · {row.subjectName}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Date</span>
              <input
                type="date"
                name="examDate"
                defaultValue={row.examDate ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Start time</span>
              <input
                type="time"
                name="startTime"
                defaultValue={row.startTime ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Duration (min)</span>
              <input
                type="number"
                min={1}
                name="durationMinutes"
                defaultValue={row.durationMinutes ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Room</span>
              <input
                name="room"
                defaultValue={row.room ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Max marks</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                name="maxMarks"
                defaultValue={row.maxMarks}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Pass marks</span>
              <input
                type="number"
                min={0}
                step="0.01"
                name="passMarks"
                defaultValue={row.passMarks ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-text">
              <input
                type="checkbox"
                name="hasPractical"
                defaultChecked={row.hasPractical}
                disabled={isPending}
                className="h-4 w-4 rounded border-border"
              />
              Has practical
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Practical max</span>
              <input
                type="number"
                min={0}
                step="0.01"
                name="practicalMax"
                defaultValue={row.practicalMax ?? ""}
                disabled={isPending}
                className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
