"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProposalAction, type FormActionState } from "@/app/(dashboard)/community/proposals/actions";

const initialState: FormActionState = {};

export function CreateProposalForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProposalAction, initialState);
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
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        + New proposal
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex w-full flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Title *</span>
        <input
          name="title"
          required
          disabled={isPending}
          placeholder="e.g. Annual Sports Day fundraiser"
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Description *</span>
        <textarea
          name="description"
          required
          disabled={isPending}
          rows={4}
          placeholder="What is being proposed, and why"
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

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
          {isPending ? "Submitting…" : "Submit proposal"}
        </button>
      </div>
    </form>
  );
}
