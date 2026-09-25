// Stops & students -- the mockup's own "showStops" screen (Transport
// Module.dc.html), reached from a bus detail page's "Stops & students" row.
// One card per stop: the stop's own header (serial box, name, real pickup
// time + real boarding count) plus a chip grid of the students who board
// there. Real student_transport_allocation data throughout.
//
// Add/Edit/Delete stop are now real (`POST /routes/:id/stops`,
// `PATCH /route-stops/:stopId` grant TRANSPORT_MANAGER; delete goes through
// the real request-delete/Admin-approval flow -- explicit product decision
// this session). Per-student "Edit" (move to a different real stop on this
// route) is real too (`PATCH /student-transport-allocations/:id`);
// "Remove" is the real request-cancel/Admin-approval flow. "+ Add student"
// stays disabled -- creating a NEW allocation needs a real student search/
// picker, and TRANSPORT_MANAGER has no accessible student-search endpoint
// anywhere in this backend (checked students.controller.ts directly:
// ADMIN/PRINCIPAL only) -- a real gap, not something faked here.

import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { MaterialIcon } from "@/components/transport/MaterialIcon";
import { StopForm } from "@/components/transport/StopForm";
import { RequestActionButton } from "@/components/transport/RequestActionButton";
import { StudentAllocationMoveForm } from "@/components/transport/StudentAllocationMoveForm";
import { requestRouteStopDeleteAction, requestStudentAllocationCancelAction } from "@/app/(dashboard)/transport-manager/actions";
import { apiFetch } from "@/lib/api";

interface RouteDetail {
  id: string;
  name: string;
  code: string | null;
  distanceKm: string | null;
}
interface RouteStop {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
interface AssignedStudent {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName?: string | null;
  sectionName?: string | null;
  routeStopId: string;
  direction: string;
  status: string;
}
interface VehicleRouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}
interface Vehicle {
  id: string;
  registrationNo: string;
}

function pickCurrentAssignment(assignments: VehicleRouteAssignment[]): VehicleRouteAssignment | null {
  if (assignments.length === 0) return null;
  const openEnded = assignments.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : assignments;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}
function initialsOf(first: string, last: string | null): string {
  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export default async function TransportManagerStopsAndStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [routeRes, stopsRes, studentsRes, assignmentsRes] = await Promise.all([
    apiFetch(`/routes/${id}`),
    apiFetch(`/routes/${id}/stops`),
    apiFetch(`/routes/${id}/assigned-students`),
    apiFetch(`/vehicle-route-assignments?routeId=${id}&currentOnly=true`),
  ]);

  if (!routeRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Couldn&apos;t load this route</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: route }: { data: RouteDetail } = await routeRes.json();
  const stops: RouteStop[] = stopsRes.ok ? (await stopsRes.json()).data : [];
  const students: AssignedStudent[] = studentsRes.ok ? (await studentsRes.json()).data : [];
  const assignments: VehicleRouteAssignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];

  const assignment = pickCurrentAssignment(assignments);
  const vehicle: Vehicle | null = assignment
    ? await apiFetch(`/vehicles/${assignment.vehicleId}`).then((r) => (r.ok ? r.json().then((j) => j.data) : null))
    : null;

  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  // Each real rider has TWO allocation rows here (PICKUP + DROP, a different
  // stop per direction) -- correct to keep per-row for the per-stop grouping
  // below, but the header count needs distinct students, not rows.
  const riderCount = new Set(activeStudents.map((s) => s.studentId)).size;
  const studentsByStop = new Map<string, AssignedStudent[]>();
  for (const s of activeStudents) {
    const list = studentsByStop.get(s.routeStopId) ?? [];
    list.push(s);
    studentsByStop.set(s.routeStopId, list);
  }

  const backHref = vehicle ? `/transport-manager/buses/${vehicle.id}` : "/transport-manager/routes";
  const backLabel = vehicle ? vehicle.registrationNo : "Routes";

  return (
    <div className="mx-auto max-w-[1280px]">
      <BackLink href={backHref} label={backLabel} />

      <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-text">Stops &amp; students</h1>
          <p className="mt-1.5 text-[15px] text-text-muted">
            {vehicle ? `${vehicle.registrationNo} · ` : ""}
            {route.name}
            {route.code ? ` (${route.code})` : ""} · {riderCount} students across {sortedStops.length} stops
          </p>
        </div>
        <StopForm
          mode="create"
          routeId={route.id}
          nextSequenceNo={sortedStops.length + 1}
          triggerClassName="whitespace-nowrap rounded-[10px] bg-primary px-[18px] py-[11px] text-[14px] font-bold text-white hover:bg-primary-deep"
          triggerLabel="+ Add stop"
        />
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface">
        {sortedStops.length === 0 && <p className="p-8 text-center text-sm text-text-muted">No stops on this route yet.</p>}
        {sortedStops.map((stop, i) => {
          const stopStudents = studentsByStop.get(stop.id) ?? [];
          return (
            <div key={stop.id} className="card-hover border-b p-[18px_22px] last:border-b-0" style={{ borderColor: "#F1F5F9" }}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] font-mono text-[12.5px] font-semibold text-primary" style={{ background: "#EFF4FF" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-text">{stop.stopName}</p>
                  <p className="mt-0.5 text-[12.5px] text-text-muted">
                    {stop.scheduledTime ? `pickup ${stop.scheduledTime} · ` : ""}
                    {stopStudents.length} students board here
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    title="Adding a NEW student needs a real student search endpoint -- not yet available to Transport Manager (checked: students.controller.ts is ADMIN/PRINCIPAL only)"
                    className="cursor-not-allowed whitespace-nowrap rounded-[9px] px-3 py-[7px] text-[12.5px] font-bold opacity-50"
                    style={{ border: "1px solid #C7D7F5", color: "#1D4ED8" }}
                  >
                    + Add student
                  </span>
                  <StopForm
                    mode="edit"
                    routeId={route.id}
                    stopId={stop.id}
                    currentStopName={stop.stopName}
                    currentSequenceNo={stop.sequenceNo}
                    currentScheduledTime={stop.scheduledTime}
                    triggerClassName="whitespace-nowrap rounded-[9px] border border-[#E2E8F0] px-3 py-[7px] text-[12.5px] font-bold text-[#334155] hover:bg-field"
                    triggerLabel="Edit stop"
                  />
                  <RequestActionButton
                    action={requestRouteStopDeleteAction.bind(null, stop.id, route.id)}
                    confirmTitle="Request stop deletion"
                    confirmBody="This will permanently remove this stop once Admin approves."
                    submitLabel="Request"
                    submittedLabel="Deletion requested"
                  >
                    <button
                      type="button"
                      className="whitespace-nowrap rounded-[9px] px-[11px] py-[7px] text-[12.5px] font-bold"
                      style={{ border: "1px solid #C7D7F5", color: "#1E3A8A" }}
                    >
                      Delete stop
                    </button>
                  </RequestActionButton>
                </div>
              </div>

              {stopStudents.length > 0 && (
                <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
                  {stopStudents.map((s) => (
                    <div key={s.id} className="card-hover flex items-center gap-2.5 rounded-[10px] px-2.5 py-2" style={{ background: "#F6F8FB" }}>
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold" style={{ background: "#EFF4FF", color: "#1E3A8A" }}>
                        {initialsOf(s.studentFirstName, s.studentLastName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-text">
                          {s.studentFirstName} {s.studentLastName ?? ""}
                        </p>
                        <p className="truncate font-mono text-[11.5px] text-text-muted">
                          {s.gradeName ? `${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""} · ` : ""}
                          {s.admissionNo}
                        </p>
                      </div>
                      <StudentAllocationMoveForm
                        allocationId={s.id}
                        routeId={route.id}
                        currentRouteStopId={s.routeStopId}
                        currentDirection={s.direction}
                        stops={sortedStops.map((st) => ({ id: st.id, stopName: st.stopName }))}
                      />
                      <RequestActionButton
                        action={requestStudentAllocationCancelAction.bind(null, s.id, route.id, `${s.studentFirstName} ${s.studentLastName ?? ""}`.trim())}
                        confirmTitle="Request removal"
                        confirmBody={`Remove ${s.studentFirstName} from this route once Admin approves.`}
                        submitLabel="Request"
                        submittedLabel="Requested"
                      >
                        <button type="button" title="Request removal" className="shrink-0" style={{ color: "#94A3B8" }}>
                          <MaterialIcon name="delete" size={14} />
                        </button>
                      </RequestActionButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!vehicle && (
        <p className="mt-3 text-xs text-text-muted">
          No bus is currently assigned to this route — assign one from a bus&apos;s own{" "}
          <Link href="/transport-manager/buses" className="font-semibold text-primary">
            detail page
          </Link>
          .
        </p>
      )}
    </div>
  );
}
