"use client";

// Real vehicle master-record edit -- `PATCH /vehicles/:id` now grants
// TRANSPORT_MANAGER alongside ADMIN (explicit product decision this
// session). Distinct from VehicleSpecPanel's own separate spec-fields
// endpoint -- this is registrationNo/model/capacity/ownership/status.
// Pixel-matched to the mockup's own "Edit bus record" popup (Transport
// Module.dc.html line 1005) via the shared FormModal shell -- its own field
// list (boarding area, driver, driver mobile, term fee) belongs to a route's
// stops/assignment/driver, not the vehicle record itself, and each already
// has its own real edit path elsewhere in this role, so only real
// vehicle-record fields appear here.

import { useActionState, useEffect, useState } from "react";
import { updateVehicleMasterAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

export function VehicleMasterEditForm({
  vehicleId,
  registrationNo,
  model,
  capacity,
  ownership,
  operationalStatus,
  action: actionOverride,
}: {
  vehicleId: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
  /** Defaults to Transport Manager's own action. Admin's route detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  action?: (vehicleId: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
}) {
  const [editing, setEditing] = useState(false);
  const action = (actionOverride ?? updateVehicleMasterAction).bind(null, vehicleId);
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
        className="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:border-primary/40"
      >
        Edit record
      </button>
    );
  }

  return (
    <FormModal title="Edit bus record" subtitle="transport register" onClose={() => setEditing(false)} maxWidthPx={760}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <ModalField label="Registration no" name="registrationNo" disabled={isPending} defaultValue={registrationNo} />
        <ModalField label="Make & model" name="model" disabled={isPending} defaultValue={model ?? undefined} />
        <ModalField label="Seating capacity" name="capacity" type="number" disabled={isPending} defaultValue={capacity} />
        <ModalSelect
          label="Ownership"
          name="ownership"
          disabled={isPending}
          defaultValue={ownership ?? ""}
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
          defaultValue={operationalStatus}
          options={[
            ["ACTIVE", "Active"],
            ["MAINTENANCE", "Maintenance"],
            ["GROUNDED", "Grounded"],
            ["RETIRED", "Retired"],
          ]}
        />
        <ModalFooter onClose={() => setEditing(false)} isPending={isPending} submitLabel="Save changes" />
      </form>
    </FormModal>
  );
}

export function VehicleDeleteTrigger({ onClick }: { onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-sm font-bold"
      style={{ border: "1px solid #C7D7F5", color: "#1E3A8A" }}
    >
      <MaterialIcon name="delete" size={17} /> Delete
    </button>
  );
}
