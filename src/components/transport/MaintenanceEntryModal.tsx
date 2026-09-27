"use client";

// Fleet-wide "Service entry" popup -- pixel-matched to the reference design's
// own modal (Bus/Date/Garage, then Work carried out/Odometer/Cost, Close/Save
// entry buttons), used both for "+ Log service" (create) and the row-level
// Edit pencil (update) on transport-manager/maintenance/page.tsx. Reuses the
// same real POST/PATCH /vehicle-maintenance endpoints the per-vehicle panel
// on the bus detail page already uses -- this is a second, fleet-wide entry
// point onto the exact same real data, not a parallel concept.
//
// The reference design's modal has no "Type" field, but the real backend DTO
// (CreateVehicleMaintenanceDto) requires `maintenanceType` as a non-nullable
// enum -- honestly kept as a real required field here (a compact 4th control)
// rather than silently defaulting every entry to one type, which would
// mislabel repairs as routine service.

import { useActionState, useEffect, useState } from "react";
import {
  createVehicleMaintenanceFleetAction,
  updateVehicleMaintenanceFleetAction,
  type FormActionState,
} from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const TYPE_OPTIONS: [string, string][] = [
  ["SERVICE", "Service"],
  ["REPAIR", "Repair"],
  ["TYRE", "Tyre"],
  ["BATTERY", "Battery"],
  ["BODY", "Body work"],
  ["OTHER", "Other"],
];

const initialState: FormActionState = {};

interface VehicleOption {
  id: string;
  registrationNo: string;
}

interface ExistingRecord {
  id: string;
  vehicleId: string;
  vehicleRegNo: string;
  maintenanceType: string;
  performedOn: string;
  odometerKm: number | null;
  costPaise: string | null;
  vendor: string | null;
  notes: string | null;
}

export function LogServiceButton({ vehicles }: { vehicles: VehicleOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createVehicleMaintenanceFleetAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[10px] bg-primary px-4 py-[11px] text-sm font-bold text-white hover:bg-primary-hover"
      >
        + Log service
      </button>
      {open && (
        <FormModal title="Service entry" subtitle="workshop / garage record" onClose={() => setOpen(false)} maxWidthPx={640}>
          {state.error && (
            <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
              {state.error}
            </p>
          )}
          <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ModalSelect
              label="Bus"
              name="vehicleId"
              disabled={isPending}
              options={[["", "Select a bus"], ...vehicles.map((v): [string, string] => [v.id, v.registrationNo])]}
            />
            <ModalField label="Date" name="performedOn" type="date" required disabled={isPending} />
            <ModalField label="Garage" name="vendor" disabled={isPending} />
            <div className="sm:col-span-2">
              <ModalField label="Work carried out" name="notes" disabled={isPending} />
            </div>
            <ModalSelect label="Type" name="maintenanceType" disabled={isPending} defaultValue="SERVICE" options={TYPE_OPTIONS} />
            <ModalField label="Odometer (km)" name="odometerKm" type="number" disabled={isPending} />
            <ModalField label="Cost (₹)" name="costRupees" type="number" disabled={isPending} />
            <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Save entry" />
          </form>
        </FormModal>
      )}
    </>
  );
}

export function EditServiceEntryButton({ record }: { record: ExistingRecord }) {
  const [open, setOpen] = useState(false);
  const action = updateVehicleMaintenanceFleetAction.bind(null, record.vehicleId, record.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit service entry"
        className="flex h-8 w-8 items-center justify-center rounded-[9px]"
        style={{ border: "1px solid #E2E8F0", color: "#334155" }}
      >
        <MaterialIcon name="edit" size={15} />
      </button>
      {open && (
        <FormModal title="Service entry" subtitle="workshop / garage record" onClose={() => setOpen(false)} maxWidthPx={640}>
          {state.error && (
            <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
              {state.error}
            </p>
          )}
          <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ModalField label="Bus" name="vehicleDisplay" disabled defaultValue={record.vehicleRegNo} />
            <ModalField label="Date" name="performedOn" type="date" required disabled={isPending} defaultValue={record.performedOn.slice(0, 10)} />
            <ModalField label="Garage" name="vendor" disabled={isPending} defaultValue={record.vendor ?? undefined} />
            <div className="sm:col-span-2">
              <ModalField label="Work carried out" name="notes" disabled={isPending} defaultValue={record.notes ?? undefined} />
            </div>
            <ModalSelect label="Type" name="maintenanceType" disabled={isPending} defaultValue={record.maintenanceType} options={TYPE_OPTIONS} />
            <ModalField label="Odometer (km)" name="odometerKm" type="number" disabled={isPending} defaultValue={record.odometerKm ?? undefined} />
            <ModalField
              label="Cost (₹)"
              name="costRupees"
              type="number"
              disabled={isPending}
              defaultValue={record.costPaise ? Number(record.costPaise) / 100 : undefined}
            />
            <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Save entry" />
          </form>
        </FormModal>
      )}
    </>
  );
}
