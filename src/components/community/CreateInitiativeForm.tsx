"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createInitiativeAction, type FormActionState } from "@/app/(dashboard)/community/activities/actions";

const initialState: FormActionState = {};

interface ApprovedProposal {
  id: string;
  title: string;
}

export function CreateInitiativeForm({ approvedProposals }: { approvedProposals: ApprovedProposal[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createInitiativeAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  if (!open) {
    return (
      <button
        type="button"
        disabled={approvedProposals.length === 0}
        onClick={() => setOpen(true)}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={approvedProposals.length === 0 ? "No approved proposals available to initialize yet" : undefined}
      >
        + Initialize activity
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
        <span className="font-semibold text-text">Approved proposal *</span>
        <select
          name="proposalId"
          required
          disabled={isPending}
          defaultValue=""
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        >
          <option value="" disabled>
            Select
          </option>
          {approvedProposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Planned date</span>
        <input
          type="date"
          name="plannedDate"
          disabled={isPending}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Venue</span>
        <input
          name="venue"
          disabled={isPending}
          placeholder="e.g. School auditorium"
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
          {isPending ? "Initializing…" : "Initialize"}
        </button>
      </div>
    </form>
  );
}
