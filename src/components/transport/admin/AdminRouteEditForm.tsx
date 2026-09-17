"use client";

// Real route master-record edit -- name/code/direction/distance/status.
// PATCH /routes/:id already grants ADMIN (updateRouteAction, previously only
// reachable from the old Routes tab this page replaces). No mockup screen to
// pixel-match against (the reference design never shows this popup open) --
// styled to match every other Admin real-write modal here (FormModal shell).

import { useActionState, useEffect, useState } from "react";
import { updateRouteDetailAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "@/components/transport/FormModal";

const initialState: FormActionState = {};

export function AdminRouteEditForm({
  routeId,
  name,
  code,
  direction,
  distanceKm,
  status,
  triggerClassName,
}: {
  routeId: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
  triggerClassName: string;
}) {
  const [editing, setEditing] = useState(false);
  const action = updateRouteDetailAction.bind(null, routeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className={triggerClassName}>
        Edit route
      </button>
    );
  }

  return (
    <FormModal title="Edit route" subtitle="route register" onClose={() => setEditing(false)} maxWidthPx={720}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <ModalField label="Route name" name="name" disabled={isPending} defaultValue={name} />
        <ModalField label="Code" name="code" disabled={isPending} defaultValue={code ?? undefined} />
        <ModalSelect
          label="Direction"
          name="direction"
          disabled={isPending}
          defaultValue={direction}
          options={[
            ["BOTH", "Both"],
            ["PICKUP", "Pickup"],
            ["DROP", "Drop"],
          ]}
        />
        <ModalField label="Distance (km)" name="distanceKm" type="number" disabled={isPending} defaultValue={distanceKm ?? undefined} />
        <ModalSelect
          label="Status"
          name="status"
          disabled={isPending}
          defaultValue={status}
          options={[
            ["ACTIVE", "Active"],
            ["INACTIVE", "Inactive"],
          ]}
        />
        <ModalFooter onClose={() => setEditing(false)} isPending={isPending} submitLabel="Save changes" />
      </form>
    </FormModal>
  );
}
