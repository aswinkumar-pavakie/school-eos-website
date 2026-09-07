// Transport -- Design Architecture v0.1 module 15 (setup half; live tracking is a
// later phase). Vehicles, routes + stops, drivers, attendants, and vehicle-route
// assignments. Every value is real data via apiFetch.

import { TransportTabs } from "@/components/transport/TransportTabs";
import type { Route } from "@/components/transport/RoutesPanel";
import { apiFetch } from "@/lib/api";

export default async function TransportPage() {
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

  const { data: vehicles } = await vehiclesRes.json();
  const { data: routesRaw } = routesRes.ok ? await routesRes.json() : { data: [] };
  const { data: drivers } = driversRes.ok ? await driversRes.json() : { data: [] };
  const { data: driverAssignments } = driverAssignmentsRes.ok
    ? await driverAssignmentsRes.json()
    : { data: [] };

  const routes: Route[] = await Promise.all(
    (routesRaw as Omit<Route, "stops">[]).map(async (route) => {
      const stopsRes = await apiFetch(`/routes/${route.id}/stops`);
      const stops = stopsRes.ok ? (await stopsRes.json()).data : [];
      return { ...route, stops };
    }),
  );

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Transport</h1>
      <p className="mt-1 text-sm text-text-muted">Fleet, routes and stops, and drivers.</p>
      <div className="mt-6">
        <TransportTabs vehicles={vehicles} routes={routes} drivers={drivers} driverAssignments={driverAssignments} />
      </div>
    </div>
  );
}
