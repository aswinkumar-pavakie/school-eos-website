// Buses -- Transport Manager's read-only view of the same real vehicle master
// data Admin's own Transport > Vehicles tab shows (VehiclesPanel already has a
// readOnly prop built for exactly this). No create/edit here -- vehicle master
// data stays Admin-only (see VehiclesPanel's own readOnly doc comment).

import { VehiclesPanel } from "@/components/transport/VehiclesPanel";
import type { Vehicle, VehicleAssignment } from "@/components/transport/VehiclesPanel";
import type { Driver } from "@/components/transport/DriversPanel";
import type { Route } from "@/components/transport/RoutesPanel";
import { apiFetch } from "@/lib/api";

export default async function TransportManagerBusesPage() {
  const [vehiclesRes, routesRes, driversRes, assignmentsRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/drivers"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Buses</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicles }: { data: Vehicle[] } = await vehiclesRes.json();
  const { data: routes }: { data: Route[] } = routesRes.ok ? await routesRes.json() : { data: [] };
  const { data: drivers }: { data: Driver[] } = driversRes.ok ? await driversRes.json() : { data: [] };
  const { data: assignments }: { data: VehicleAssignment[] } = assignmentsRes.ok
    ? await assignmentsRes.json()
    : { data: [] };

  const routeNameById = new Map(routes.map((r) => [r.id, r.code ? `${r.name} (${r.code})` : r.name]));
  const driverNameById = new Map(drivers.map((d) => [d.id, d.fullName]));

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Buses</h1>
      <p className="mt-1 text-sm text-text-muted">Fleet status — view only.</p>
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <VehiclesPanel vehicles={vehicles} assignments={assignments} routeNameById={routeNameById} driverNameById={driverNameById} readOnly />
      </div>
    </div>
  );
}
