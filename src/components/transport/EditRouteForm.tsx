"use client";

// Real route reassignment -- folded into the bus detail page's own Route &
// stop timings card. routeId isn't patchable on an existing assignment (see
// updateAssignmentRouteAction's own comment), so this closes today's
// assignment and opens a new one -- both real calls against the same real
// vehicle-route-assignments endpoint Transport Manager already has write
// access to.

import { useActionState, useEffect, useState } from "react";
import { updateAssignmentRouteAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { SelectField } from "./shared";

const initialState: FormActionState = {};

export function EditRouteForm({
  assignmentId,
  vehicleId,
  currentRouteId,
  currentDriverId,
  currentAttendantId,
  routes,
}: {
  assignmentId: string;
  vehicleId: string;
  currentRouteId: string;
  currentDriverId: string | null;
  currentAttendantId: string | null;
  routes: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const action = updateAssignmentRouteAction.bind(null, assignmentId, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40">
        <MaterialIcon name="edit" size={15} /> Edit route
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex w-full flex-col gap-3 rounded-[11px] bg-field p-3.5">
      <p className="text-xs text-text-muted">Changing the route ends today&apos;s assignment and starts a new one from today, keeping the same crew.</p>
      {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
      <SelectField label="Route" name="routeId" required disabled={isPending} defaultValue={currentRouteId} options={routes.map((r): [string, string] => [r.id, r.name])} />
      <input type="hidden" name="driverId" value={currentDriverId ?? ""} />
      <input type="hidden" name="attendantId" value={currentAttendantId ?? ""} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className="rounded-[10px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="rounded-[10px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Saving…" : "Save route"}
        </button>
      </div>
    </form>
  );
}
