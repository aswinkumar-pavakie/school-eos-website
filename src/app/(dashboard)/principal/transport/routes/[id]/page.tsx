// Principal -> Transport -> Route detail: read-only mirror of Admin's own
// route detail page (Vehicle -> Route -> Driver, and Student -> Route -> Stop
// -> Vehicle). No add/change/cancel controls -- assigning a student to a
// route/stop stays an Admin operational action.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import type { AssignedStudent } from "@/components/transport/RouteAssignedStudents";
import { apiFetch } from "@/lib/api";

interface RouteDetail {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
}

interface RouteStopOption {
  id: string;
  stopName: string;
  sequenceNo: number;
}

interface VehicleRouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/** Mirrors Admin's own route detail page pickCurrentAssignment -- a truly-open
 * row (effectiveTo null) is always the real current one when there is one. */
function pickCurrentAssignment(assignments: VehicleRouteAssignment[]): VehicleRouteAssignment | null {
  if (assignments.length === 0) return null;
  const openEnded = assignments.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : assignments;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

interface Vehicle {
  id: string;
  registrationNo: string;
  model: string | null;
}

interface Driver {
  id: string;
  fullName: string;
}

function studentTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export default async function PrincipalRouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [routeRes, stopsRes, studentsRes, assignmentsRes] = await Promise.all([
    apiFetch(`/routes/${id}`),
    apiFetch(`/routes/${id}/stops`),
    apiFetch(`/routes/${id}/assigned-students`),
    apiFetch(`/vehicle-route-assignments?routeId=${id}&currentOnly=true`),
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
  const stops: RouteStopOption[] = stopsRes.ok ? ((await stopsRes.json()) as { data: RouteStopOption[] }).data : [];
  const students: AssignedStudent[] = studentsRes.ok
    ? ((await studentsRes.json()) as { data: AssignedStudent[] }).data
    : [];
  const assignments: VehicleRouteAssignment[] = assignmentsRes.ok
    ? ((await assignmentsRes.json()) as { data: VehicleRouteAssignment[] }).data
    : [];

  const assignment = pickCurrentAssignment(assignments);
  let vehicle: Vehicle | null = null;
  let driver: Driver | null = null;
  if (assignment) {
    const [vehicleRes, driverRes] = await Promise.all([
      apiFetch(`/vehicles/${assignment.vehicleId}`),
      assignment.driverId ? apiFetch(`/drivers/${assignment.driverId}`) : Promise.resolve(null),
    ]);
    vehicle = vehicleRes.ok ? ((await vehicleRes.json()) as { data: Vehicle }).data : null;
    driver = driverRes?.ok ? ((await driverRes.json()) as { data: Driver }).data : null;
  }

  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/principal/transport" label="Back to Transport" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {route.name} {route.code && <span className="font-mono text-text-muted">· {route.code}</span>}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {route.direction.toLowerCase()}
            {route.distanceKm ? ` · ${route.distanceKm} km` : ""} · {stops.length} stops
          </p>
        </div>
        <StatusPill tone={route.status === "ACTIVE" ? "success" : "pending"} label={route.status} />
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Vehicle &amp; driver</h2>
        <p className="mt-2 text-sm text-text">
          {vehicle ? (
            <>
              <span className="font-semibold">{vehicle.registrationNo}</span>
              {vehicle.model ? ` (${vehicle.model})` : ""}
              {driver && <> · Driver: <span className="font-semibold">{driver.fullName}</span></>}
            </>
          ) : (
            <span className="text-text-muted">No vehicle currently assigned to this route.</span>
          )}
        </p>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Stops</h2>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {sortedStops.length === 0 && <li className="py-3 text-sm text-text-muted">No stops yet.</li>}
          {sortedStops.map((stop) => (
            <li key={stop.id} className="flex items-center justify-between py-2 text-[13px]">
              <span className="text-text">
                {stop.sequenceNo}. {stop.stopName}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Assigned students</h2>
        <p className="mt-1 text-[13px] text-text-muted">Who is riding this route, and at which stop.</p>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {students.length === 0 && <li className="py-3 text-sm text-text-muted">No students assigned to this route.</li>}
          {students.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
              <div>
                <p className="font-semibold text-text">
                  {s.studentFirstName} {s.studentLastName ?? ""}
                </p>
                <p className="text-xs text-text-muted">
                  {s.admissionNo} · {s.stopName} · {s.direction.toLowerCase()}
                </p>
              </div>
              <StatusPill tone={studentTone(s.status)} label={s.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
