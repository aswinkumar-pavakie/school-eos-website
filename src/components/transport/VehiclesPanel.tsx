"use client";

import { useActionState, useState } from "react";
import { createVehicleAction, updateVehicleAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Vehicle {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
}

export interface VehicleAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const initialState: FormActionState = {};

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "GROUNDED" || status === "RETIRED") return "critical";
  return "pending";
}

const STATUS_OPTIONS: [string, string][] = [
  ["ACTIVE", "Active"],
  ["MAINTENANCE", "Maintenance"],
  ["GROUNDED", "Grounded"],
  ["RETIRED", "Retired"],
];

/** A truly-open row (effectiveTo null) is always the real current one when there
 * is one; only fall back to "most recently started" when every candidate already
 * has an end date -- mirrors DriversPanel's currentAssignmentFor. */
function currentAssignmentForVehicle(
  assignments: VehicleAssignment[],
  vehicleId: string,
): VehicleAssignment | null {
  const forVehicle = assignments.filter((a) => a.vehicleId === vehicleId);
  if (forVehicle.length === 0) return null;
  const openEnded = forVehicle.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : forVehicle;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

export function VehiclesPanel({
  vehicles,
  assignments,
  routeNameById,
  driverNameById,
}: {
  vehicles: Vehicle[];
  assignments: VehicleAssignment[];
  routeNameById: Map<string, string>;
  driverNameById: Map<string, string>;
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter ? vehicles.filter((v) => v.operationalStatus === statusFilter) : vehicles;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{vehicles.length} vehicles</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New vehicle
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="New vehicle" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Registration no." name="registrationNo" required disabled={isPending} placeholder="TN-01-AB-1234" />
          <Field label="Model" name="model" disabled={isPending} />
          <Field label="Capacity" name="capacity" type="number" required disabled={isPending} />
          <SelectField
            label="Ownership"
            name="ownership"
            disabled={isPending}
            options={[
              ["", "Select"],
              ["OWNED", "Owned"],
              ["HIRED", "Hired"],
              ["LEASED", "Leased"],
            ]}
          />
        </PanelCreateForm>
      )}

      <div className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No vehicles match this filter.</li>}
        {filtered.map((vehicle) => {
          const assignment = currentAssignmentForVehicle(assignments, vehicle.id);
          return (
            <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              routeName={assignment ? (routeNameById.get(assignment.routeId) ?? null) : null}
              driverName={assignment?.driverId ? (driverNameById.get(assignment.driverId) ?? null) : null}
              editing={editingId === vehicle.id}
              onToggle={() => setEditingId((v) => (v === vehicle.id ? null : vehicle.id))}
            />
          );
        })}
      </ul>
    </div>
  );
}

function VehicleRow({
  vehicle,
  routeName,
  driverName,
  editing,
  onToggle,
}: {
  vehicle: Vehicle;
  routeName: string | null;
  driverName: string | null;
  editing: boolean;
  onToggle: () => void;
}) {
  const action = updateVehicleAction.bind(null, vehicle.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text font-mono">{vehicle.registrationNo}</p>
          <p className="text-xs text-text-muted">
            {vehicle.model ?? "—"} · {vehicle.capacity} seats{vehicle.ownership ? ` · ${vehicle.ownership.toLowerCase()}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {routeName ? (
              <>
                Route: <span className="font-semibold text-text">{routeName}</span>
                {driverName && (
                  <>
                    {" "}
                    · Driver: <span className="font-semibold text-text">{driverName}</span>
                  </>
                )}
              </>
            ) : (
              "No route currently assigned"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={tone(vehicle.operationalStatus)} label={vehicle.operationalStatus} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Registration no." name="registrationNo" disabled={isPending} defaultValue={vehicle.registrationNo} />
            <Field label="Model" name="model" disabled={isPending} defaultValue={vehicle.model ?? undefined} />
            <Field label="Capacity" name="capacity" type="number" disabled={isPending} defaultValue={vehicle.capacity} />
            <SelectField
              label="Operational status"
              name="operationalStatus"
              disabled={isPending}
              defaultValue={vehicle.operationalStatus}
              options={[
                ["ACTIVE", "Active"],
                ["MAINTENANCE", "Maintenance"],
                ["GROUNDED", "Grounded"],
                ["RETIRED", "Retired"],
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
