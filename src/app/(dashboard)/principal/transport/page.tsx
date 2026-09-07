// Principal -> Transport: read-only oversight of the same real fleet, routes
// and drivers Admin's own Transport tabs show -- no create/edit controls.
// Transport operational management (vehicles, routes, drivers, assignments)
// stays with Admin; Principal gets visibility, not the write actions.

import { PrincipalTransportTabs } from "@/components/transport/PrincipalTransportTabs";
import type { Vehicle } from "@/components/transport/VehiclesPanel";
import type { Route } from "@/components/transport/RoutesPanel";
import type { Driver, DriverVehicleAssignment } from "@/components/transport/DriversPanel";
import { apiFetch } from "@/lib/api";

export default async function PrincipalTransportPage() {
  const [vehiclesRes, routesRes, driversRes, driverAssignmentsRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/drivers"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Transport</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicles }: { data: Vehicle[] } = await vehiclesRes.json();
  const { data: routesRaw }: { data: Omit<Route, "stops">[] } = routesRes.ok ? await routesRes.json() : { data: [] };
  const { data: drivers }: { data: Driver[] } = driversRes.ok ? await driversRes.json() : { data: [] };
  const { data: driverAssignments }: { data: DriverVehicleAssignment[] } = driverAssignmentsRes.ok
    ? await driverAssignmentsRes.json()
    : { data: [] };

  const routes: Route[] = await Promise.all(
    routesRaw.map(async (route) => {
      const stopsRes = await apiFetch(`/routes/${route.id}/stops`);
      const stops = stopsRes.ok ? (await stopsRes.json()).data : [];
      return { ...route, stops };
    }),
  );

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Transport</h1>
      <p className="mt-1 text-sm text-text-muted">Fleet, routes and stops, and drivers — view-only.</p>
      <div className="mt-6">
        <PrincipalTransportTabs vehicles={vehicles} routes={routes} drivers={drivers} assignments={driverAssignments} />
      </div>
    </div>
  );
}
