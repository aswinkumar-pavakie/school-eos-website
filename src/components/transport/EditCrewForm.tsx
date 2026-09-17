"use client";

// Real crew reassignment -- folded into the bus detail page's own Crew card
// per explicit instruction (no separate "Bus Allocation" page anymore).
// PATCHes the same real vehicle_route_assignment row the old standalone
// Allocation page's AssignmentsPanel created in the first place.

import { useActionState, useEffect, useState } from "react";
import { updateAssignmentCrewAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { SelectField } from "./shared";

const initialState: FormActionState = {};

export function EditCrewForm({
  assignmentId,
  vehicleId,
  currentDriverId,
  currentAttendantId,
  drivers,
  attendants,
  action: actionOverride,
}: {
  assignmentId: string;
  vehicleId: string;
  currentDriverId: string | null;
  currentAttendantId: string | null;
  drivers: { id: string; fullName: string }[];
  attendants: { id: string; fullName: string }[];
  /** Defaults to Transport Manager's own action. Admin's route detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  action?: (assignmentId: string, vehicleId: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
}) {
  const [editing, setEditing] = useState(false);
  const action = (actionOverride ?? updateAssignmentCrewAction).bind(null, assignmentId, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute right-[18px] top-[18px] flex items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40"
      >
        <MaterialIcon name="edit" size={15} /> Edit crew
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
      {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Driver"
          name="driverId"
          disabled={isPending}
          defaultValue={currentDriverId ?? ""}
          options={[["", "None"], ...drivers.map((d): [string, string] => [d.id, d.fullName])]}
        />
        <SelectField
          label="Attendant"
          name="attendantId"
          disabled={isPending}
          defaultValue={currentAttendantId ?? ""}
          options={[["", "None"], ...attendants.map((a): [string, string] => [a.id, a.fullName])]}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className="rounded-[10px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="rounded-[10px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Saving…" : "Save crew"}
        </button>
      </div>
    </form>
  );
}
