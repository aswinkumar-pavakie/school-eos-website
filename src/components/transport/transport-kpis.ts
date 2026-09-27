// The 5-KPI row (Buses/Routes/Students ferried/Avg occupancy/Docs to renew)
// shown above every Transport Manager list screen per the mockup's own
// `showKpis: !sel && tab !== 'dashboard'` -- the identical row on Fleet,
// Routes, Drivers & crew, Maintenance and Compliance, never a per-page
// variant. Computed once here so every list page renders the same real
// numbers instead of five slightly-different hand-rolled versions. Two of
// the mockup's own sub-lines have no real backing data anywhere in this
// schema ("Route 04 added 18 Aug" -- no route created_at column; "Waiting
// list of 6" -- no waitlist concept) and are honestly substituted with a
// real figure rather than fabricated.

import { apiFetch } from "@/lib/api";
import type { TransportListKpiCardProps } from "./TransportListKpiCard";

interface Vehicle {
  id: string;
  registrationNo: string;
  capacity: number;
}
interface RouteStop {
  id: string;
}
interface Route {
  id: string;
  name: string;
  code: string | null;
  distanceKm: string | null;
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
interface DocRow {
  id: string;
  docType: string;
  validTo: string;
}
interface VehicleSpec {
  yearOfManufacture: number | null;
}

function daysUntil(dateIso: string): number {
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function computeTransportKpis(basePath: string = "/transport-manager"): Promise<TransportListKpiCardProps[]> {
  const [vehiclesRes, routesRes, assignmentsRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
  ]);
  const vehicles: Vehicle[] = vehiclesRes.ok ? (await vehiclesRes.json()).data : [];
  const routes: Route[] = routesRes.ok ? (await routesRes.json()).data : [];
  const assignments: Assignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];

  const [ridersByRoute, stopsByRoute, specByVehicle, docsByVehicle] = await Promise.all([
    Promise.all(
      routes.map(async (r) => {
        const res = await apiFetch(`/routes/${r.id}/assigned-students`);
        const students: AssignedStudent[] = res.ok ? (await res.json()).data : [];
        // Each real rider has TWO allocation rows here (PICKUP + DROP,
        // confirmed via a read-only DB check), so a plain .length doubles
        // every occupancy figure below (observed live: 184% fleet-wide
        // occupancy) -- count distinct students, not allocation rows.
        const riders = new Set(students.filter((s) => s.status === "ACTIVE").map((s) => s.studentId)).size;
        return { routeId: r.id, riders };
      }),
    ),
    Promise.all(
      routes.map(async (r) => {
        const res = await apiFetch(`/routes/${r.id}/stops`);
        const stops: RouteStop[] = res.ok ? (await res.json()).data : [];
        return stops.length;
      }),
    ),
    Promise.all(
      vehicles.map(async (v) => {
        const res = await apiFetch(`/vehicles/${v.id}/spec`);
        const spec: VehicleSpec | null = res.ok ? (await res.json()).data : null;
        return spec?.yearOfManufacture ?? null;
      }),
    ),
    Promise.all(
      vehicles.map(async (v) => {
        const res = await apiFetch(`/vehicles/${v.id}/documents`);
        const docs: DocRow[] = res.ok ? (await res.json()).data : [];
        return docs;
      }),
    ),
  ]);

  const ridersByRouteId = new Map(ridersByRoute.map((r) => [r.routeId, r.riders]));
  const assignmentByRouteId = new Map(assignments.map((a) => [a.routeId, a]));

  // KPI 1 -- Buses
  const years = specByVehicle.filter((y): y is number => y !== null);
  const fleetAgeSub =
    years.length > 0
      ? `Fleet age ${2026 - Math.max(...years)} to ${2026 - Math.min(...years)} years`
      : "Year of manufacture not recorded — see query.md";

  // KPI 2 -- Routes
  const totalStops = stopsByRoute.reduce((sum, n) => sum + n, 0);
  const totalDistance = routes.reduce((sum, r) => sum + (r.distanceKm ? Number(r.distanceKm) : 0), 0);

  // KPI 3/4 -- occupancy
  const totalSeats = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const totalRiders = routes.reduce((sum, r) => sum + (ridersByRouteId.get(r.id) ?? 0), 0);
  const freeSeats = totalSeats - totalRiders;
  const occPct = totalSeats > 0 ? Math.round((totalRiders / totalSeats) * 100) : 0;
  const routeOccupancy = routes
    .map((r) => {
      const a = assignmentByRouteId.get(r.id);
      const vehicle = a ? vehicles.find((v) => v.id === a.vehicleId) : null;
      const riders = ridersByRouteId.get(r.id) ?? 0;
      return vehicle && vehicle.capacity > 0 ? { name: r.code ?? r.name, pct: Math.round((riders / vehicle.capacity) * 100) } : null;
    })
    .filter((r): r is { name: string; pct: number } => r !== null);
  const fullestRoute = routeOccupancy.length > 0 ? [...routeOccupancy].sort((a, b) => b.pct - a.pct)[0] : null;
  const lightestRoute = routeOccupancy.length > 0 ? [...routeOccupancy].sort((a, b) => a.pct - b.pct)[0] : null;

  // KPI 5 -- docs to renew
  const allDocs = docsByVehicle.flat();
  const docsRenewing = allDocs.filter((d) => daysUntil(d.validTo) <= 45);
  const docsOverdue = docsRenewing.filter((d) => daysUntil(d.validTo) < 0);
  const nextDoc = docsRenewing.filter((d) => daysUntil(d.validTo) >= 0).sort((a, b) => daysUntil(a.validTo) - daysUntil(b.validTo))[0] ?? null;
  const docsRenewPct = allDocs.length > 0 ? Math.round((docsRenewing.length / allDocs.length) * 100) : 0;

  // Principal/Vice Principal have no separate Fleet/Routes/Compliance pages
  // (their whole oversight surface is the one Transport page + route detail),
  // so their KPI cards render as plain non-clickable tiles -- only Transport
  // Manager's own richer navigation gets real sub-page links.
  const isTransportManager = basePath === "/transport-manager";
  const hrefFleet = isTransportManager ? `${basePath}/buses` : undefined;
  const hrefRoutes = isTransportManager ? `${basePath}/routes` : undefined;
  const hrefCompliance = isTransportManager ? `${basePath}/compliance` : undefined;

  return [
    {
      label: "Buses",
      value: String(vehicles.length),
      unit: "in the register",
      subA: `${vehicles.length} in the school register`,
      subB: fleetAgeSub,
      href: hrefFleet,
    },
    {
      label: "Routes",
      value: String(routes.length),
      unit: "live this term",
      subA: `covering ${totalStops} stops`,
      subB: `${totalDistance.toFixed(0)} km total one way`,
      href: hrefRoutes,
    },
    {
      label: "Students ferried",
      value: String(totalRiders),
      unit: `of ${totalSeats} seats`,
      badge: `${occPct}%`,
      bar: occPct,
      subA: `${freeSeats} seats free across the fleet`,
      subB: undefined,
      href: hrefRoutes,
    },
    {
      label: "Avg occupancy",
      value: `${occPct}%`,
      unit: "fleet wide",
      badge: `${occPct}%`,
      bar: occPct,
      subA: fullestRoute ? `${fullestRoute.name} fullest at ${fullestRoute.pct}%` : "No route occupancy data yet",
      subB: lightestRoute ? `${lightestRoute.name} lightest at ${lightestRoute.pct}%` : undefined,
      href: hrefRoutes,
    },
    {
      label: "Docs to renew",
      value: String(docsRenewing.length),
      unit: `of ${allDocs.length} documents`,
      badge: `${docsRenewPct}%`,
      bar: docsRenewPct,
      subA: `within 45 days · ${docsOverdue.length} overdue`,
      subB: nextDoc ? `${nextDoc.docType.replace(/_/g, " ")} due ${daysUntil(nextDoc.validTo) < 0 ? "overdue" : `in ${daysUntil(nextDoc.validTo)} days`}` : "all documents valid",
      href: hrefCompliance,
    },
  ];
}
