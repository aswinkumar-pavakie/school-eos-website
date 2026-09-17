"use client";

// Real vehicle create -- `POST /vehicles` grants TRANSPORT_MANAGER alongside
// ADMIN (explicit product decision this session). Pixel-matched to the
// mockup's own "Add vehicle to register" popup (Transport Module.dc.html
// line 993's `vehicle` modal config: title/sub, 3-column field grid,
// Close/Save record footer) via the shared FormModal shell.
//
// The mockup's own field list for this modal bundles route + driver + crew
// fields into one flat form (boarding area, route length, departure time,
// term fee, driver, driver mobile, driver licence no, attendant) -- its own
// mock data model has no separate relational entities. This app's real
// schema keeps Vehicle/Route/Driver/crew-assignment genuinely separate, each
// already with its own real create/edit path built this session (Add route
// form, Edit crew on the bus detail page) -- so this modal only carries real
// vehicle-record fields, never a fabricated boarding-area/driver/term-fee
// input with nowhere real to send it. "Year" is real (year_of_manufacture)
// but lives on the separate spec endpoint, not vehicle creation itself, and
// `createVehicleAction` doesn't hand back the new vehicle's id for a chained
// follow-up call -- rather than fake a combined save, it's left for the
// vehicle's own detail page (Vehicle specification panel, already real)
// right after creation.

import { useActionState, useEffect, useState } from "react";
import { createVehicleAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

export function AddVehicleForm({ triggerClassName }: { triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        + Add vehicle
      </button>
    );
  }

  return (
    <FormModal title="Add vehicle to register" subtitle="Transport office · new fleet record" onClose={() => setOpen(false)}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <ModalField label="Registration no" name="registrationNo" required disabled={isPending} />
        <ModalField label="Make & model" name="model" disabled={isPending} />
        <ModalField label="Seating capacity" name="capacity" type="number" required disabled={isPending} />
        <ModalSelect
          label="Ownership"
          name="ownership"
          disabled={isPending}
          options={[
            ["", "Not set"],
            ["OWNED", "Owned"],
            ["HIRED", "Hired"],
            ["LEASED", "Leased"],
          ]}
        />
        <ModalSelect
          label="Status"
          name="operationalStatus"
          disabled={isPending}
          defaultValue="ACTIVE"
          options={[
            ["ACTIVE", "Active"],
            ["MAINTENANCE", "Maintenance"],
            ["GROUNDED", "Grounded"],
          ]}
        />
        <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Save record" />
      </form>
    </FormModal>
  );
}
