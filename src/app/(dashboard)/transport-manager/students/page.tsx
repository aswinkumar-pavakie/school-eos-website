// Students -- transport mapping search, aggregated across every route via
// the same /routes/:id/assigned-students endpoint Route detail already uses
// (never a separate/invented student directory). Read-only, matching
// student-transport-allocations' own TRANSPORT_MANAGER read-only grant.
// Pixel-matched to this role's own established design language (the same
// 1280px container, 32px page title, and filter-bar/card styling every
// other list page here already uses) -- this page hadn't been brought in
// line with that yet. Real "Bus" filter added alongside Route/Status,
// derived from each route's own real current vehicle_route_assignment.

import { TransportStudentsTable } from "@/components/transport/TransportStudentsTable";
import type { TransportStudentRow } from "@/components/transport/TransportStudentsTable";
import { apiFetch } from "@/lib/api";

interface RouteOption {
  id: string;
  name: string;
  code: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
}
interface Assignment {
  vehicleId: string;
  routeId: string;
}
interface RouteAssignedStudentRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  routeStopId: string;
  stopName: string;
  direction: string;
  status: string;
}

export default async function TransportManagerStudentsPage() {
  const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
    apiFetch("/routes"),
    apiFetch("/vehicles"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Students</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: routes }: { data: RouteOption[] } = await routesRes.json();
  const vehicles: Vehicle[] = vehiclesRes.ok ? (await vehiclesRes.json()).data : [];
  const assignments: Assignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const vehicleByRouteId = new Map(
    assignments.map((a) => [a.routeId, vehicleById.get(a.vehicleId) ?? null] as const).filter(([, v]) => v !== null),
  );

  const perRoute = await Promise.all(
    routes.map(async (route) => {
      const res = await apiFetch(`/routes/${route.id}/assigned-students`);
      const rows: RouteAssignedStudentRow[] = res.ok ? (await res.json()).data : [];
      const vehicle = vehicleByRouteId.get(route.id) ?? null;
      return rows.map(
        (row): TransportStudentRow => ({
          ...row,
          routeId: route.id,
          routeName: route.code ?? route.name,
          vehicleId: vehicle?.id ?? null,
          vehicleRegNo: vehicle?.registrationNo ?? null,
        }),
      );
    }),
  );
  const students = perRoute.flat();

  const busOptions = vehicles.filter((v) => assignments.some((a) => a.vehicleId === v.id));

  return (
    <div className="mx-auto max-w-[1280px]">
      <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Students</h1>
      <p className="mt-1.5 text-[15px] text-text-muted">Who is using transport, and on which bus, route and stop.</p>
      <div className="mt-6">
        <TransportStudentsTable students={students} routes={routes} buses={busOptions} />
      </div>
    </div>
  );
}
