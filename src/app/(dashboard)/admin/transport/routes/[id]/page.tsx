// Route detail -- pixel-matched to the reference design's own route detail
// screen (screenshots 4/6/7/9): header with real status pill + real Edit
// vehicle record; 5-KPI strip (Occupancy/Route length/Odometer/Mileage/Term
// fee); Vehicle specification (real, editable); Occupancy (Students + real
// Staff = crew headcount, not a fabricated "staff rider" concept); Route &
// stop timings (real Edit route/Add stop/per-stop Edit+Delete); Crew (real
// driver+attendant, real Edit crew, real experience_years/blood_group);
// Stops & students (inline per-stop, not a separate sub-page); Documents &
// compliance (real Edit dates + real hard Delete); Safety & fitment (no real
// checklist table exists anywhere in this schema -- confirmed directly, same
// finding transport-manager/buses/[id]/page.tsx already documented); Route
// card summary. Term fee has no real column anywhere in this schema either
// (checked directly) -- shown as "Not tracked" rather than the reference
// design's own "₹9,500", with the field/label still present.
//
// Unlike Transport Manager (whose delete-equivalents route through the
// approvals engine -- no hard-delete grant), Admin has genuine ADMIN-only
// hard-delete on a route stop and a vehicle document, wired directly here via
// admin/transport/actions.ts's own deleteRouteStopAdminAction/
// deleteVehicleDocumentAdminAction -- see vehicles.controller.ts/
// routes.controller.ts's own @Roles('ADMIN') on those two DELETE endpoints.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
import { VehicleSpecPanel, type VehicleSpec } from "@/components/transport/VehicleSpecPanel";
import { VehicleMasterEditForm } from "@/components/transport/VehicleMasterEditForm";
import { EditCrewForm } from "@/components/transport/EditCrewForm";
import { StopForm } from "@/components/transport/StopForm";
import { VehicleDocumentsPanel, type VehicleDocument } from "@/components/transport/VehicleDocumentsPanel";
import { AdminRouteEditForm } from "@/components/transport/admin/AdminRouteEditForm";
import { StopsAndStudentsCard, type AssignedStudent as StopAssignedStudent } from "@/components/transport/admin/StopsAndStudentsCard";
import {
  updateVehicleMasterAdminAction,
  updateVehicleSpecAdminAction,
  updateAssignmentCrewAdminAction,
  createRouteStopAdminAction,
  updateRouteStopAdminAction,
  deleteRouteStopAdminAction,
  deleteVehicleDocumentAdminAction,
  createVehicleDocumentAdminAction,
  updateVehicleDocumentAdminAction,
} from "@/app/(dashboard)/admin/transport/actions";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface RouteDetail {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
}
interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
interface VehicleRouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
  createdAt: string;
}
interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  experienceYears: number | null;
  bloodGroup: string | null;
}
interface Attendant {
  id: string;
  fullName: string;
  phone: string | null;
}
interface AssignedStudent {
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
interface FuelLogEntry {
  filledOn: string;
  odometerKm: number | null;
  litres: string;
}

/** `currentOnly` on the backend is `effective_to IS NULL OR effective_to >= today`,
 * which can match both a just-ended assignment and its same-day replacement.
 * A truly-open row (effectiveTo null) is always the real current one when there is one. */
function pickCurrentAssignment(assignments: VehicleRouteAssignment[]): VehicleRouteAssignment | null {
  if (assignments.length === 0) return null;
  const openEnded = assignments.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : assignments;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [routeRes, stopsRes, studentsRes, assignmentsRes, yearsRes] = await Promise.all([
    apiFetch(`/routes/${id}`),
    apiFetch(`/routes/${id}/stops`),
    apiFetch(`/routes/${id}/assigned-students`),
    apiFetch(`/vehicle-route-assignments?routeId=${id}&currentOnly=true`),
    apiFetch("/academic-years"),
  ]);

  if (routeRes.status === 404) notFound();
  if (!routeRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this route</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: route } = (await routeRes.json()) as { data: RouteDetail };
  const stops: RouteStop[] = stopsRes.ok ? ((await stopsRes.json()) as { data: RouteStop[] }).data : [];
  const students: AssignedStudent[] = studentsRes.ok ? ((await studentsRes.json()) as { data: AssignedStudent[] }).data : [];
  const assignments: VehicleRouteAssignment[] = assignmentsRes.ok
    ? ((await assignmentsRes.json()) as { data: VehicleRouteAssignment[] }).data
    : [];
  const years = yearsRes.ok ? ((await yearsRes.json()) as { data: { id: string; isCurrent: boolean }[] }).data : [];
  const currentYearId = years.find((y) => y.isCurrent)?.id;

  const assignment = pickCurrentAssignment(assignments);

  let vehicle: Vehicle | null = null;
  let spec: VehicleSpec | null = null;
  let documents: VehicleDocument[] = [];
  let gps: { deviceUid: string; status: string } | null = null;
  let maintenance: { performedOn: string; maintenanceType: string }[] = [];
  let fuelLog: FuelLogEntry[] = [];
  let driver: Driver | null = null;
  let attendant: Attendant | null = null;
  let allDrivers: { id: string; fullName: string }[] = [];
  let allAttendants: { id: string; fullName: string }[] = [];

  if (assignment) {
    const [vehicleRes, specRes, documentsRes, gpsRes, maintenanceRes, fuelLogRes, driverRes, attendantRes, driversRes, attendantsRes] =
      await Promise.all([
        apiFetch(`/vehicles/${assignment.vehicleId}`),
        apiFetch(`/vehicles/${assignment.vehicleId}/spec`),
        apiFetch(`/vehicles/${assignment.vehicleId}/documents`),
        apiFetch(`/vehicles/${assignment.vehicleId}/gps-status`),
        apiFetch(`/vehicles/${assignment.vehicleId}/maintenance`),
        apiFetch(`/vehicles/${assignment.vehicleId}/fuel-log`),
        assignment.driverId ? apiFetch(`/drivers/${assignment.driverId}`) : Promise.resolve(null),
        assignment.attendantId ? apiFetch(`/attendants/${assignment.attendantId}`) : Promise.resolve(null),
        apiFetch("/drivers"),
        apiFetch("/attendants"),
      ]);
    vehicle = vehicleRes.ok ? ((await vehicleRes.json()) as { data: Vehicle }).data : null;
    spec = specRes.ok ? ((await specRes.json()) as { data: VehicleSpec | null }).data : null;
    documents = documentsRes.ok ? ((await documentsRes.json()) as { data: VehicleDocument[] }).data : [];
    gps = gpsRes.ok ? ((await gpsRes.json()) as { data: { deviceUid: string; status: string } | null }).data : null;
    maintenance = maintenanceRes.ok
      ? ((await maintenanceRes.json()) as { data: { performedOn: string; maintenanceType: string }[] }).data
      : [];
    fuelLog = fuelLogRes.ok ? ((await fuelLogRes.json()) as { data: FuelLogEntry[] }).data : [];
    driver = driverRes?.ok ? ((await driverRes.json()) as { data: Driver }).data : null;
    attendant = attendantRes?.ok ? ((await attendantRes.json()) as { data: Attendant }).data : null;
    allDrivers = driversRes.ok ? ((await driversRes.json()) as { data: { id: string; fullName: string }[] }).data : [];
    allAttendants = attendantsRes.ok ? ((await attendantsRes.json()) as { data: { id: string; fullName: string }[] }).data : [];
  }

  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const firstStop = sortedStops[0];
  const lastStop = sortedStops[sortedStops.length - 1];

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const riders = activeStudents.length;
  const boardCountByStopId = new Map<string, number>();
  for (const s of activeStudents) boardCountByStopId.set(s.routeStopId, (boardCountByStopId.get(s.routeStopId) ?? 0) + 1);

  const crewCount = (assignment?.driverId ? 1 : 0) + (assignment?.attendantId ? 1 : 0);

  const latestMaintenance = maintenance.length > 0 ? [...maintenance].sort((a, b) => (a.performedOn > b.performedOn ? -1 : 1))[0] : null;
  const withOdometerReadings = fuelLog.filter((f) => f.odometerKm !== null).sort((a, b) => (a.filledOn < b.filledOn ? -1 : 1));
  const mileage =
    withOdometerReadings.length >= 2
      ? (withOdometerReadings[withOdometerReadings.length - 1].odometerKm! - withOdometerReadings[0].odometerKm!) /
        withOdometerReadings.slice(1).reduce((sum, f) => sum + Number(f.litres), 0)
      : null;

  const kpis = [
    {
      label: "Occupancy",
      value: vehicle ? `${riders}/${vehicle.capacity}` : "—",
      sub: vehicle && vehicle.capacity > 0 ? `${Math.round((riders / vehicle.capacity) * 100)}% of capacity` : "—",
      pct: vehicle && vehicle.capacity > 0 ? Math.round((riders / vehicle.capacity) * 100) : null,
    },
    { label: "Route length", value: route.distanceKm ? `${route.distanceKm} km` : "—", sub: `${sortedStops.length} stops one way`, pct: null },
    {
      label: "Odometer",
      value: spec?.currentOdometerKm != null ? `${(spec.currentOdometerKm / 1000).toFixed(0)}k km` : "—",
      sub: spec?.nextServiceDueKm != null ? `next service at ${(spec.nextServiceDueKm / 1000).toFixed(0)}k km` : "not tracked yet",
      pct: null,
    },
    { label: "Mileage", value: mileage !== null ? mileage.toFixed(1) : "—", sub: "km per litre, 30 day average", pct: null },
    { label: "Term fee", value: "Not tracked", sub: "no real term-fee column in this schema", pct: null },
  ];

  return (
    <div className="mx-auto max-w-[1280px]">
      <BackLink href="/admin/transport" label="All routes" />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-primary"
            style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}
          >
            <MaterialIcon name="directions_bus" size={22} />
          </span>
          <div>
            <h1 className="font-mono text-[32px] font-extrabold leading-none tracking-[0.01em] text-text">
              {vehicle ? vehicle.registrationNo : route.name}
            </h1>
            <p className="mt-1.5 text-[14px] text-text-muted">
              {route.name}
              {route.code ? ` · ${route.code}` : ""} · {sortedStops.length} stops
              {route.distanceKm ? ` · ${route.distanceKm} km` : ""}
              {firstStop?.scheduledTime && lastStop?.scheduledTime ? ` · departs ${firstStop.scheduledTime} · arrives ${lastStop.scheduledTime}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill tone={route.status === "ACTIVE" ? "success" : "pending"} label={route.status} />
          {vehicle && (
            <VehicleMasterEditForm
              vehicleId={vehicle.id}
              registrationNo={vehicle.registrationNo}
              model={vehicle.model}
              capacity={vehicle.capacity}
              ownership={vehicle.ownership}
              operationalStatus={vehicle.operationalStatus}
              action={(vehicleId, prev, formData) => updateVehicleMasterAdminAction(vehicleId, route.id, prev, formData)}
            />
          )}
          <AdminRouteEditForm
            routeId={route.id}
            name={route.name}
            code={route.code}
            direction={route.direction}
            distanceKm={route.distanceKm}
            status={route.status}
            triggerClassName="rounded-[10px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:border-primary/40"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-5">
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
              <p className="mt-1 text-[13px] text-text-muted">{vehicle ? `Registered ${formatDate(vehicle.createdAt)}` : "No vehicle assigned to this route yet."}</p>
            </div>
          </div>
          {vehicle && (
            <VehicleSpecPanel
              vehicleId={vehicle.id}
              model={vehicle.model}
              spec={spec}
              capacity={vehicle.capacity}
              ownership={vehicle.ownership}
              gpsLabel={gps ? `${gps.deviceUid} · ${gps.status === "ACTIVE" ? "online" : "offline"}` : null}
              lastServiceDate={latestMaintenance ? formatDate(latestMaintenance.performedOn) : null}
              updateAction={(vehicleId, prev, formData) => updateVehicleSpecAdminAction(vehicleId, route.id, prev, formData)}
            />
          )}
        </section>

        <div className="flex flex-col gap-[14px]">
          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold leading-[22px] text-text">Occupancy</h2>
              {vehicle && (
                <span className="rounded-[999px] px-2.5 py-[5px] text-[12px] font-bold" style={{ background: "var(--color-field)", color: "var(--color-text-secondary)" }}>
                  {vehicle.capacity - riders} seats free
                </span>
              )}
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-[32px] font-extrabold leading-none text-text">{vehicle ? `${riders}/${vehicle.capacity}` : riders}</span>
              {vehicle && vehicle.capacity > 0 && (
                <span className="font-mono font-bold text-primary">{Math.round((riders / vehicle.capacity) * 100)}%</span>
              )}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--color-field)" }}>
              <div
                className="h-full rounded-[var(--radius-pill)]"
                style={{
                  width: `${vehicle && vehicle.capacity > 0 ? Math.min(100, Math.round((riders / vehicle.capacity) * 100)) : 0}%`,
                  background: "var(--color-primary)",
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Students</p>
                <p className="mt-1 font-mono text-[16px] font-extrabold text-text">{riders}</p>
                <p className="text-[12px] text-text-muted">boarding across {sortedStops.length} stops</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Staff</p>
                <p className="mt-1 font-mono text-[16px] font-extrabold text-text">{crewCount}</p>
                <p className="text-[12px] text-text-muted">driver and attendant</p>
              </div>
            </div>
          </section>

          <section className="relative rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between pr-[110px]">
              <h2 className="text-[17px] font-bold leading-[22px] text-text">Crew</h2>
            </div>
            {assignment && vehicle ? (
              <EditCrewForm
                assignmentId={assignment.id}
                vehicleId={vehicle.id}
                currentDriverId={assignment.driverId}
                currentAttendantId={assignment.attendantId}
                drivers={allDrivers}
                attendants={allAttendants}
                action={(assignmentId, vehicleId, prev, formData) => updateAssignmentCrewAdminAction(assignmentId, vehicleId, route.id, prev, formData)}
              />
            ) : (
              <span className="absolute right-[18px] top-[18px] text-[13px] text-text-muted">No vehicle assigned yet</span>
            )}
            {driver ? (
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-primary"
                  style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
                >
                  {initialsOf(driver.fullName)}
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
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Experience</p>
                  <p className="mt-1 font-mono text-[14px] font-semibold text-text">{driver.experienceYears != null ? `${driver.experienceYears} yrs` : "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Blood group</p>
                  <p className="mt-1 font-mono text-[14px] font-semibold text-text">{driver.bloodGroup ?? "—"}</p>
                </div>
              </div>
            )}
            {attendant && (
              <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-field text-[12px] font-bold text-text-muted">
                  {initialsOf(attendant.fullName)}
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
              {sortedStops.length} stops{route.distanceKm ? ` · ${route.distanceKm} km` : ""}
            </span>
            <StopForm
              mode="create"
              routeId={route.id}
              nextSequenceNo={sortedStops.length + 1}
              triggerClassName="rounded-[10px] border border-border px-3.5 py-1.5 text-[13px] font-semibold text-text hover:border-primary/40"
              triggerLabel="+ Add stop"
              createAction={createRouteStopAdminAction}
            />
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
                <li key={stop.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-6 shrink-0 font-mono text-[13px] text-text-muted">{String(stop.sequenceNo).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold text-text">{stop.stopName}</span>
                  {stop.scheduledTime && <span className="shrink-0 font-mono text-[13px] font-medium text-primary">{stop.scheduledTime}</span>}
                  <span className="shrink-0 text-[12px] text-text-muted">{boardCountByStopId.get(stop.id) ?? 0} board</span>
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
                      updateAction={updateRouteStopAdminAction}
                    />
                    <form action={deleteRouteStopAdminAction.bind(null, stop.id, route.id)}>
                      <button type="submit" className="rounded-[8px] p-1.5" style={{ border: "1px solid var(--color-tint-2)", color: "var(--color-navy)" }}>
                        <MaterialIcon name="delete" size={14} />
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-[14px]">
        <StopsAndStudentsCard
          routeId={route.id}
          academicYearId={currentYearId}
          stops={sortedStops}
          students={students as StopAssignedStudent[]}
        />
      </div>

      <div className="mt-[14px] flex flex-col gap-[14px]">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[17px] font-bold leading-[22px] text-text">Documents &amp; compliance</h2>
          <p className="mt-1 text-[13px] text-text-muted">Insurance, fitness, permit, PUC and other compliance documents.</p>
          {vehicle ? (
            <VehicleDocumentsPanel
              vehicleId={vehicle.id}
              documents={documents}
              createAction={(vehicleId, prev, formData) => createVehicleDocumentAdminAction(vehicleId, prev, formData)}
              updateAction={(vehicleId, documentId, prev, formData) => updateVehicleDocumentAdminAction(vehicleId, documentId, prev, formData)}
              deleteAction={(documentId) => deleteVehicleDocumentAdminAction(documentId, route.id)}
            />
          ) : (
            <p className="mt-3 text-sm text-text-muted">No vehicle assigned to this route yet.</p>
          )}
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

      <section className="mt-[14px] rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[17px] font-bold leading-[22px] text-text">Route card</h2>
        <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-3">
          {[
            ["Area covered", firstStop && lastStop ? `${firstStop.stopName} → ${lastStop.stopName}` : "—"],
            ["Pickup window", firstStop?.scheduledTime && lastStop?.scheduledTime ? `${firstStop.scheduledTime} – ${lastStop.scheduledTime}` : "—"],
            ["Driver phone", driver?.phone ?? "—"],
            ["Licence", driver?.licenceNo ?? "—"],
            ["Seating capacity", vehicle ? String(vehicle.capacity) : "—"],
            ["Term fee", "Not tracked"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
                {label}
              </span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {vehicle === null && (
        <p className="mt-4 text-xs text-text-muted">
          No vehicle is currently assigned to this route — vehicle specification, crew and documents will show here once one is.
        </p>
      )}
    </div>
  );
}
