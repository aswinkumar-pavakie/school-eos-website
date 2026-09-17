"use client";

// Real route create -- `POST /routes` grants TRANSPORT_MANAGER alongside
// ADMIN (explicit product decision this session). Same modal shell as
// AddVehicleForm. The mockup's own "route" form config (Transport
// Module.dc.html line 1013) is actually its "Route details" edit popup, not
// a distinct create flow, and mixes in fields with no real backing on
// CreateRouteDto (boarding area, departure time, term fee, bus assignment --
// those belong to a route's stops/assignment, not the route record itself,
// and already have their own real forms elsewhere) -- so this uses the
// mockup's 3-column chrome with only the real route-record fields.

import { useActionState, useEffect, useState } from "react";
import { createRouteAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

export function AddRouteForm({ triggerClassName }: { triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createRouteAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        + Add route
      </button>
    );
  }

  return (
    <FormModal title="Add route to service" subtitle="Transport office · new route record" onClose={() => setOpen(false)}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <ModalField label="Name" name="name" required disabled={isPending} />
        <ModalField label="Code" name="code" disabled={isPending} />
        <ModalField label="Distance (km)" name="distanceKm" type="number" disabled={isPending} />
        <ModalSelect
          label="Direction"
          name="direction"
          disabled={isPending}
          defaultValue="BOTH"
          options={[
            ["PICKUP", "Pickup"],
            ["DROP", "Drop"],
            ["BOTH", "Both"],
          ]}
        />
        <ModalSelect
          label="Status"
          name="status"
          disabled={isPending}
          defaultValue="ACTIVE"
          options={[
            ["ACTIVE", "Active"],
            ["INACTIVE", "Inactive"],
          ]}
        />
        <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Save route" />
      </form>
    </FormModal>
  );
}
