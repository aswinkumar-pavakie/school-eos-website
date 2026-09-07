"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateExamAction, type FormActionState } from "@/app/(dashboard)/admin/examinations/actions";

const initialState: FormActionState = {};

const EXAM_TYPES: [string, string][] = [
  ["UNIT_TEST", "Unit test"],
  ["MONTHLY", "Monthly"],
  ["QUARTERLY", "Quarterly"],
  ["HALF_YEARLY", "Half-yearly"],
  ["ANNUAL", "Annual"],
  ["MODEL", "Model"],
  ["REVISION", "Revision"],
  ["PRACTICAL", "Practical"],
  ["BOARD", "Board"],
];

interface GradeScale {
  id: string;
  name: string;
}

export function EditExamForm({
  exam,
  gradeScales,
}: {
  exam: { id: string; name: string; examType: string; term: string | null; gradeScaleId: string | null };
  gradeScales: GradeScale[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateExamAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-bg"
      >
        Edit
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex w-full flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
    >
      <input type="hidden" name="id" value={exam.id} />
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-text">Name *</span>
          <input
            name="name"
            required
            disabled={isPending}
            defaultValue={exam.name}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Type *</span>
          <select
            name="examType"
            required
            disabled={isPending}
            defaultValue={exam.examType}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            {EXAM_TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Term</span>
          <input
            name="term"
            disabled={isPending}
            defaultValue={exam.term ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Grade scale</span>
          <select
            name="gradeScaleId"
            disabled={isPending}
            defaultValue={exam.gradeScaleId ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
          >
            <option value="">None</option>
            {gradeScales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
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
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
