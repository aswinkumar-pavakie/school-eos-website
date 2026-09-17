"use client";

// Real student-allocation edit -- `PATCH /student-transport-allocations/:id`
// now grants TRANSPORT_MANAGER alongside ADMIN (explicit product decision
// this session). Moves a student already on this route to a different real
// stop on it, or changes direction/fee slab -- no student picker needed
// (unlike create, which does -- see transport-manager/actions.ts's own
// comment on why that one isn't wired yet).

import { useActionState, useEffect, useState } from "react";
import { updateStudentAllocationAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { SelectField, Field } from "./shared";

const initialState: FormActionState = {};

export function StudentAllocationMoveForm({
  allocationId,
  routeId,
  currentRouteStopId,
  currentDirection,
  stops,
}: {
  allocationId: string;
  routeId: string;
  currentRouteStopId: string;
  currentDirection: string;
  stops: { id: string; stopName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const action = updateStudentAllocationAction.bind(null, allocationId, routeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} title="Edit this student's stop/direction" className="shrink-0" style={{ color: "#334155" }}>
        <MaterialIcon name="edit" size={16} />
      </button>
    );
  }

  return (
    <div className="col-span-full mt-2 w-full rounded-[10px] bg-field p-3" onClick={(e) => e.stopPropagation()}>
      {state.error && <p className="mb-2 rounded-[8px] bg-critical-bg px-2 py-1 text-[12px] text-critical-text">{state.error}</p>}
      <form action={formAction} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectField
            label="Stop"
            name="routeStopId"
            disabled={isPending}
            defaultValue={currentRouteStopId}
            options={stops.map((s): [string, string] => [s.id, s.stopName])}
          />
          <SelectField
            label="Direction"
            name="direction"
            disabled={isPending}
            defaultValue={currentDirection}
            options={[
              ["PICKUP", "Pickup"],
              ["DROP", "Drop"],
              ["BOTH", "Both"],
            ]}
          />
        </div>
        <Field label="Fee slab (optional)" name="feeSlab" disabled={isPending} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-[8px] border border-border px-2.5 py-1.5 text-[12px] font-bold text-text hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="rounded-[8px] bg-primary px-2.5 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
