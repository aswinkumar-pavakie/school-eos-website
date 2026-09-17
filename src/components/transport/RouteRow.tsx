"use client";

// One row of the Routes dense grid -- real Edit access (PATCH /routes/:id
// grants TRANSPORT_MANAGER alongside ADMIN), a real "Request deactivation"
// (no hard delete exists for a route), and now a real "Assign bus" --
// POST/PATCH /vehicle-route-assignments already grants TRANSPORT_MANAGER
// create+update (the one write this role was always meant to perform, see
// vehicle-route-assignments.controller.ts's own comment) -- this is the same
// real write as EditRouteForm.tsx on the bus detail page, just initiated
// from the route's own side instead of the bus's. Pulled into its own Client
// Component because the row itself is a clickable <Link> through to the
// assigned bus (matching the mockup's own row-level onOpen) -- every toggle
// here needs to stop that click from navigating, and each open form needs to
// render as its own full-width block below the grid row, not squeezed into
// one grid cell.

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  updateRouteDetailsAction,
  requestRouteDeactivateAction,
  assignBusToRouteAction,
  type FormActionState,
} from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { Field, SelectField } from "./shared";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

interface Person {
  id: string;
  fullName: string;
}
interface VehicleOption {
  id: string;
  registrationNo: string;
}

export function RouteRow({
  routeId,
  serial,
  routeLabel,
  firstStopName,
  stopsCount,
  distanceKm,
  pickupWindow,
  vehicleRegNo,
  driverName,
  riders,
  href,
  gridTemplate,
  currentName,
  currentCode,
  currentDirection,
  currentDistanceKm,
  currentStatus,
  currentAssignmentId,
  currentVehicleId,
  currentDriverId,
  currentAttendantId,
  vehicles,
  drivers,
  attendants,
}: {
  routeId: string;
  serial: number;
  routeLabel: string;
  firstStopName: string;
  stopsCount: number;
  distanceKm: string | null;
  pickupWindow: string | null;
  vehicleRegNo: string | null;
  driverName: string | null;
  riders: number;
  href: string | null;
  gridTemplate: string;
  currentName: string;
  currentCode: string | null;
  currentDistanceKm: string | null;
  currentDirection: string;
  currentStatus: string;
  /** Real vehicle_route_assignment context for this route, if any -- null
   * when no bus currently serves this route. */
  currentAssignmentId: string | null;
  currentVehicleId: string | null;
  currentDriverId: string | null;
  currentAttendantId: string | null;
  vehicles: VehicleOption[];
  drivers: Person[];
  attendants: Person[];
}) {
  const [editing, setEditing] = useState(false);
  const action = updateRouteDetailsAction.bind(null, routeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [deactivating, setDeactivating] = useState(false);
  const [deactivated, setDeactivated] = useState(false);
  const deactivateAction = requestRouteDeactivateAction.bind(null, routeId);
  const [deactivateState, deactivateFormAction, isDeactivatePending] = useActionState(deactivateAction, initialState);

  const [assigning, setAssigning] = useState(false);
  const assignAction = assignBusToRouteAction.bind(null, routeId, currentAssignmentId);
  const [assignState, assignFormAction, isAssignPending] = useActionState(assignAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  useEffect(() => {
    if (!isDeactivatePending && !deactivateState.error && deactivateState !== initialState) {
      setDeactivating(false);
      setDeactivated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deactivateState, isDeactivatePending]);

  useEffect(() => {
    if (!isAssignPending && !assignState.error && assignState !== initialState) setAssigning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignState, isAssignPending]);

  const anyOpen = editing || deactivating || assigning;
  // Exact hover spec from the mockup's own row markup: a -3px lift, a light
  // blue fill, a real 1px blue outline (not border -- outline doesn't affect
  // layout/siblings the way a border would), a rounded corner even though
  // idle rows are flush/square, and a shadow -- not just a background tint.
  const rowClassName =
    "grid items-center gap-3 px-5 py-4 text-[14px] rounded-[12px] outline outline-1 outline-transparent -outline-offset-1 transition-[transform,outline-color,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:outline-primary hover:shadow-[0_10px_22px_rgba(29,78,216,0.14)] hover:z-[2] relative";
  const rowStyle = { gridTemplateColumns: gridTemplate, borderBottom: anyOpen ? "none" : "1px solid #F1F5F9" };

  const rowContent = (
    <>
      <div className="flex items-center gap-2.5 font-bold text-text">
        <span
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-primary"
          style={{ border: "1px solid #C7D7F5" }}
        >
          {serial}
        </span>
        <span className="truncate">{routeLabel}</span>
      </div>
      <div className="font-semibold leading-[21px] text-text">
        {firstStopName || "—"} → School campus
      </div>
      <div style={{ color: "#475569" }}>{stopsCount}</div>
      <div style={{ color: "#475569" }}>{distanceKm ?? "—"} km</div>
      <div className="font-mono text-[12px]" style={{ color: "#475569" }}>
        {pickupWindow ?? "—"}
      </div>
      <div className="font-bold text-text" title="No term-fee column exists in this schema yet">
        Not tracked
      </div>
      <div className="flex flex-col items-start gap-1" style={{ color: "#475569" }}>
        {vehicleRegNo ? (
          <span className="leading-[21px]">
            <span className="font-mono text-[12px]">{vehicleRegNo}</span> {driverName ? `· ${driverName}` : ""}
          </span>
        ) : (
          <span>—</span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setAssigning((v) => !v);
          }}
          title={vehicleRegNo ? "Reassign bus" : "Assign bus"}
          className="shrink-0 text-[11.5px] font-bold text-primary hover:underline"
        >
          {vehicleRegNo ? "Reassign" : "Assign bus"}
        </button>
      </div>
      <div className="text-right font-bold text-text">{riders}</div>
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setEditing((v) => !v);
          }}
          title="Edit this route's own details"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-white"
          style={{ border: "1px solid #E2E8F0", color: "#334155" }}
        >
          <MaterialIcon name="edit" size={17} />
        </button>
        {deactivated ? (
          <span
            className="flex h-8 items-center justify-center rounded-[8px] px-2 text-[11px] font-semibold"
            style={{ background: "#EFF4FF", color: "#1E3A8A" }}
          >
            Requested
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setDeactivating((v) => !v);
            }}
            title="Request deactivation"
            className="flex h-8 w-8 items-center justify-center rounded-[8px]"
            style={{ border: "1px solid #C7D7F5", color: "#1E3A8A" }}
          >
            <MaterialIcon name="delete" size={17} />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div>
      {href && !anyOpen ? (
        <Link href={href} className={rowClassName} style={rowStyle}>
          {rowContent}
        </Link>
      ) : (
        <div className={rowClassName} style={rowStyle}>
          {rowContent}
        </div>
      )}

      {assigning && (
        <form
          action={assignFormAction}
          className="flex flex-col gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}
        >
          <p className="text-[13px] font-bold text-text">{vehicleRegNo ? "Reassign bus" : "Assign bus"}</p>
          {assignState.error && <p className="rounded-[9px] bg-critical-bg px-2.5 py-1.5 text-[12.5px] text-critical-text">{assignState.error}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SelectField
              label="Bus"
              name="vehicleId"
              required
              disabled={isAssignPending}
              defaultValue={currentVehicleId ?? ""}
              options={[["", "Select a bus"], ...vehicles.map((v): [string, string] => [v.id, v.registrationNo])]}
            />
            <SelectField
              label="Driver"
              name="driverId"
              disabled={isAssignPending}
              defaultValue={currentDriverId ?? ""}
              options={[["", "None"], ...drivers.map((d): [string, string] => [d.id, d.fullName])]}
            />
            <SelectField
              label="Attendant"
              name="attendantId"
              disabled={isAssignPending}
              defaultValue={currentAttendantId ?? ""}
              options={[["", "None"], ...attendants.map((a): [string, string] => [a.id, a.fullName])]}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAssigning(false)} className="rounded-[9px] border border-border px-3 py-1.5 text-[12.5px] font-bold text-text hover:bg-surface">
              Cancel
            </button>
            <button type="submit" disabled={isAssignPending} className="rounded-[9px] bg-primary px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60">
              {isAssignPending ? "Saving…" : "Save assignment"}
            </button>
          </div>
        </form>
      )}

      {deactivating && (
        <div className="flex flex-col gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
          <div>
            <p className="text-[13px] font-bold text-text">Request deactivation</p>
            <p className="mt-0.5 text-[12.5px] text-text-muted">No hard delete exists for a route in this app -- this requests deactivating it. Nothing changes until Admin approves.</p>
          </div>
          {deactivateState.error && <p className="rounded-[9px] bg-critical-bg px-2.5 py-1.5 text-[12.5px] text-critical-text">{deactivateState.error}</p>}
          <form action={deactivateFormAction} className="flex items-end gap-2.5">
            <div className="max-w-xs flex-1">
              <Field label="Reason (optional)" name="reason" disabled={isDeactivatePending} />
            </div>
            <button type="button" onClick={() => setDeactivating(false)} className="rounded-[9px] border border-border px-3 py-2 text-[13px] font-bold text-text hover:bg-surface">
              Cancel
            </button>
            <button type="submit" disabled={isDeactivatePending} className="rounded-[9px] px-3 py-2 text-[13px] font-bold text-white disabled:opacity-60" style={{ background: "#1E3A8A" }}>
              {isDeactivatePending ? "Submitting…" : "Request"}
            </button>
          </form>
        </div>
      )}

      {editing && (
        <FormModal title="Route details" subtitle="name, direction, distance and status" onClose={() => setEditing(false)}>
          {state.error && (
            <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
              {state.error}
            </p>
          )}
          <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <ModalField label="Name" name="name" disabled={isPending} defaultValue={currentName} />
            <ModalField label="Code" name="code" disabled={isPending} defaultValue={currentCode ?? undefined} />
            <ModalField label="Distance (km)" name="distanceKm" type="number" disabled={isPending} defaultValue={currentDistanceKm ?? undefined} />
            <ModalSelect
              label="Direction"
              name="direction"
              disabled={isPending}
              defaultValue={currentDirection}
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
              defaultValue={currentStatus}
              options={[
                ["ACTIVE", "Active"],
                ["INACTIVE", "Inactive"],
              ]}
            />
            <ModalFooter onClose={() => setEditing(false)} isPending={isPending} submitLabel="Save route" />
          </form>
        </FormModal>
      )}
    </div>
  );
}
