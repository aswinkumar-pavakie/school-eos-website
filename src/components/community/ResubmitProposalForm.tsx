"use client";

import { useActionState } from "react";
import { resubmitProposalAction, type FormActionState } from "@/app/(dashboard)/community/proposals/actions";

const initialState: FormActionState = {};

export function ResubmitProposalForm({ id, title, description }: { id: string; title: string; description: string }) {
  const [state, formAction, isPending] = useActionState(resubmitProposalAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-[18px]">
      <input type="hidden" name="id" value={id} />
      <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Revise and resubmit</h2>
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Title</span>
        <input
          name="title"
          required
          disabled={isPending}
          defaultValue={title}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Description</span>
        <textarea
          name="description"
          required
          disabled={isPending}
          rows={4}
          defaultValue={description}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Resubmitting…" : "Resubmit"}
      </button>
    </form>
  );
}
