"use client";

import { useActionState, useState } from "react";
import {
  changeDriverVehicleAction,
  createDriverAction,
  updateDriverAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/transport/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  status: string;
}

export interface DriverVehicle {
  id: string;
  registrationNo: string;
  model: string | null;
}

export interface DriverVehicleAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/** `currentOnly` on the backend is `effective_to IS NULL OR effective_to >= today`,
 * which — for one day right after a change — can match both the just-ended
 * assignment and its replacement (the end date is inclusive there, but exclusive
 * in the DB's own overlap check), sometimes with the exact same effectiveFrom too
 * (two changes made the same day). A truly-open row (effectiveTo null) is always
 * the real current one when there is one; only fall back to "most recently
 * started" when every candidate already has an end date. */
function currentAssignmentFor(
  assignments: DriverVehicleAssignment[],
  driverId: string,
): DriverVehicleAssignment | null {
  const forDriver = assignments.filter((a) => a.driverId === driverId);
  if (forDriver.length === 0) return null;
  const openEnded = forDriver.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : forDriver;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

const initialState: FormActionState = {};

export function DriversPanel({
  drivers,
  vehicles,
  assignments,
}: {
  drivers: Driver[];
  vehicles: DriverVehicle[];
  assignments: DriverVehicleAssignment[];
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createDriverAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{drivers.length} drivers</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New driver
          </button>
        )}
      </div>
      {adding && (
        <PanelCreateForm title="New driver" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Full name" name="fullName" required disabled={isPending} />
          <Field label="Phone" name="phone" disabled={isPending} />
          <Field label="Licence no." name="licenceNo" required disabled={isPending} />
          <Field label="Licence expiry" name="licenceExpiry" type="date" required disabled={isPending} />
        </PanelCreateForm>
      )}
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {drivers.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No drivers yet.</li>}
        {drivers.map((driver) => {
          const assignment = currentAssignmentFor(assignments, driver.id);
          return (
          <DriverRow
            key={driver.id}
            driver={driver}
            assignment={assignment}
            vehicle={assignment ? vehicleById.get(assignment.vehicleId) ?? null : null}
            vehicles={vehicles}
            editing={editingId === driver.id}
            onToggle={() => setEditingId((v) => (v === driver.id ? null : driver.id))}
          />
          );
        })}
      </ul>
    </div>
  );
}

function DriverRow({
  driver,
  assignment,
  vehicle,
  vehicles,
  editing,
  onToggle,
}: {
  driver: Driver;
  assignment: DriverVehicleAssignment | null;
  vehicle: DriverVehicle | null;
  vehicles: DriverVehicle[];
  editing: boolean;
  onToggle: () => void;
}) {
  const action = updateDriverAction.bind(null, driver.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [changingVehicle, setChangingVehicle] = useState(false);
  const vehicleAction = assignment
    ? changeDriverVehicleAction.bind(null, assignment.id, assignment.routeId, driver.id, assignment.attendantId)
    : null;
  const [vehicleState, vehicleFormAction, isChangingVehicle] = useActionState(
    vehicleAction ?? (async (s: FormActionState) => s),
    initialState,
  );

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">{driver.fullName}</p>
          <p className="text-xs text-text-muted">
            {driver.phone ?? "—"} · licence {driver.licenceNo}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {vehicle ? (
              <>
                Driving <span className="font-semibold text-text">{vehicle.registrationNo}</span>
                {vehicle.model ? ` (${vehicle.model})` : ""}
              </>
            ) : (
              "No vehicle currently assigned"
            )}
            {assignment && (
              <button
                type="button"
                onClick={() => setChangingVehicle((v) => !v)}
                className="ml-2 font-semibold text-primary"
              >
                {changingVehicle ? "Cancel" : "Change vehicle"}
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={driver.status === "ACTIVE" ? "success" : "pending"} label={driver.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {changingVehicle && assignment && (
        <form
          action={(formData) => {
            vehicleFormAction(formData);
            setChangingVehicle(false);
          }}
          className="mt-2.5 flex flex-wrap items-center gap-2.5 rounded-[11px] bg-field p-3"
        >
          {vehicleState.error && <span className="w-full text-xs text-critical-text">{vehicleState.error}</span>}
          <select
            name="vehicleId"
            required
            disabled={isChangingVehicle}
            defaultValue=""
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNo}
                {v.model ? ` (${v.model})` : ""}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isChangingVehicle}
            className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isChangingVehicle ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Full name" name="fullName" disabled={isPending} defaultValue={driver.fullName} />
            <Field label="Phone" name="phone" disabled={isPending} defaultValue={driver.phone ?? undefined} />
            <Field label="Licence no." name="licenceNo" disabled={isPending} defaultValue={driver.licenceNo} />
            <Field label="Licence expiry" name="licenceExpiry" type="date" disabled={isPending} defaultValue={driver.licenceExpiry.slice(0, 10)} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={driver.status}
              options={[
                ["ACTIVE", "Active"],
                ["INACTIVE", "Inactive"],
              ]}
            />
          </div>
          <button type="submit" disabled={isPending} className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
