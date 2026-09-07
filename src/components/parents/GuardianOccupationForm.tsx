"use client";

// Inline occupation edit for one guardian_link -- occupation is modelled per
// child-relationship, not on the parent's own person row, so it's edited here
// rather than as a single field on the parent profile.

import { useActionState, useState } from "react";
import { updateGuardianOccupationAction, type FormActionState } from "@/app/(dashboard)/admin/parents/actions";

const initialState: FormActionState = {};

export function GuardianOccupationForm({
  guardianLinkId,
  personId,
  occupation,
}: {
  guardianLinkId: string;
  personId: string;
  occupation: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const action = updateGuardianOccupationAction.bind(null, guardianLinkId, personId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[12px] font-semibold text-text-muted hover:text-primary"
      >
        {occupation ?? "Add occupation"}
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        formAction(formData);
        setEditing(false);
      }}
      className="flex items-center gap-1.5"
    >
      {state.error && <span className="text-[11px] text-critical-text">{state.error}</span>}
      <input
        name="occupation"
        defaultValue={occupation ?? ""}
        autoFocus
        disabled={isPending}
        placeholder="Occupation"
        className="w-32 rounded-[7px] border border-border bg-surface px-2 py-1 text-[12px] text-text outline-none focus:border-primary"
      />
      <button type="submit" disabled={isPending} className="text-[11px] font-bold text-primary disabled:opacity-60">
        Save
      </button>
    </form>
  );
}
