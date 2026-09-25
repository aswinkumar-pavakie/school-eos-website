// Vehicle detail -- pixel-matched to the SIS Transport mockup's own bus
// detail screen: KPI strip (occupancy/route length/odometer/mileage -- no
// Term fee card, no real column exists anywhere in this schema), a real
// "Vehicle specification" card (year/body/chassis/engine/wheelbase/tyre/fuel
// tank/RTO/parking bay/seating capacity/ownership/GPS device/last service --
// see VehicleSpecPanel's own comment for the real field sourcing and why
// "Fuel & emission" is honestly omitted), real Occupancy (Students only --
// no "Staff riding a bus" concept exists anywhere in this schema, checked
// directly) + Crew, real Route & stop timings (real per-stop boarding
// counts) with a real "+ Add stop", real Documents & compliance, real
// Maintenance history, real Fuel & mileage log. "Edit record"/"Delete"/
// "Edit crew"/"Edit route"/stop edit+delete are all real now -- Transport
// Manager has genuine create/edit access on the vehicle master record,
// route/stop data, and vehicle_route_assignment, with "Delete" routed
// through the real approval-request workflow (deactivation, not a hard
// delete -- none exists). Driver experience/blood group still have no real
// column anywhere in this schema -- not shown.

import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { VehicleDocumentsPanel, type VehicleDocument } from "@/components/transport/VehicleDocumentsPanel";
import { VehicleMaintenancePanel, type VehicleMaintenanceRecord } from "@/components/transport/VehicleMaintenancePanel";
import { FuelLogPanel, type FuelLogEntry } from "@/components/transport/FuelLogPanel";
import { VehicleSpecPanel, type VehicleSpec } from "@/components/transport/VehicleSpecPanel";
import { EditCrewForm } from "@/components/transport/EditCrewForm";
import { EditRouteForm } from "@/components/transport/EditRouteForm";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
import { VehicleMasterEditForm, VehicleDeleteTrigger } from "@/components/transport/VehicleMasterEditForm";
import { RequestActionButton } from "@/components/transport/RequestActionButton";
import { StopForm } from "@/components/transport/StopForm";
import { requestVehicleDeactivateAction, requestRouteStopDeleteAction } from "@/app/(dashboard)/transport-manager/actions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface VehicleDetail {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
  createdAt: string;
}
interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
interface BusTrackingResult {
  vehicle: { id: string };
  freshness: "LIVE" | "STALE" | "NO_DATA";
  trip: { state: string } | null;
}
interface Route {
  id: string;
  name: string;
  code: string | null;
  distanceKm: string | null;
  stops: RouteStop[];
}
interface Assignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
}
interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
}
interface Attendant {
  id: string;
  fullName: string;
  phone: string | null;
}
interface AssignedStudent {
  id: string;
  routeStopId: string;
  status: string;
}
interface GpsStatus {
  deviceUid: string;
  status: string;
  lastSeenAt: string | null;
}

// Same real status derivation as buses/page.tsx's own busStatus() -- kept
// identical so a bus shows the same "On route"/"At school"/"In depot"/
// "Maintenance" label and color here as it does on the Fleet card, rather
// than this page's own separate operational_status-only label.
type BusStatus = "On route" | "At campus" | "In depot" | "Maintenance";
function busStatus(operationalStatus: string, tracking: BusTrackingResult | null): BusStatus {
  if (operationalStatus === "MAINTENANCE") return "Maintenance";
  if (operationalStatus === "GROUNDED") return "In depot";
  if (tracking?.freshness === "LIVE" && tracking.trip && (tracking.trip.state === "STARTED" || tracking.trip.state === "IN_PROGRESS")) {
    return "On route";
  }
  return "At campus";
}
function statusColor(status: BusStatus): string {
  if (status === "On route") return "var(--color-primary)";
  if (status === "At campus") return "var(--color-primary)";
  if (status === "In depot") return "var(--color-text-tertiary)";
  return "var(--color-navy)";
}

export default async function TransportManagerVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [vehicleRes, documentsRes, maintenanceRes, fuelLogRes, specRes, gpsRes, fleetRes, assignmentsRes, allDriversRes, allAttendantsRes, allRoutesRes] =
    await Promise.all([
      apiFetch(`/vehicles/${id}`),
      apiFetch(`/vehicles/${id}/documents`),
      apiFetch(`/vehicles/${id}/maintenance`),
      apiFetch(`/vehicles/${id}/fuel-log`),
      apiFetch(`/vehicles/${id}/spec`),
      apiFetch(`/vehicles/${id}/gps-status`),
      apiFetch("/transport-ops/bus-tracking/fleet"),
      apiFetch(`/vehicle-route-assignments?vehicleId=${id}&currentOnly=true`),
      apiFetch("/drivers"),
      apiFetch("/attendants"),
      apiFetch("/routes"),
    ]);

  if (vehicleRes.status === 404) notFound();
  if (!vehicleRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this vehicle</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: vehicle } = (await vehicleRes.json()) as { data: VehicleDetail };
  const documents: VehicleDocument[] = documentsRes.ok ? ((await documentsRes.json()) as { data: VehicleDocument[] }).data : [];
  const maintenance: VehicleMaintenanceRecord[] = maintenanceRes.ok
    ? ((await maintenanceRes.json()) as { data: VehicleMaintenanceRecord[] }).data
    : [];
  const fuelLog: FuelLogEntry[] = fuelLogRes.ok ? ((await fuelLogRes.json()) as { data: FuelLogEntry[] }).data : [];
  const spec: VehicleSpec | null = specRes.ok ? ((await specRes.json()) as { data: VehicleSpec | null }).data : null;
  const gps: GpsStatus | null = gpsRes.ok ? ((await gpsRes.json()) as { data: GpsStatus | null }).data : null;
  const fleet: BusTrackingResult[] = fleetRes.ok ? ((await fleetRes.json()) as { data: BusTrackingResult[] }).data : [];
  const tracking = fleet.find((f) => f.vehicle.id === id) ?? null;
  const assignments: Assignment[] = assignmentsRes.ok ? ((await assignmentsRes.json()) as { data: Assignment[] }).data : [];
  const assignment = assignments[0] ?? null;
  const allDrivers: Driver[] = allDriversRes.ok ? ((await allDriversRes.json()) as { data: Driver[] }).data : [];
  const allAttendants: Attendant[] = allAttendantsRes.ok ? ((await allAttendantsRes.json()) as { data: Attendant[] }).data : [];
  const allRoutes: { id: string; name: string }[] = allRoutesRes.ok ? ((await allRoutesRes.json()) as { data: { id: string; name: string }[] }).data : [];

  const [routeRes, routeStopsRes, driverRes, attendantRes, assignedStudentsRes] = await Promise.all([
    assignment ? apiFetch(`/routes/${assignment.routeId}`) : Promise.resolve(null),
    // GET /routes/:id never inlines stops -- same real bug as buses/page.tsx
    // and transport-kpis.ts had (route.repository.ts's own COLUMNS constant,
    // shared by findMany/findById, has no stops column at all); fetched
    // separately here, same as every other page that needs a route's stops.
    assignment ? apiFetch(`/routes/${assignment.routeId}/stops`) : Promise.resolve(null),
    assignment?.driverId ? apiFetch(`/drivers/${assignment.driverId}`) : Promise.resolve(null),
    assignment?.attendantId ? apiFetch(`/attendants/${assignment.attendantId}`) : Promise.resolve(null),
    assignment ? apiFetch(`/routes/${assignment.routeId}/assigned-students`) : Promise.resolve(null),
  ]);
  const routeBase: Omit<Route, "stops"> | null = routeRes?.ok ? ((await routeRes.json()) as { data: Omit<Route, "stops"> }).data : null;
  const routeStops: RouteStop[] = routeStopsRes?.ok ? ((await routeStopsRes.json()) as { data: RouteStop[] }).data : [];
  const route: Route | null = routeBase ? { ...routeBase, stops: routeStops } : null;
  const driver: Driver | null = driverRes?.ok ? ((await driverRes.json()) as { data: Driver }).data : null;
  const attendant: Attendant | null = attendantRes?.ok ? ((await attendantRes.json()) as { data: Attendant }).data : null;
  const assignedStudents: AssignedStudent[] = assignedStudentsRes?.ok
    ? ((await assignedStudentsRes.json()) as { data: AssignedStudent[] }).data
    : [];
  const activeStudents = assignedStudents.filter((s) => s.status === "ACTIVE");
  const riders = activeStudents.length;
  // Real per-stop boarding count -- grouped from the same real assigned-
  // students list, not a fabricated "5 board" placeholder.
  const boardCountByStopId = new Map<string, number>();
  for (const s of activeStudents) {
    boardCountByStopId.set(s.routeStopId, (boardCountByStopId.get(s.routeStopId) ?? 0) + 1);
  }

  const sortedStops = route ? [...route.stops].sort((a, b) => a.sequenceNo - b.sequenceNo) : [];
  const firstStop = sortedStops[0];
  const lastStop = sortedStops[sortedStops.length - 1];

  const latestMaintenance = maintenance.length > 0 ? [...maintenance].sort((a, b) => (a.performedOn > b.performedOn ? -1 : 1))[0] : null;
  const withOdometerReadings = fuelLog.filter((f) => f.odometerKm !== null).sort((a, b) => (a.filledOn < b.filledOn ? -1 : 1));
  const mileage =
    withOdometerReadings.length >= 2
      ? (withOdometerReadings[withOdometerReadings.length - 1].odometerKm! - withOdometerReadings[0].odometerKm!) /
        withOdometerReadings.slice(1).reduce((sum, f) => sum + Number(f.litres), 0)
      : null;

  const kpis = [
    { label: "Occupancy", value: `${riders}/${vehicle.capacity}`, sub: vehicle.capacity > 0 ? `${Math.round((riders / vehicle.capacity) * 100)}% of capacity` : "—" },
    { label: "Route length", value: route?.distanceKm ? `${route.distanceKm} km` : "—", sub: route ? `${sortedStops.length} stops one way` : "No route assigned" },
    {
      label: "Odometer",
      value: spec?.currentOdometerKm != null ? `${(spec.currentOdometerKm / 1000).toFixed(0)}k km` : "—",
      sub: spec?.nextServiceDueKm != null ? `next service at ${(spec.nextServiceDueKm / 1000).toFixed(0)}k km` : "not tracked yet",
    },
    { label: "Mileage", value: mileage !== null ? mileage.toFixed(1) : "—", sub: "km per litre" },
  ];

  return (
    <div className="mx-auto max-w-[1280px]">
      <BackLink href="/transport-manager/buses" label="All buses" />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-primary" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
            <MaterialIcon name="directions_bus" size={22} />
          </span>
          <div>
            <h1 className="font-mono text-[32px] font-extrabold leading-none tracking-[0.01em] text-text">{vehicle.registrationNo}</h1>
            <p className="mt-1.5 text-[14px] text-text-muted">
              {route ? `${route.name} · ${sortedStops.length} stops` : "No route assigned"}
              {route?.distanceKm ? ` · ${route.distanceKm} km` : ""}
              {firstStop?.scheduledTime && lastStop?.scheduledTime ? ` · departs ${firstStop.scheduledTime} · arrives ${lastStop.scheduledTime}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {(() => {
            const status = busStatus(vehicle.operationalStatus, tracking);
            return (
              <span
                className="flex items-center gap-1.5 rounded-[999px] px-3 py-2 text-[13px] font-semibold"
                style={{ border: `1px solid ${statusColor(status)}33`, color: statusColor(status) }}
              >
                ● {status}
              </span>
            );
          })()}
          <VehicleMasterEditForm
            vehicleId={vehicle.id}
            registrationNo={vehicle.registrationNo}
            model={vehicle.model}
            capacity={vehicle.capacity}
            ownership={vehicle.ownership}
            operationalStatus={vehicle.operationalStatus}
          />
          <RequestActionButton
            action={requestVehicleDeactivateAction.bind(null, vehicle.id)}
            confirmTitle="Request deactivation"
            confirmBody="No hard delete exists for a vehicle in this app -- this requests deactivating it. Nothing changes until Admin approves."
            submitLabel="Request"
            submittedLabel="Deactivation requested"
          >
            <VehicleDeleteTrigger />
          </RequestActionButton>
          <Link href="/transport-manager/live-tracking" className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-hover">
            Live tracking
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">{k.label}</p>
            <p className="mt-2.5 font-mono text-[26px] font-extrabold leading-none text-text">{k.value}</p>
            <p className="mt-2 text-[13px] text-text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-[14px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <section className="relative rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-start justify-between gap-3 pr-24">
            <div>
              <h2 className="text-[17px] font-bold leading-[22px] text-text">Vehicle specification</h2>
              <p className="mt-1 text-[13px] text-text-muted">Registered {formatDate(vehicle.createdAt)}</p>
            </div>
          </div>
          <VehicleSpecPanel
            vehicleId={vehicle.id}
            model={vehicle.model}
            spec={spec}
            capacity={vehicle.capacity}
            ownership={vehicle.ownership}
            gpsLabel={gps ? `${gps.deviceUid} · ${gps.status === "ACTIVE" ? "online" : "offline"}` : null}
            lastServiceDate={latestMaintenance ? formatDate(latestMaintenance.performedOn) : null}
          />
        </section>

        <div className="flex flex-col gap-[14px]">
          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold leading-[22px] text-text">Occupancy</h2>
              <span className="rounded-[999px] px-2.5 py-[5px] text-[12px] font-bold" style={{ background: "var(--color-field)", color: "var(--color-text-secondary)" }}>
                {vehicle.capacity - riders} seats free
              </span>
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-extrabold leading-none text-text">
                {riders}/{vehicle.capacity}
              </span>
              {vehicle.capacity > 0 && <span className="font-mono font-bold text-primary">{Math.round((riders / vehicle.capacity) * 100)}%</span>}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--color-field)" }}>
              <div className="h-full rounded-[var(--radius-pill)]" style={{ width: `${vehicle.capacity > 0 ? Math.min(100, Math.round((riders / vehicle.capacity) * 100)) : 0}%`, background: "var(--color-primary)" }} />
            </div>
            {/* The mockup's own Occupancy card also shows a "Staff" count
                alongside Students -- checked this schema directly
                (information_schema + a search for any staff/faculty
                transport table) and confirmed no real "staff riding this
                bus" concept exists anywhere. Students is the only real
                number, shown alone rather than paired with a fabricated
                Staff figure. */}
            <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Students</p>
              <p className="mt-1 font-mono text-[16px] font-extrabold text-text">{riders}</p>
            </div>
          </section>

          <section className="relative rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between pr-[110px]">
              <h2 className="text-[17px] font-bold leading-[22px] text-text">Crew</h2>
            </div>
            {assignment ? (
              <EditCrewForm
                assignmentId={assignment.id}
                vehicleId={vehicle.id}
                currentDriverId={assignment.driverId}
                currentAttendantId={assignment.attendantId}
                drivers={allDrivers}
                attendants={allAttendants}
              />
            ) : (
              <span className="absolute right-[18px] top-[18px] text-[13px] text-text-muted">No route assigned yet</span>
            )}
            {driver ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-primary" style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
                  {driver.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-text">{driver.fullName}</p>
                  <p className="font-mono text-[13px] text-text-muted">{driver.phone ?? "—"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">No driver assigned.</p>
            )}
            {driver && (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Licence</p>
                  <p className="mt-1 font-mono text-[14px] font-semibold text-text">{driver.licenceNo}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Valid till</p>
                  <p className="mt-1 font-mono text-[14px] font-semibold text-text">{formatDate(driver.licenceExpiry)}</p>
                </div>
              </div>
            )}
            {attendant && (
              <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-field text-[12px] font-bold text-text-muted">
                  {attendant.fullName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-text">{attendant.fullName}</p>
                  <p className="text-[13px] text-text-muted">Bus attendant{attendant.phone ? ` · ${attendant.phone}` : ""}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="mt-[14px] rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Route &amp; stop timings</h2>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-muted">
              {sortedStops.length} stops{route?.distanceKm ? ` · ${route.distanceKm} km` : ""}
            </span>
            {assignment && (
              <EditRouteForm
                assignmentId={assignment.id}
                vehicleId={vehicle.id}
                currentRouteId={assignment.routeId}
                currentDriverId={assignment.driverId}
                currentAttendantId={assignment.attendantId}
                routes={allRoutes}
              />
            )}
            {route && (
              <StopForm
                mode="create"
                routeId={route.id}
                nextSequenceNo={sortedStops.length + 1}
                triggerClassName="rounded-[10px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40"
                triggerLabel="+ Add stop"
              />
            )}
          </div>
        </div>

        {sortedStops.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No stops on this route yet.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-[26px] border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">From</p>
                <p className="text-[19px] font-bold text-text">{firstStop.stopName}</p>
                <p className="text-[13px] text-text-muted">starting point</p>
              </div>
              <span className="text-lg text-text-muted">→</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">To</p>
                <p className="text-[19px] font-bold text-text">School campus</p>
                <p className="text-[13px] text-text-muted">ending point</p>
              </div>
            </div>
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {sortedStops.map((stop) => (
                <li key={stop.id} className="card-hover flex flex-wrap items-center gap-3 rounded-[10px] px-2 py-3">
                  <span className="w-6 shrink-0 font-mono text-[13px] text-text-muted">{String(stop.sequenceNo).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold text-text">{stop.stopName}</span>
                  {stop.scheduledTime && <span className="shrink-0 font-mono text-[13px] font-medium text-primary">{stop.scheduledTime}</span>}
                  <span className="shrink-0 text-[12px] text-text-muted">{boardCountByStopId.get(stop.id) ?? 0} board</span>
                  {route && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <StopForm
                        mode="edit"
                        routeId={route.id}
                        stopId={stop.id}
                        currentStopName={stop.stopName}
                        currentSequenceNo={stop.sequenceNo}
                        currentScheduledTime={stop.scheduledTime}
                        triggerClassName="rounded-[8px] border border-border p-1.5 text-text-muted hover:text-text"
                        triggerLabel={<MaterialIcon name="edit" size={14} />}
                      />
                      <RequestActionButton
                        action={requestRouteStopDeleteAction.bind(null, stop.id, route.id)}
                        confirmTitle="Request stop deletion"
                        confirmBody="This will permanently remove this stop once Admin approves."
                        submitLabel="Request"
                        submittedLabel="Deletion requested"
                      >
                        <button type="button" className="rounded-[8px] p-1.5" style={{ border: "1px solid var(--color-tint-2)", color: "var(--color-navy)" }}>
                          <MaterialIcon name="delete" size={14} />
                        </button>
                      </RequestActionButton>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {route && (
          <div className="card-hover mt-4 flex items-center gap-3 rounded-[11px] bg-field p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-primary" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
              <MaterialIcon name="groups" size={18} />
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text">Stops &amp; students</p>
              <p className="text-[13px] text-text-muted">
                {riders} students across {sortedStops.length} stops
              </p>
            </div>
            <Link href={`/transport-manager/routes/${route.id}`} className="text-[13px] font-semibold text-primary">
              Open →
            </Link>
          </div>
        )}
      </section>

      <div className="mt-[14px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Documents &amp; compliance</h2>
          <p className="mt-1 text-[13px] text-text-muted">Insurance, fitness, permit, PUC and other compliance documents.</p>
          <VehicleDocumentsPanel vehicleId={vehicle.id} documents={documents} />
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Safety &amp; fitment</h2>
          <p className="mt-1 text-[13px] text-text-muted">No real safety-checklist table exists yet in this schema — not shown as fabricated data.</p>
          {latestMaintenance && (
            <p className="mt-3 text-[13px] text-text">
              Most recent work: {latestMaintenance.maintenanceType.replace(/_/g, " ")} on {formatDate(latestMaintenance.performedOn)}
            </p>
          )}
        </section>
      </div>

      <div className="mt-[14px] grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Maintenance history</h2>
          <VehicleMaintenancePanel vehicleId={vehicle.id} records={maintenance} />
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Fuel &amp; mileage log</h2>
          <FuelLogPanel vehicleId={vehicle.id} entries={fuelLog} />
        </section>
      </div>
    </div>
  );
}
