// Routes -- Transport Manager's read-only view of route + stop master data
// (RoutesPanel's own readOnly prop, with routesBasePath pointed at this
// role's own route detail page rather than Admin's).

import { RoutesPanel } from "@/components/transport/RoutesPanel";
import type { Route, RouteAssignment } from "@/components/transport/RoutesPanel";
import { apiFetch } from "@/lib/api";

export default async function TransportManagerRoutesPage() {
  const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
    apiFetch("/routes"),
    apiFetch("/vehicles"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Routes</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: routesRaw }: { data: Omit<Route, "stops">[] } = await routesRes.json();
  const { data: vehicles }: { data: { id: string; registrationNo: string }[] } = vehiclesRes.ok
    ? await vehiclesRes.json()
    : { data: [] };
  const { data: assignments }: { data: RouteAssignment[] } = assignmentsRes.ok
    ? await assignmentsRes.json()
    : { data: [] };

  const routes: Route[] = await Promise.all(
    routesRaw.map(async (route) => {
      const stopsRes = await apiFetch(`/routes/${route.id}/stops`);
      const stops = stopsRes.ok ? (await stopsRes.json()).data : [];
      return { ...route, stops };
    }),
  );

  const vehicleRegNoById = new Map(vehicles.map((v) => [v.id, v.registrationNo]));

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Routes</h1>
      <p className="mt-1 text-sm text-text-muted">Routes and stops — view only.</p>
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <RoutesPanel routes={routes} assignments={assignments} vehicleRegNoById={vehicleRegNoById} readOnly routesBasePath="/transport-manager/routes" />
      </div>
    </div>
  );
}
