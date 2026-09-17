// Maintenance -- real, fleet-wide top-level page, matching the SIS Transport
// mockup's own nav item literally (Transport Module.dc.html's own NAV array:
// "Operations: Maintenance, Compliance") rather than my earlier assumption
// that this data only belonged inside each bus's own detail page. Same real
// vehicle_maintenance data as that page's own Maintenance history panel,
// aggregated fleet-wide here instead of per-vehicle. Read + log (real,
// TRANSPORT_MANAGER already has create access) -- reuses the exact same
// endpoint/action as the bus detail page's own panel, just with a vehicle
// picker added since this page isn't scoped to one bus.

import Link from "next/link";
import { LogServiceButton, EditServiceEntryButton } from "@/components/transport/MaintenanceEntryModal";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoneyDetail } from "@/lib/format";

interface Vehicle {
  id: string;
  registrationNo: string;
  currentOdometerKm?: number | null;
  nextServiceDueKm?: number | null;
}
interface MaintenanceRow {
  id: string;
  maintenanceType: string;
  performedOn: string;
  odometerKm: number | null;
  costPaise: string | null;
  vendor: string | null;
  notes: string | null;
}
interface ServiceDueRow {
  vehicleId: string;
  currentOdometerKm: number | null;
  nextServiceDueKm: number | null;
}

export default async function TransportManagerMaintenancePage() {
  const [vehiclesRes, serviceDueRes] = await Promise.all([apiFetch("/vehicles"), apiFetch("/vehicles/service-due")]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Maintenance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const vehicles: Vehicle[] = (await vehiclesRes.json()).data;
  const serviceDue: ServiceDueRow[] = serviceDueRes.ok ? (await serviceDueRes.json()).data : [];
  const serviceDueById = new Map(serviceDue.map((s) => [s.vehicleId, s]));

  const perVehicle = await Promise.all(
    vehicles.map(async (v) => {
      const res = await apiFetch(`/vehicles/${v.id}/maintenance`);
      const records: MaintenanceRow[] = res.ok ? (await res.json()).data : [];
      return { vehicle: v, records };
    }),
  );

  const allWorkOrders = perVehicle
    .flatMap((p) => p.records.map((r) => ({ ...r, vehicle: p.vehicle })))
    .sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1));

  const dueForService = vehicles.filter((v) => {
    const s = serviceDueById.get(v.id);
    return s?.currentOdometerKm != null && s?.nextServiceDueKm != null && s.currentOdometerKm >= s.nextServiceDueKm;
  });
  const totalSpend = allWorkOrders.reduce((sum, r) => sum + (r.costPaise ? Number(r.costPaise) : 0), 0);

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Maintenance</h1>
      <p className="mt-1.5 text-[15px] text-text-muted">Service history and upcoming work.</p>

      <div className="mt-5 grid grid-cols-1 gap-[14px] sm:grid-cols-3">
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Due for service</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{dueForService.length}</p>
          <p className="mt-2 text-[13px] text-text-muted">
            {serviceDue.length > 0 ? "by real odometer readings" : "not tracked yet — see query.md"}
          </p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Work orders logged</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{allWorkOrders.length}</p>
          <p className="mt-2 text-[13px] text-text-muted">across {vehicles.length} buses</p>
        </div>
        <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Total spend</p>
          <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{formatMoneyDetail(String(totalSpend))}</p>
          <p className="mt-2 text-[13px] text-text-muted">all logged work</p>
        </div>
      </div>

      {/* Two-column layout -- mockup's own "isMaint" screen puts the service
          & repair log beside the service-due list rather than stacking them
          full-width. "+ Log service" and each row's Edit pencil now open the
          real "Service entry" popup (MaintenanceEntryModal.tsx) -- same real
          POST/PATCH /vehicle-maintenance endpoints the per-vehicle panel
          uses, with a real Bus picker since this page isn't scoped to one
          vehicle. No delete action: DELETE isn't exposed on this table at
          all (matches this schema's own established convention for the Fuel
          log -- a logged service is a real transaction, not something to
          quietly remove). */}
      <div className="mt-5 grid grid-cols-1 gap-[14px] lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold leading-[22px] text-text">Service &amp; repair log</h2>
            <LogServiceButton vehicles={vehicles.map((v) => ({ id: v.id, registrationNo: v.registrationNo }))} />
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 pr-3">Bus</th>
                  <th className="py-2.5 pr-3">Work carried out</th>
                  <th className="py-2.5 pr-3">Garage</th>
                  <th className="py-2.5 pr-3 text-right">Cost</th>
                  <th className="py-2.5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allWorkOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-text-muted">
                      No maintenance logged yet.
                    </td>
                  </tr>
                )}
                {allWorkOrders.slice(0, 30).map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3 text-text-muted">{formatDate(r.performedOn)}</td>
                    <td className="py-3 pr-3">
                      <Link href={`/transport-manager/buses/${r.vehicle.id}`} className="font-mono font-semibold text-primary">
                        {r.vehicle.registrationNo}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-text">{r.notes ?? r.maintenanceType.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="py-3 pr-3 text-text-muted">{r.vendor ?? "—"}</td>
                    <td className="py-3 pr-3 text-right font-mono text-text">{r.costPaise ? formatMoneyDetail(r.costPaise) : "—"}</td>
                    <td className="py-3 pl-3 text-right">
                      <EditServiceEntryButton
                        record={{
                          id: r.id,
                          vehicleId: r.vehicle.id,
                          vehicleRegNo: r.vehicle.registrationNo,
                          maintenanceType: r.maintenanceType,
                          performedOn: r.performedOn,
                          odometerKm: r.odometerKm,
                          costPaise: r.costPaise,
                          vendor: r.vendor,
                          notes: r.notes,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Service due</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {dueForService.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No bus is over its next-service reading.</li>}
            {dueForService.map((v) => {
              const s = serviceDueById.get(v.id)!;
              return (
                <li key={v.id} className="card-hover flex flex-col gap-1 rounded-[10px] px-2 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[14px] font-semibold text-text">{v.registrationNo}</p>
                    <Link href={`/transport-manager/buses/${v.id}`} className="text-[12.5px] font-semibold text-primary">
                      + Log service →
                    </Link>
                  </div>
                  <p className="text-xs text-text-muted">
                    Next service at {s.nextServiceDueKm!.toLocaleString("en-IN")} km · currently {s.currentOdometerKm!.toLocaleString("en-IN")} km
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
