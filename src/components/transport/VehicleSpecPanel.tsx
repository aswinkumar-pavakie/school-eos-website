"use client";

// Vehicle specification -- real fields on the new query.md spec columns
// (year/body/chassis/engine/wheelbase/tyre/fuel tank/RTO/parking bay/
// odometer/next-service-due). A SEPARATE write surface from the vehicle
// master record (registration no/model/capacity/ownership/status stay
// Admin-only, unchanged) -- see vehicles.controller.ts's own comment on why
// PATCH /vehicles/:id/spec exists at all. Every field shows "not recorded"
// (never a fabricated value) until it's actually been set.

import { useActionState, useState } from "react";
import { updateVehicleSpecAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { MaterialIcon } from "./MaterialIcon";
import { Field } from "./shared";

export interface VehicleSpec {
  yearOfManufacture: number | null;
  bodyType: string | null;
  chassisNo: string | null;
  engineNo: string | null;
  engineDesc: string | null;
  wheelbaseMm: number | null;
  tyreSize: string | null;
  tyreCount: number | null;
  fuelTankLitres: number | null;
  rtoOffice: string | null;
  parkingBay: string | null;
  currentOdometerKm: number | null;
  nextServiceDueKm: number | null;
}

const initialState: FormActionState = {};

function specRow(label: string, value: string | number | null): [string, string] {
  return [label, value === null || value === "" ? "—" : String(value)];
}

/** Pure, no-"use client"-needed field grid -- the exact same 15-field
 * read-only rendering VehicleSpecPanel's own non-editing view uses, pulled
 * out so Principal/Vice Principal's oversight pages (real read access to
 * every field here, but no edit endpoint at all) can render identical output
 * without importing a form tied to Transport Manager's own write action. */
export function VehicleSpecFields({
  model,
  spec,
  capacity,
  ownership,
  gpsLabel,
  lastServiceDate,
}: {
  model: string | null;
  spec: VehicleSpec | null;
  capacity: number;
  ownership: string | null;
  gpsLabel: string | null;
  lastServiceDate: string | null;
}) {
  const rows: [string, string][] = [
    specRow("Make & model", model),
    specRow("Body type", spec?.bodyType ?? null),
    specRow("Year of manufacture", spec?.yearOfManufacture ?? null),
    specRow("Seating capacity", capacity),
    specRow("Chassis no", spec?.chassisNo ?? null),
    specRow("Engine no", spec?.engineNo ?? null),
    specRow("Engine", spec?.engineDesc ?? null),
    specRow("Wheelbase", spec?.wheelbaseMm ? `${spec.wheelbaseMm} mm` : null),
    specRow("Tyre size / count", spec?.tyreSize ? `${spec.tyreSize}${spec.tyreCount ? ` · ${spec.tyreCount}` : ""}` : null),
    specRow("Fuel tank", spec?.fuelTankLitres ? `${spec.fuelTankLitres} L` : null),
    specRow("Ownership", ownership ? ownership.charAt(0) + ownership.slice(1).toLowerCase() : null),
    specRow("RTO", spec?.rtoOffice ?? null),
    specRow("GPS device", gpsLabel),
    specRow("Parking bay", spec?.parkingBay ?? null),
    specRow("Last service", lastServiceDate),
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-[22px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "#94A3B8" }}>
            {label}
          </span>
          <span className="text-[14px] font-semibold" style={{ color: "#1E293B" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VehicleSpecPanel({
  vehicleId,
  model,
  spec,
  capacity,
  ownership,
  gpsLabel,
  lastServiceDate,
  updateAction: updateActionOverride,
}: {
  vehicleId: string;
  /** Defaults to Transport Manager's own action. Admin's route detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  updateAction?: (vehicleId: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
  model: string | null;
  spec: VehicleSpec | null;
  /** Real vehicle-master fields (capacity/ownership) and real read-only
   * derived fields (GPS device status, latest maintenance date) shown
   * alongside the editable spec fields -- these three don't belong to this
   * endpoint's own PATCH surface (capacity/ownership edit via the vehicle
   * master record modal; GPS/last-service have no edit form at all, they're
   * sourced from other real tables), so they're display-only here, never
   * part of `rows`' own edit form below. No "Fuel & emission" field -- no
   * real fuel-type/emission-norm column exists anywhere on `vehicle`
   * (checked information_schema directly), so it's honestly omitted rather
   * than fabricated. */
  capacity: number;
  ownership: string | null;
  gpsLabel: string | null;
  lastServiceDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const action = (updateActionOverride ?? updateVehicleSpecAction).bind(null, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (editing) {
    return (
      <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
        {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Body type" name="bodyType" disabled={isPending} defaultValue={spec?.bodyType ?? undefined} />
          <Field label="Year of manufacture" name="yearOfManufacture" type="number" disabled={isPending} defaultValue={spec?.yearOfManufacture ?? undefined} />
          <Field label="Chassis no" name="chassisNo" disabled={isPending} defaultValue={spec?.chassisNo ?? undefined} />
          <Field label="Engine no" name="engineNo" disabled={isPending} defaultValue={spec?.engineNo ?? undefined} />
          <Field label="Engine" name="engineDesc" disabled={isPending} defaultValue={spec?.engineDesc ?? undefined} />
          <Field label="Wheelbase (mm)" name="wheelbaseMm" type="number" disabled={isPending} defaultValue={spec?.wheelbaseMm ?? undefined} />
          <Field label="Tyre size" name="tyreSize" disabled={isPending} defaultValue={spec?.tyreSize ?? undefined} />
          <Field label="Tyre count" name="tyreCount" type="number" disabled={isPending} defaultValue={spec?.tyreCount ?? undefined} />
          <Field label="Fuel tank (L)" name="fuelTankLitres" type="number" disabled={isPending} defaultValue={spec?.fuelTankLitres ?? undefined} />
          <Field label="RTO" name="rtoOffice" disabled={isPending} defaultValue={spec?.rtoOffice ?? undefined} />
          <Field label="Parking bay" name="parkingBay" disabled={isPending} defaultValue={spec?.parkingBay ?? undefined} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setEditing(true)} className="absolute right-[18px] top-[18px] flex items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40">
        <MaterialIcon name="edit" size={15} /> Edit
      </button>
      <VehicleSpecFields model={model} spec={spec} capacity={capacity} ownership={ownership} gpsLabel={gpsLabel} lastServiceDate={lastServiceDate} />
    </>
  );
}
