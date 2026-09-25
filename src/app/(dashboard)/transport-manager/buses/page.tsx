// Buses -- pixel-matched to the SIS Transport mockup's own "Fleet" screen
// (Transport Module.dc.html lines 251-306): the shared 5-KPI row
// (transport-kpis.ts), search + status filter chips, and the exact card
// markup (serial circle/icon box/seat badge/status dot/facts grid/bar/flags,
// every literal size/weight/color verified against the mockup's own inline
// styles, not approximated). Edit links to the real master-record edit modal
// on the bus detail page; Delete is a real "Request deactivation" (no hard
// vehicle delete exists anywhere in this app) -- both are real now, not the
// disabled placeholders from before TRANSPORT_MANAGER had write access.
// "Waiting list of 6" and "Route 04 added 18 Aug" (mockup's own KPI
// sub-lines) have no real column anywhere in this schema -- transport-
// kpis.ts substitutes a real figure there rather than fabricating one.

import Link from "next/link";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
import { AddVehicleForm } from "@/components/transport/AddVehicleForm";
import { RequestActionButton } from "@/components/transport/RequestActionButton";
import { requestVehicleDeactivateAction } from "@/app/(dashboard)/transport-manager/actions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface Vehicle {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
}
interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
interface Route {
  id: string;
  name: string;
  code: string | null;
  distanceKm: string | null;
  status: string;
  stops: RouteStop[];
}
interface Driver {
  id: string;
  fullName: string;
}
interface VehicleAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
}
interface AssignedStudent {
  id: string;
  studentId: string;
  routeStopId: string;
  status: string;
}
interface BusTrackingResult {
  vehicle: { id: string; registrationNo: string };
  freshness: "LIVE" | "STALE" | "NO_DATA";
  trip: { state: string } | null;
}
interface DocRow {
  id: string;
  docType: string;
  validTo: string;
}
interface MaintenanceRow {
  id: string;
  performedOn: string;
}
interface ServiceDueRow {
  vehicleId: string;
  currentOdometerKm: number | null;
  nextServiceDueKm: number | null;
}

function daysUntil(dateIso: string): number {
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

type BusStatus = "On route" | "At campus" | "In depot" | "Maintenance";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "On route", label: "On route" },
  { value: "At campus", label: "At campus" },
  { value: "In depot", label: "In depot" },
  { value: "Maintenance", label: "Maintenance" },
];

export default async function TransportManagerBusesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const sp = await searchParams;

  const [vehiclesRes, routesRes, driversRes, assignmentsRes, fleetRes, serviceDueRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/drivers"),
    apiFetch("/vehicle-route-assignments?currentOnly=true"),
    apiFetch("/transport-ops/bus-tracking/fleet"),
    apiFetch("/vehicles/service-due"),
  ]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load Buses</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const vehicles: Vehicle[] = (await vehiclesRes.json()).data;
  const routesRaw: Omit<Route, "stops">[] = routesRes.ok ? (await routesRes.json()).data : [];
  // /routes never inlines stops -- fetched per route, same as routes/page.tsx's
  // own pattern (this was a real bug: the Route type below claims `stops` is
  // always present, but it silently wasn't until this merge, and r.route?.stops
  // .slice() further down would throw the instant a bus with an assigned route
  // rendered -- same class of crash as transport-kpis.ts's r.stops.length).
  const routes: Route[] = await Promise.all(
    routesRaw.map(async (route) => {
      const stopsRes = await apiFetch(`/routes/${route.id}/stops`);
      const stops: RouteStop[] = stopsRes.ok ? (await stopsRes.json()).data : [];
      return { ...route, stops };
    }),
  );
  const drivers: Driver[] = driversRes.ok ? (await driversRes.json()).data : [];
  const assignments: VehicleAssignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];
  const fleet: BusTrackingResult[] = fleetRes.ok ? (await fleetRes.json()).data : [];
  const serviceDue: ServiceDueRow[] = serviceDueRes.ok ? (await serviceDueRes.json()).data : [];

  const driverById = new Map(drivers.map((d) => [d.id, d]));
  const routeById = new Map(routes.map((r) => [r.id, r]));
  const assignmentByVehicleId = new Map(assignments.map((a) => [a.vehicleId, a]));
  const trackingByVehicleId = new Map(fleet.map((f) => [f.vehicle.id, f]));
  const serviceDueByVehicleId = new Map(serviceDue.map((s) => [s.vehicleId, s]));

  // Per-route real occupancy (small fleet -- 5-8 routes, cheap N+1, same
  // pattern as Overview's per-vehicle document fetches).
  const assignedStudentsByRoute = await Promise.all(
    routes.map(async (r) => {
      const res = await apiFetch(`/routes/${r.id}/assigned-students`);
      const students: AssignedStudent[] = res.ok ? (await res.json()).data : [];
      // Each real rider has TWO allocation rows here (PICKUP + DROP), so a
      // plain .length doubles the count -- count distinct students instead.
      const riders = new Set(students.filter((s) => s.status === "ACTIVE").map((s) => s.studentId)).size;
      return { routeId: r.id, riders };
    }),
  );
  const ridersByRouteId = new Map(assignedStudentsByRoute.map((r) => [r.routeId, r.riders]));

  // Per-vehicle documents + latest maintenance (small fleet, same N+1
  // pattern as Overview).
  const [docsByVehicle, maintenanceByVehicle] = await Promise.all([
    Promise.all(
      vehicles.map(async (v) => {
        const res = await apiFetch(`/vehicles/${v.id}/documents`);
        const docs: DocRow[] = res.ok ? (await res.json()).data : [];
        return { vehicleId: v.id, docs };
      }),
    ),
    Promise.all(
      vehicles.map(async (v) => {
        const res = await apiFetch(`/vehicles/${v.id}/maintenance`);
        const rows: MaintenanceRow[] = res.ok ? (await res.json()).data : [];
        const latest = rows.length > 0 ? [...rows].sort((a, b) => (a.performedOn > b.performedOn ? -1 : 1))[0] : null;
        return { vehicleId: v.id, latest };
      }),
    ),
  ]);
  const docsByVehicleId = new Map(docsByVehicle.map((d) => [d.vehicleId, d.docs]));
  const maintenanceByVehicleId = new Map(maintenanceByVehicle.map((m) => [m.vehicleId, m.latest]));

  // Status classification -- real vehicle.operationalStatus for Maintenance/
  // In depot; real live trip state for On route; the honest remainder is At
  // campus (same reasoning as the Overview dashboard's own Buses card).
  function busStatus(v: Vehicle): BusStatus {
    if (v.operationalStatus === "MAINTENANCE") return "Maintenance";
    if (v.operationalStatus === "GROUNDED") return "In depot";
    const tracking = trackingByVehicleId.get(v.id);
    if (tracking?.freshness === "LIVE" && tracking.trip && (tracking.trip.state === "STARTED" || tracking.trip.state === "IN_PROGRESS")) {
      return "On route";
    }
    return "At campus";
  }

  const rows = vehicles.map((v) => {
    const assignment = assignmentByVehicleId.get(v.id) ?? null;
    const route = assignment ? routeById.get(assignment.routeId) ?? null : null;
    const driver = assignment?.driverId ? driverById.get(assignment.driverId) ?? null : null;
    const riders = route ? ridersByRouteId.get(route.id) ?? 0 : 0;
    const status = busStatus(v);
    const docs = docsByVehicleId.get(v.id) ?? [];
    const docsRenewing = docs.filter((d) => daysUntil(d.validTo) <= 45);
    const docsOverdue = docsRenewing.filter((d) => daysUntil(d.validTo) < 0);
    const latestService = maintenanceByVehicleId.get(v.id) ?? null;
    const tracking = trackingByVehicleId.get(v.id) ?? null;
    const svc = serviceDueByVehicleId.get(v.id) ?? null;
    const serviceDueSoon =
      svc?.currentOdometerKm !== null && svc?.currentOdometerKm !== undefined && svc?.nextServiceDueKm !== null && svc?.nextServiceDueKm !== undefined
        ? svc.nextServiceDueKm - svc.currentOdometerKm <= 4000
        : null;
    return { vehicle: v, route, driver, riders, status, docsRenewing, docsOverdue, latestService, tracking, serviceDueSoon };
  });

  const search = (sp.search ?? "").trim().toLowerCase();
  const statusFilter = sp.status ?? "";
  const filteredRows = rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (!search) return true;
    const haystack = `${r.vehicle.registrationNo} ${r.route?.name ?? ""} ${r.driver?.fullName ?? ""}`.toLowerCase();
    return haystack.includes(search);
  });

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Fleet</h1>
          <p className="mt-1.5 text-[15px] text-text-muted">Every vehicle in the school register.</p>
        </div>
        <AddVehicleForm triggerClassName="rounded-[10px] bg-primary px-4 py-[11px] text-sm font-bold text-white hover:bg-primary-deep" />
      </div>

      <form action="/transport-manager/buses" className="mt-6 flex flex-wrap items-center gap-3">
        <AutoSubmitSearchInput
          type="search"
          name="search"
          defaultValue={sp.search ?? ""}
          placeholder="Search bus number, route or driver…"
          className="min-w-[260px] flex-1 rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        />
        <div className="hidden sm:block">
          <AutoSubmitSelect
            name="status"
            defaultValue={statusFilter}
            className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <span className="text-[13px] font-semibold text-text-muted">
          {filteredRows.length} of {vehicles.length} buses
        </span>
      </form>

      {filteredRows.length === 0 ? (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold text-text">No buses match this filter</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(410px, 1fr))" }}>
          {filteredRows.map((r, i) => {
            const stops = r.route?.stops.slice().sort((a, b) => a.sequenceNo - b.sequenceNo) ?? [];
            const firstStop = stops[0];
            const lastStop = stops[stops.length - 1];
            const freeSeatsOnBus = r.vehicle.capacity - r.riders;
            return (
              <div
                key={r.vehicle.id}
                className="card-hover rounded-[16px] border border-border bg-surface p-[18px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[12.5px] font-extrabold text-primary"
                      style={{ border: "1px solid #C7D7F5" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] text-primary"
                      style={{ background: "#EFF4FF" }}
                    >
                      <MaterialIcon name="directions_bus" size={22} />
                    </span>
                    <div>
                      <p className="font-mono text-[17px] font-semibold tracking-[0.02em] text-text">{r.vehicle.registrationNo}</p>
                      <p className="mt-[3px] text-[13px] text-text-muted">
                        {r.route ? r.route.name : "No route assigned"}
                        {r.route ? ` · ${stops.length} stops` : ""}
                        {r.route?.distanceKm ? ` · ${r.route.distanceKm} km` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className="rounded-[999px] px-2.5 py-[5px] text-[12px] font-bold"
                      style={
                        freeSeatsOnBus <= 0
                          ? { background: "#DBEAFE", color: "#1E3A8A" }
                          : freeSeatsOnBus <= 5
                            ? { background: "#EFF4FF", color: "#2563EB" }
                            : { background: "#F1F5F9", color: "#334155" }
                      }
                    >
                      {freeSeatsOnBus <= 0 ? "Full" : `${freeSeatsOnBus} seats free`}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-[12px] font-semibold"
                      style={{
                        color:
                          r.status === "On route"
                            ? "#1D4ED8"
                            : r.status === "At campus"
                              ? "#3B82F6"
                              : r.status === "In depot"
                                ? "#94A3B8"
                                : "#1E3A8A",
                      }}
                    >
                      ● {r.status}
                    </span>
                  </div>
                </div>

                {firstStop && lastStop && (
                  <p className="mt-3 flex flex-wrap items-center gap-2.5 text-[14px] font-semibold text-text">
                    {firstStop.stopName} <span style={{ color: "#94A3B8" }}>→</span> School campus
                    {firstStop.scheduledTime && lastStop.scheduledTime && (
                      <span className="ml-auto font-mono text-[12px]" style={{ color: "#64748B" }}>
                        {firstStop.scheduledTime} - {lastStop.scheduledTime}
                      </span>
                    )}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#94A3B8" }}>Occupancy</p>
                    <p className="mt-1 text-[16px] font-extrabold text-text">
                      {r.riders}/{r.vehicle.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#94A3B8" }}>Distance</p>
                    <p className="mt-1 text-[16px] font-extrabold text-text">{r.route?.distanceKm ?? "—"} km</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#94A3B8" }}>Model</p>
                    <p className="mt-1 truncate text-[13px] font-semibold" style={{ color: "#334155" }}>{r.vehicle.model ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#94A3B8" }}>Driver</p>
                    <p className="mt-1 truncate text-[13px] font-semibold" style={{ color: "#334155" }}>{r.driver?.fullName ?? "—"}</p>
                  </div>
                </div>

                {(() => {
                  const pct = r.vehicle.capacity > 0 ? Math.min(100, Math.round((r.riders / r.vehicle.capacity) * 100)) : 0;
                  const barColor = pct >= 98 ? "#1E3A8A" : pct >= 85 ? "#1D4ED8" : "#60A5FA";
                  const docWorst = r.docsOverdue.length > 0 ? "BAD" : r.docsRenewing.length > 0 ? "WARN" : "OK";
                  return (
                    <>
                      <div className="mt-3 overflow-hidden rounded-[999px]" style={{ height: 6, background: "#EEF2F7" }}>
                        <div className="h-full rounded-[999px]" style={{ width: `${pct}%`, background: barColor }} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-[6px] px-2 py-1 text-[11px] font-bold"
                          style={
                            docWorst === "BAD"
                              ? { background: "#DBEAFE", color: "#1E3A8A" }
                              : docWorst === "WARN"
                                ? { background: "#EFF4FF", color: "#2563EB" }
                                : { background: "#F1F5F9", color: "#64748B" }
                          }
                        >
                          {docWorst === "BAD" ? "Document expired" : docWorst === "WARN" ? "Document renewal due" : "Documents in order"}
                        </span>
                        <span
                          className="rounded-[6px] px-2 py-1 text-[11px] font-bold"
                          style={r.serviceDueSoon ? { background: "#EFF4FF", color: "#2563EB" } : { background: "#F1F5F9", color: "#475569" }}
                        >
                          {r.serviceDueSoon
                            ? "Service due soon"
                            : r.latestService
                              ? `Serviced ${formatDate(r.latestService.performedOn)}`
                              : "No service on record"}
                        </span>
                        <span className="rounded-[6px] px-2 py-1 text-[11px] font-bold" style={{ background: "#F1F5F9", color: "#475569" }}>
                          {r.tracking?.freshness === "LIVE" ? "GPS online" : r.tracking?.freshness === "STALE" ? "GPS stale" : "GPS offline"}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`/transport-manager/buses/${r.vehicle.id}`}
                    className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-[7px] text-[12.5px] font-bold hover:bg-field"
                    style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                  >
                    <MaterialIcon name="edit" size={16} /> Edit
                  </Link>
                  <RequestActionButton
                    action={requestVehicleDeactivateAction.bind(null, r.vehicle.id)}
                    confirmTitle="Request deactivation"
                    confirmBody="No hard delete exists for a vehicle in this app -- this requests deactivating it. Nothing changes until Admin approves."
                    submitLabel="Request"
                    submittedLabel="Deactivation requested"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-[7px] text-[12.5px] font-bold"
                      style={{ border: "1px solid #C7D7F5", color: "#1E3A8A" }}
                    >
                      <MaterialIcon name="delete" size={16} /> Delete
                    </button>
                  </RequestActionButton>
                  <Link
                    href={`/transport-manager/buses/${r.vehicle.id}`}
                    className="rounded-[9px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40"
                  >
                    Documents
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
