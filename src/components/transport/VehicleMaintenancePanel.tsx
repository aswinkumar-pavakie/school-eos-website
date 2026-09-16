"use client";

// Vehicle maintenance log -- Transport Manager's new real operational access
// (list/create/update) on the existing vehicle_maintenance table. This is the
// simple per-vehicle log (type/performed date/odometer/cost/vendor/notes), a
// distinct, separate thing from the generic Repair & Maintenance module
// (Inventory/asset workflow) -- see this repo's own query.md notes on that
// still-open design question. No delete action: DELETE isn't exposed on this
// table at all (create/update only, matching the real backend surface).

import { useActionState, useState } from "react";
import {
  createVehicleMaintenanceAction,
  updateVehicleMaintenanceAction,
  type FormActionState,
} from "@/app/(dashboard)/transport-manager/actions";
import { formatMoneyDetail } from "@/lib/format";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface VehicleMaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceType: string;
  performedOn: string;
  odometerKm: number | null;
  costPaise: string | null;
  vendor: string | null;
  notes: string | null;
}

const TYPE_OPTIONS: [string, string][] = [
  ["SERVICE", "Service"],
  ["REPAIR", "Repair"],
  ["TYRE", "Tyre"],
  ["BATTERY", "Battery"],
  ["BODY", "Body work"],
  ["OTHER", "Other"],
];

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS);

const initialState: FormActionState = {};

type CreateAction = typeof createVehicleMaintenanceAction;
type UpdateAction = typeof updateVehicleMaintenanceAction;

export function VehicleMaintenancePanel({
  vehicleId,
  records,
  createAction = createVehicleMaintenanceAction,
  updateAction = updateVehicleMaintenanceAction,
}: {
  vehicleId: string;
  records: VehicleMaintenanceRecord[];
  /** Defaults to Transport Manager's own action. Admin's vehicle detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  createAction?: CreateAction;
  updateAction?: UpdateAction;
}) {
  const [adding, setAdding] = useState(false);
  const action = createAction.bind(null, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{records.length} record(s)</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add entry
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="Log vehicle maintenance"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Log"
        >
          <SelectField label="Type" name="maintenanceType" required disabled={isPending} options={TYPE_OPTIONS} />
          <Field label="Performed on" name="performedOn" type="date" required disabled={isPending} />
          <Field label="Odometer (km, optional)" name="odometerKm" type="number" disabled={isPending} />
          <Field label="Cost (₹, optional)" name="costRupees" type="number" disabled={isPending} />
          <Field label="Vendor (optional)" name="vendor" disabled={isPending} />
          <Field label="Notes (optional)" name="notes" disabled={isPending} />
        </PanelCreateForm>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Type</th>
              <th className="py-2.5 pr-3">Date</th>
              <th className="py-2.5 pr-3">Odometer</th>
              <th className="py-2.5 pr-3">Cost</th>
              <th className="py-2.5 pr-3">Vendor</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text-muted">
                  No maintenance logged yet.
                </td>
              </tr>
            )}
            {records.map((record) => (
              <MaintenanceRow
                key={record.id}
                vehicleId={vehicleId}
                record={record}
                editing={editingId === record.id}
                onToggle={() => setEditingId((v) => (v === record.id ? null : record.id))}
                updateAction={updateAction}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaintenanceRow({
  vehicleId,
  record,
  editing,
  onToggle,
  updateAction,
}: {
  vehicleId: string;
  record: VehicleMaintenanceRecord;
  editing: boolean;
  onToggle: () => void;
  updateAction: UpdateAction;
}) {
  const action = updateAction.bind(null, vehicleId, record.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{TYPE_LABEL[record.maintenanceType] ?? record.maintenanceType}</td>
        <td className="py-3 pr-3 text-text-muted">{record.performedOn}</td>
        <td className="py-3 pr-3 text-text-muted">{record.odometerKm != null ? `${record.odometerKm} km` : "—"}</td>
        <td className="py-3 pr-3 text-text-muted">{record.costPaise ? formatMoneyDetail(record.costPaise) : "—"}</td>
        <td className="py-3 pr-3 text-text-muted">{record.vendor ?? "—"}</td>
        <td className="py-3 text-right">
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={6} className="pb-3">
            <form action={formAction} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
              {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
              <div className="grid grid-cols-2 gap-2.5">
                <SelectField
                  label="Type"
                  name="maintenanceType"
                  disabled={isPending}
                  defaultValue={record.maintenanceType}
                  options={TYPE_OPTIONS}
                />
                <Field label="Performed on" name="performedOn" type="date" disabled={isPending} defaultValue={record.performedOn} />
                <Field
                  label="Odometer (km)"
                  name="odometerKm"
                  type="number"
                  disabled={isPending}
                  defaultValue={record.odometerKm ?? undefined}
                />
                <Field
                  label="Cost (₹)"
                  name="costRupees"
                  type="number"
                  disabled={isPending}
                  defaultValue={record.costPaise ? Number(record.costPaise) / 100 : undefined}
                />
                <Field label="Vendor" name="vendor" disabled={isPending} defaultValue={record.vendor ?? undefined} />
                <Field label="Notes" name="notes" disabled={isPending} defaultValue={record.notes ?? undefined} />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
