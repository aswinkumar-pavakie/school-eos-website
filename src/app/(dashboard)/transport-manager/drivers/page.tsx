// Drivers -- Transport Manager's read-only view of driver master data
// (DriversPanel's own readOnly prop). "Change vehicle" (the one write here)
// lives on the Bus Allocation page instead, via AssignmentsPanel.

import { DriversPanel } from "@/components/transport/DriversPanel";
import type { Driver, DriverVehicle, DriverVehicleAssignment } from "@/components/transport/DriversPanel";
import { apiFetch } from "@/lib/api";

export default async function TransportManagerDriversPage() {
  const [driversRes, vehiclesRes, assignmentsRes] = await Promise.all([
    apiFetch("/drivers"),
    apiFetch("/vehicles"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!driversRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Drivers</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: drivers }: { data: Driver[] } = await driversRes.json();
  const { data: vehicles }: { data: DriverVehicle[] } = vehiclesRes.ok ? await vehiclesRes.json() : { data: [] };
  const { data: assignments }: { data: DriverVehicleAssignment[] } = assignmentsRes.ok
    ? await assignmentsRes.json()
    : { data: [] };

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Drivers</h1>
      <p className="mt-1 text-sm text-text-muted">Driver roster — view only. Assign a bus from Bus Allocation.</p>
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <DriversPanel drivers={drivers} vehicles={vehicles} assignments={assignments} readOnly />
      </div>
    </div>
  );
}
