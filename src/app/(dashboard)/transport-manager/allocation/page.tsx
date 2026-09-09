// Bus Allocation -- where Route + Bus + Driver come together. The one real
// write Transport Manager performs (assign/change a driver-vehicle-route
// assignment) -- AssignmentsPanel already has no readOnly variant because
// every caller of it (only Admin, until now) was always allowed to write;
// the backend already permits TRANSPORT_MANAGER on this exact endpoint (see
// vehicle-route-assignments.controller.ts's own comment on why this write,
// unlike every other Transport write, is opened to this role).

import { AssignmentsPanel } from "@/components/transport/AssignmentsPanel";
import type { Assignment } from "@/components/transport/AssignmentsPanel";
import { apiFetch } from "@/lib/api";

export default async function TransportManagerAllocationPage() {
  const [assignmentsRes, vehiclesRes, routesRes, driversRes, attendantsRes] = await Promise.all([
    apiFetch("/vehicle-route-assignments"),
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/drivers"),
    apiFetch("/attendants"),
  ]);

  if (!assignmentsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Bus Allocation</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: assignments }: { data: Assignment[] } = await assignmentsRes.json();
  const { data: vehicles }: { data: { id: string; registrationNo: string }[] } = vehiclesRes.ok
    ? await vehiclesRes.json()
    : { data: [] };
  const { data: routes }: { data: { id: string; name: string }[] } = routesRes.ok ? await routesRes.json() : { data: [] };
  const { data: drivers }: { data: { id: string; fullName: string }[] } = driversRes.ok
    ? await driversRes.json()
    : { data: [] };
  const { data: attendants }: { data: { id: string; fullName: string }[] } = attendantsRes.ok
    ? await attendantsRes.json()
    : { data: [] };

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Bus Allocation</h1>
      <p className="mt-1 text-sm text-text-muted">Assign a bus, route, driver and attendant together.</p>
      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <AssignmentsPanel assignments={assignments} vehicles={vehicles} routes={routes} drivers={drivers} attendants={attendants} />
      </div>
    </div>
  );
}
