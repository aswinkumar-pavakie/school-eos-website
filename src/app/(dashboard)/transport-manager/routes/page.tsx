// Routes -- rebuilt to the mockup's own "isRoutes" screen (Transport
// Module.dc.html): the shared 5-KPI row (transport-kpis.ts, identical to
// every other list page per the mockup's own `showKpis` logic) plus a dense
// 9-column grid-row list (grid-template-columns literally
// 130px/1.4fr/70px/110px/130px/110px/1fr/90px/100px). "Term fee" is one of
// those 9 columns in the mockup but has no real column anywhere in this
// schema (confirmed earlier this session) -- the column stays, honestly
// showing "not tracked" rather than a fabricated amount. Edit/Delete on each
// row are the mockup's own icon-only 32x32 buttons, shown but disabled --
// route/stop master data is Admin-only (route create/edit/delete); the row
// itself is clickable through to the assigned bus's real detail page,
// matching the mockup's own row-level onOpen.

import { RouteRow } from "@/components/transport/RouteRow";
import { AddRouteForm } from "@/components/transport/AddRouteForm";
import { apiFetch } from "@/lib/api";

interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
interface RouteRecord {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
  stops: RouteStop[];
}
interface Assignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
}
interface Driver {
  id: string;
  fullName: string;
}
interface Attendant {
  id: string;
  fullName: string;
}
interface AssignedStudent {
  id: string;
  studentId: string;
  status: string;
}

// Narrower + no forced min-width (unlike the mockup's own fixed-px dense
// grid) so the table fits the real 1280px page container at any viewport
// without a horizontal scrollbar -- text wraps in the two widest columns
// instead of forcing overflow.
const ROW_GRID = "72px minmax(0,1.3fr) 56px 74px minmax(0,0.85fr) 76px minmax(0,1.05fr) 64px 78px";

export default async function TransportManagerRoutesPage() {
  const [routesRes, vehiclesRes, driversRes, attendantsRes, assignmentsRes] = await Promise.all([
    apiFetch("/routes"),
    apiFetch("/vehicles"),
    apiFetch("/drivers"),
    apiFetch("/attendants"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Routes</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: routesRaw }: { data: Omit<RouteRecord, "stops">[] } = await routesRes.json();
  const vehicles: Vehicle[] = vehiclesRes.ok ? (await vehiclesRes.json()).data : [];
  const drivers: Driver[] = driversRes.ok ? (await driversRes.json()).data : [];
  const attendants: Attendant[] = attendantsRes.ok ? (await attendantsRes.json()).data : [];
  const assignments: Assignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];

  const routes = await Promise.all(
    routesRaw.map(async (route) => {
      const stopsRes = await apiFetch(`/routes/${route.id}/stops`);
      const stops: RouteStop[] = stopsRes.ok ? (await stopsRes.json()).data : [];
      return { ...route, stops };
    }),
  );

  const ridersByRouteId = new Map(
    await Promise.all(
      routes.map(async (r): Promise<[string, number]> => {
        const res = await apiFetch(`/routes/${r.id}/assigned-students`);
        const students: AssignedStudent[] = res.ok ? (await res.json()).data : [];
        // Each real rider has TWO allocation rows here (PICKUP + DROP), so a
        // plain .length doubles the count -- count distinct students instead.
        return [r.id, new Set(students.filter((s) => s.status === "ACTIVE").map((s) => s.studentId)).size];
      }),
    ),
  );

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const driverById = new Map(drivers.map((d) => [d.id, d]));
  const assignmentByRouteId = new Map(assignments.map((a) => [a.routeId, a]));

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Routes</h1>
          <p className="mt-1.5 text-[15px] text-text-muted">Boarding areas, stops, timings and fees.</p>
        </div>
        <AddRouteForm triggerClassName="rounded-[10px] bg-primary px-4 py-[11px] text-sm font-bold text-white hover:bg-primary-hover" />
      </div>

      <div className="mt-5 rounded-[16px] border" style={{ borderColor: "var(--color-divider)" }}>
        <div className="grid items-center gap-3 px-5 py-[14px] text-[11px] font-bold uppercase leading-[14px] tracking-[0.05em] text-text-muted" style={{ gridTemplateColumns: ROW_GRID, borderBottom: "1px solid var(--color-divider)" }}>
          <span>Route</span>
          <span>Boarding area → campus</span>
          <span>Stops</span>
          <span>Distance</span>
          <span>Pickup window</span>
          <span>Term fee</span>
          <span>Bus &amp; driver</span>
          <span className="text-right">Students</span>
          <span className="text-right">Actions</span>
        </div>

        {routes.map((route, i) => {
          const assignment = assignmentByRouteId.get(route.id);
          const vehicle = assignment ? vehicleById.get(assignment.vehicleId) : undefined;
          const driver = assignment?.driverId ? driverById.get(assignment.driverId) : undefined;
          const sortedStops = [...route.stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
          const firstStop = sortedStops[0];
          const lastStop = sortedStops[sortedStops.length - 1];
          const riders = ridersByRouteId.get(route.id) ?? 0;
          // A vehicle already serving another current route can't be picked
          // here -- the backend already rejects this (VehicleRouteAssignments
          // Service.create's own overlap check), but surfacing it as a real
          // conflict error after submit is a worse experience than simply
          // not offering an already-taken bus in the first place. The bus
          // already on THIS route stays selectable (so reassigning driver/
          // attendant without changing the bus still works).
          const availableVehicles = vehicles.filter(
            (v) => v.id === assignment?.vehicleId || !assignments.some((a) => a.vehicleId === v.id),
          );
          return (
            <RouteRow
              key={route.id}
              routeId={route.id}
              serial={i + 1}
              routeLabel={route.code ?? route.name}
              firstStopName={firstStop?.stopName ?? ""}
              stopsCount={sortedStops.length}
              distanceKm={route.distanceKm}
              pickupWindow={firstStop?.scheduledTime && lastStop?.scheduledTime ? `${firstStop.scheduledTime} – ${lastStop.scheduledTime}` : null}
              vehicleRegNo={vehicle?.registrationNo ?? null}
              driverName={driver?.fullName ?? null}
              riders={riders}
              href={vehicle ? `/transport-manager/buses/${vehicle.id}` : null}
              gridTemplate={ROW_GRID}
              currentName={route.name}
              currentCode={route.code}
              currentDirection={route.direction}
              currentDistanceKm={route.distanceKm}
              currentStatus={route.status}
              currentAssignmentId={assignment?.id ?? null}
              currentVehicleId={assignment?.vehicleId ?? null}
              currentDriverId={assignment?.driverId ?? null}
              currentAttendantId={assignment?.attendantId ?? null}
              vehicles={availableVehicles}
              drivers={drivers}
              attendants={attendants}
            />
          );
        })}
      </div>
    </div>
  );
}
