"use client";

import { useActionState, useState } from "react";
import { createAssignmentAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Assignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const initialState: FormActionState = {};

export function AssignmentsPanel({
  assignments,
  vehicles,
  routes,
  drivers,
  attendants,
}: {
  assignments: Assignment[];
  vehicles: { id: string; registrationNo: string }[];
  routes: { id: string; name: string }[];
  drivers: { id: string; fullName: string }[];
  attendants: { id: string; fullName: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createAssignmentAction, initialState);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");

  const vehicleLabel = (id: string) => vehicles.find((v) => v.id === id)?.registrationNo ?? id;
  const routeLabel = (id: string) => routes.find((r) => r.id === id)?.name ?? id;
  const personLabel = (list: { id: string; fullName: string }[], id: string | null) =>
    id ? (list.find((p) => p.id === id)?.fullName ?? id) : "—";
  const isCurrent = (a: Assignment) => !a.effectiveTo || new Date(a.effectiveTo) >= new Date();

  const filtered = assignments
    .filter((a) => !vehicleFilter || a.vehicleId === vehicleFilter)
    .filter((a) => !routeFilter || a.routeId === routeFilter);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{assignments.length} assignments</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New assignment
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="New assignment" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <SelectField label="Vehicle" name="vehicleId" required disabled={isPending} options={[["", "Select"], ...vehicles.map((v): [string, string] => [v.id, v.registrationNo])]} />
          <SelectField label="Route" name="routeId" required disabled={isPending} options={[["", "Select"], ...routes.map((r): [string, string] => [r.id, r.name])]} />
          <SelectField label="Driver" name="driverId" disabled={isPending} options={[["", "None"], ...drivers.map((d): [string, string] => [d.id, d.fullName])]} />
          <SelectField label="Attendant" name="attendantId" disabled={isPending} options={[["", "None"], ...attendants.map((a): [string, string] => [a.id, a.fullName])]} />
          <Field label="Effective from" name="effectiveFrom" type="date" required disabled={isPending} />
        </PanelCreateForm>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by vehicle</span>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by route</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Vehicle</th>
              <th className="py-2.5 pr-3">Route</th>
              <th className="py-2.5 pr-3">Driver</th>
              <th className="py-2.5 pr-3">Attendant</th>
              <th className="py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  No assignments match this filter.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="py-3 pr-3 font-semibold text-text">{vehicleLabel(a.vehicleId)}</td>
                <td className="py-3 pr-3 text-text">{routeLabel(a.routeId)}</td>
                <td className="py-3 pr-3 text-text-muted">{personLabel(drivers, a.driverId)}</td>
                <td className="py-3 pr-3 text-text-muted">{personLabel(attendants, a.attendantId)}</td>
                <td className="py-3 text-text-muted">{isCurrent(a) ? "Active" : "Ended"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
