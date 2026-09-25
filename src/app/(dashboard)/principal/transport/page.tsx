// Principal -> Transport: read-only oversight of the same real fleet, routes
// and drivers Admin/Transport Manager operate -- no create/edit controls.
// Transport operational management stays with Admin/Transport Manager;
// Principal gets visibility, not the write actions.
//
// Rebuilt to pixel-match the SIS Principal mockup's Transport screen: the
// same 5-card KPI row every Transport Manager list page already shows
// (computeTransportKpis/TransportListKpiCard, reused verbatim -- role-
// agnostic, no Principal-specific reimplementation) plus a simple real
// "Routes" row list (TransportOversightRoutesList, shared with Vice
// Principal) in place of the old tabs UI.

import { computeTransportKpis } from "@/components/transport/transport-kpis";
import { TransportListKpiCard } from "@/components/transport/TransportListKpiCard";
import { TransportOversightRoutesList, type OversightRouteRow } from "@/components/transport/TransportOversightRoutesList";
import { apiFetch } from "@/lib/api";

interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
}
interface Route {
  id: string;
  name: string;
  code: string | null;
  distanceKm: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
}
interface Assignment {
  vehicleId: string;
  routeId: string;
}
interface AssignedStudent {
  id: string;
  studentId: string;
  status: string;
}

export default async function PrincipalTransportPage() {
  const [routesRes, vehiclesRes, assignmentsRes, kpis] = await Promise.all([
    apiFetch("/routes"),
    apiFetch("/vehicles"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
    computeTransportKpis("/principal/transport"),
  ]);

  if (!routesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Transport</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: routes }: { data: Route[] } = await routesRes.json();
  const vehicles: Vehicle[] = vehiclesRes.ok ? (await vehiclesRes.json()).data : [];
  const assignments: Assignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const assignmentByRouteId = new Map(assignments.map((a) => [a.routeId, a]));

  const routeRows: OversightRouteRow[] = await Promise.all(
    routes.map(async (route) => {
      const [stopsRes, studentsRes] = await Promise.all([
        apiFetch(`/routes/${route.id}/stops`),
        apiFetch(`/routes/${route.id}/assigned-students`),
      ]);
      const stops: RouteStop[] = stopsRes.ok ? (await stopsRes.json()).data : [];
      const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
      const students: AssignedStudent[] = studentsRes.ok ? (await studentsRes.json()).data : [];
      // Each real rider has TWO allocation rows here (PICKUP + DROP), so a
      // plain .length doubles the count -- count distinct students instead.
      const studentCount = new Set(students.filter((s) => s.status === "ACTIVE").map((s) => s.studentId)).size;
      const assignment = assignmentByRouteId.get(route.id);
      const vehicle = assignment ? (vehicleById.get(assignment.vehicleId) ?? null) : null;
      return {
        id: route.id,
        name: route.name,
        code: route.code,
        firstStop: sortedStops[0]?.stopName ?? null,
        lastStop: sortedStops.length > 1 ? sortedStops[sortedStops.length - 1].stopName : null,
        stopsCount: stops.length,
        distanceKm: route.distanceKm,
        vehicleRegNo: vehicle?.registrationNo ?? null,
        studentCount,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Transport</h1>
      <p className="mt-1 text-sm text-text-muted">Routes, stops and the students boarding at each stop.</p>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <TransportListKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <TransportOversightRoutesList routes={routeRows} basePath="/principal/transport" />
    </div>
  );
}
