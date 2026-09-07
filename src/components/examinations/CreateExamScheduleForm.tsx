"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createExamScheduleAction, type FormActionState } from "@/app/(dashboard)/admin/examinations/actions";

const initialState: FormActionState = {};

interface Offering {
  id: string;
  subjectName: string;
  teacherFirstName: string | null;
  teacherLastName: string | null;
}

// Rendered only once a section is picked via the GET filter above it on the
// page (subject offerings are scoped to one section -- GET /subject-offerings
// requires sectionId, see SubjectOfferingQueryDto), so `offerings` here is
// already the right list to choose a subject from.
export function CreateExamScheduleForm({ examId, offerings }: { examId: string; offerings: Offering[] }) {
  const [open, setOpen] = useState(false);
  const [hasPractical, setHasPractical] = useState(false);
  const [state, formAction, isPending] = useActionState(createExamScheduleAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  if (!open) {
    return (
      <button
        type="button"
        disabled={offerings.length === 0}
        onClick={() => setOpen(true)}
        className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={offerings.length === 0 ? "Pick a grade and section above first" : undefined}
      >
        + Add subject
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-3 flex w-full flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
    >
      <input type="hidden" name="examId" value={examId} />
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Subject *</span>
        <select
          name="subjectOfferingId"
          required
          disabled={isPending}
          defaultValue=""
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        >
          <option value="" disabled>
            Select
          </option>
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.subjectName}
              {o.teacherFirstName ? ` — ${o.teacherFirstName} ${o.teacherLastName ?? ""}`.trimEnd() : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Date</span>
          <input
            type="date"
            name="examDate"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Start time</span>
          <input
            type="time"
            name="startTime"
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
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Room</span>
          <input
            name="room"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Max marks *</span>
          <input
            type="number"
            min={0.01}
            step="0.01"
            name="maxMarks"
            required
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
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-text">
          <input
            type="checkbox"
            name="hasPractical"
            disabled={isPending}
            checked={hasPractical}
            onChange={(e) => setHasPractical(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Has practical
        </label>
        {hasPractical && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Practical max *</span>
            <input
              type="number"
              min={0}
              step="0.01"
              name="practicalMax"
              required={hasPractical}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
            />
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add to schedule"}
        </button>
      </div>
    </form>
  );
}
