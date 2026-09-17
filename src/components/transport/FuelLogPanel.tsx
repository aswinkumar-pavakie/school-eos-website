"use client";

// Fuel & mileage log -- real operational recording on the new
// vehicle_fuel_log table (see query.md). Create-only, same reasoning as
// VehicleMaintenancePanel's own "no delete" note -- a logged fill-up is a
// real transaction. Mileage (km/litre) is computed client-side from real
// distance-since-last-fill (needs a real odometer reading on both this entry
// and the previous one) rather than stored -- never shown when either
// reading is missing.

import { useActionState, useState } from "react";
import { createFuelLogAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { formatMoneyDetail } from "@/lib/format";
import { Field, PanelCreateForm } from "./shared";

export interface FuelLogEntry {
  id: string;
  filledOn: string;
  litres: string;
  costPaise: string;
  odometerKm: number | null;
}

const initialState: FormActionState = {};

function mileageKmPerLitre(entries: FuelLogEntry[]): number | null {
  const withOdometer = entries.filter((e) => e.odometerKm !== null).sort((a, b) => (a.filledOn < b.filledOn ? -1 : 1));
  if (withOdometer.length < 2) return null;
  const first = withOdometer[0];
  const last = withOdometer[withOdometer.length - 1];
  const distanceKm = last.odometerKm! - first.odometerKm!;
  const totalLitres = withOdometer.slice(1).reduce((sum, e) => sum + Number(e.litres), 0);
  if (distanceKm <= 0 || totalLitres <= 0) return null;
  return distanceKm / totalLitres;
}

export function FuelLogPanel({ vehicleId, entries }: { vehicleId: string; entries: FuelLogEntry[] }) {
  const [adding, setAdding] = useState(false);
  const action = createFuelLogAction.bind(null, vehicleId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const mileage = mileageKmPerLitre(entries);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{mileage !== null ? `avg ${mileage.toFixed(1)} km/L` : "not enough odometer readings yet"}</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Add entry
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="Log a fill-up" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Log">
          <Field label="Filled on" name="filledOn" type="date" required disabled={isPending} />
          <Field label="Litres" name="litres" type="number" required disabled={isPending} />
          <Field label="Cost (₹)" name="costRupees" type="number" required disabled={isPending} />
          <Field label="Odometer (km, optional)" name="odometerKm" type="number" disabled={isPending} />
        </PanelCreateForm>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Date</th>
              <th className="py-2.5 pr-3">Litres</th>
              <th className="py-2.5 pr-3">Rate</th>
              <th className="py-2.5 pr-3">Odometer</th>
              <th className="py-2.5 text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  No fill-ups logged yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="py-3 pr-3 text-text">{e.filledOn}</td>
                <td className="py-3 pr-3 font-mono text-text-muted">{e.litres} L</td>
                <td className="py-3 pr-3 font-mono text-text-muted">
                  {formatMoneyDetail(String(Math.round(Number(e.costPaise) / Number(e.litres))))} /L
                </td>
                <td className="py-3 pr-3 font-mono text-text-muted">{e.odometerKm != null ? `${e.odometerKm} km` : "—"}</td>
                <td className="py-3 text-right font-mono text-text">{formatMoneyDetail(e.costPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
