"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createRouteAction, createRouteStopAction, updateRouteAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface RouteStop {
  id: string;
  routeId: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}

export interface Route {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
  stops: RouteStop[];
}

export interface RouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/** Mirrors VehiclesPanel's currentAssignmentForVehicle, just keyed by route
 * instead of vehicle. */
function currentAssignmentForRoute(assignments: RouteAssignment[], routeId: string): RouteAssignment | null {
  const forRoute = assignments.filter((a) => a.routeId === routeId);
  if (forRoute.length === 0) return null;
  const openEnded = forRoute.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : forRoute;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

const initialState: FormActionState = {};

export function RoutesPanel({
  routes,
  assignments,
  vehicleRegNoById,
}: {
  routes: Route[];
  assignments: RouteAssignment[];
  vehicleRegNoById: Map<string, string>;
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createRouteAction, initialState);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{routes.length} routes</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New route
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="New route" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Name" name="name" required disabled={isPending} placeholder="Route 12" />
          <Field label="Code" name="code" disabled={isPending} />
          <SelectField
            label="Direction"
            name="direction"
            disabled={isPending}
            options={[
              ["BOTH", "Both"],
              ["PICKUP", "Pickup"],
              ["DROP", "Drop"],
            ]}
          />
          <Field label="Distance (km)" name="distanceKm" type="number" disabled={isPending} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {routes.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No routes yet.</li>}
        {routes.map((route) => {
          const assignment = currentAssignmentForRoute(assignments, route.id);
          return (
            <RouteRow
              key={route.id}
              route={route}
              vehicleRegNo={assignment ? (vehicleRegNoById.get(assignment.vehicleId) ?? null) : null}
              expanded={expandedId === route.id}
              onToggleExpand={() => setExpandedId((v) => (v === route.id ? null : route.id))}
              editing={editingId === route.id}
              onToggleEdit={() => setEditingId((v) => (v === route.id ? null : route.id))}
            />
          );
        })}
      </ul>
    </div>
  );
}

function RouteRow({
  route,
  vehicleRegNo,
  expanded,
  onToggleExpand,
  editing,
  onToggleEdit,
}: {
  route: Route;
  vehicleRegNo: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  const action = updateRouteAction.bind(null, route.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const stopAction = createRouteStopAction.bind(null, route.id);
  const [stopState, stopFormAction, isAddingStop] = useActionState(stopAction, initialState);
  const [addingStop, setAddingStop] = useState(false);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {route.name} {route.code && <span className="font-mono text-text-muted">· {route.code}</span>}
          </p>
          <p className="text-xs text-text-muted">
            {route.direction.toLowerCase()}
            {route.distanceKm ? ` · ${route.distanceKm} km` : ""} · {route.stops.length} stops
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {vehicleRegNo ? (
              <>
                Vehicle: <span className="font-semibold text-text">{vehicleRegNo}</span>
              </>
            ) : (
              "No vehicle currently assigned"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={route.status === "ACTIVE" ? "success" : "pending"} label={route.status} />
          <Link href={`/admin/transport/routes/${route.id}`} className="text-[13px] font-semibold text-primary">
            View route
          </Link>
          <button type="button" onClick={onToggleExpand} className="text-[13px] font-semibold text-primary">
            {expanded ? "Hide stops" : "Stops"}
          </button>
          <button type="button" onClick={onToggleEdit} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" name="name" disabled={isPending} defaultValue={route.name} />
            <Field label="Code" name="code" disabled={isPending} defaultValue={route.code ?? undefined} />
            <SelectField
              label="Direction"
              name="direction"
              disabled={isPending}
              defaultValue={route.direction}
              options={[
                ["BOTH", "Both"],
                ["PICKUP", "Pickup"],
                ["DROP", "Drop"],
              ]}
            />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={route.status}
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

      {expanded && (
        <div className="mt-2.5 rounded-[11px] bg-field p-3">
          <ul className="flex flex-col divide-y divide-border">
            {route.stops.length === 0 && <li className="py-2 text-sm text-text-muted">No stops yet.</li>}
            {[...route.stops]
              .sort((a, b) => a.sequenceNo - b.sequenceNo)
              .map((stop) => (
                <li key={stop.id} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-text">
                    {stop.sequenceNo}. {stop.stopName}
                  </span>
                  {stop.scheduledTime && <span className="text-text-muted">{stop.scheduledTime}</span>}
                </li>
              ))}
          </ul>
          {!addingStop ? (
            <button type="button" onClick={() => setAddingStop(true)} className="mt-2 text-[13px] font-semibold text-primary">
              + Add stop
            </button>
          ) : (
            <form action={stopFormAction} className="mt-2 flex flex-wrap items-end gap-2">
              {stopState.error && <span className="w-full text-xs text-critical-text">{stopState.error}</span>}
              <Field label="Stop name" name="stopName" required disabled={isAddingStop} />
              <Field label="Sequence" name="sequenceNo" type="number" required disabled={isAddingStop} />
              <button type="submit" disabled={isAddingStop} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
                {isAddingStop ? "Adding…" : "Add"}
              </button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
