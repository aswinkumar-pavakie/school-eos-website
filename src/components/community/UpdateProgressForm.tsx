"use client";

import { useActionState } from "react";
import { updateProgressAction } from "@/app/(dashboard)/community/activities/actions";
import type { FormActionState } from "@/app/(dashboard)/community/activities/actions";

const initialState: FormActionState = {};

export function UpdateProgressForm({ id, progressNotes }: { id: string; progressNotes: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProgressAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]">
      <input type="hidden" name="id" value={id} />
      <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Progress</h2>
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">What&apos;s the current progress?</span>
        <textarea
          name="progressNotes"
          required
          disabled={isPending}
          rows={3}
          defaultValue={progressNotes ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save progress"}
      </button>
    </form>
  );
}
