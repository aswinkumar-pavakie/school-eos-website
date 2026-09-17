// Principal/Vice Principal Route detail -- the shared, pixel-identical body
// for both roles' read-only oversight page (per the SIS mockup's Route
// detail screen). Pure/presentational: takes every real field already
// fetched server-side by the thin page.tsx wrapper, renders no
// create/edit/delete affordance anywhere (not even disabled) -- these two
// roles are cleanly read-only, matching the mockup which shows no edit icons
// on this view at all.
//
// Two fields the mockup shows that have no real backing data anywhere in
// this schema, confirmed via live schema checks, are shown honestly rather
// than fabricated:
//  - "Term fee" -- no real per-route/per-vehicle fee column exists -- shown
//    as "Not tracked", the same label Transport Manager's own screens use.
//  - "Safety & fitment" (first-aid box/fire extinguisher/etc. checklist) --
//    no such table exists (checked information_schema for any
//    safety/fitment/inspection/checklist/fitness_check table) -- the section
//    is honestly omitted rather than shown with invented statuses.
// "Mileage" is real, computed from consecutive real fuel-log odometer
// readings (distance covered / litres used for that fill), not fabricated.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { VehicleSpecFields, type VehicleSpec } from "@/components/transport/VehicleSpecPanel";
import { formatDate } from "@/lib/format";
import type { AssignedStudent } from "@/components/transport/RouteAssignedStudents";

export interface RouteDetailData {
  id: string;
  name: string;
  code: string | null;
  direction: string;
  distanceKm: string | null;
  status: string;
}
export interface StopRow {
  id: string;
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
export interface VehicleFull {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
  createdAt: string;
}
export interface DriverFull {
  id: string;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  experienceYears: number | null;
  bloodGroup: string | null;
}
export interface AttendantFull {
  id: string;
  fullName: string;
  phone: string | null;
}
export interface DocRow {
  id: string;
  docType: string;
  docNo: string | null;
  validTo: string;
  source: "Vehicle" | "Driver";
}
export interface MaintenanceRow {
  id: string;
  maintenanceType: string;
  performedOn: string;
  odometerKm: number | null;
  vendor: string | null;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function studentTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}
function docTone(validTo: string): "success" | "pending" | "critical" {
  const daysLeft = (new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "critical";
  if (daysLeft < 30) return "pending";
  return "success";
}
function docLabel(validTo: string): string {
  const daysLeft = Math.ceil((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "Expired";
  if (daysLeft < 30) return `Due in ${daysLeft}d`;
  return "Valid";
}

export function TransportOversightRouteDetail({
  basePath,
  route,
  stops,
  students,
  vehicle,
  vehicleSpec,
  gpsLabel,
  driver,
  attendant,
  docs,
  latestOdometerKm,
  lastServiceDate,
  mileageKmPerLitre,
}: {
  basePath: string;
  route: RouteDetailData;
  stops: StopRow[];
  students: AssignedStudent[];
  vehicle: VehicleFull | null;
  vehicleSpec: VehicleSpec | null;
  gpsLabel: string | null;
  driver: DriverFull | null;
  attendant: AttendantFull | null;
  docs: DocRow[];
  latestOdometerKm: number | null;
  lastServiceDate: string | null;
  mileageKmPerLitre: number | null;
}) {
  const sortedStops = [...stops].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentsByStop = new Map<string, AssignedStudent[]>();
  for (const s of activeStudents) {
    const list = studentsByStop.get(s.stopName) ?? [];
    list.push(s);
    studentsByStop.set(s.stopName, list);
  }

  const capacity = vehicle?.capacity ?? 0;
  const occPct = capacity > 0 ? Math.round((activeStudents.length / capacity) * 100) : 0;
  const staffCount = (driver ? 1 : 0) + (attendant ? 1 : 0);
  const seatsFree = Math.max(0, capacity - activeStudents.length);

  const firstStop = sortedStops[0]?.stopName ?? null;
  const lastStop = sortedStops.length > 1 ? sortedStops[sortedStops.length - 1].stopName : null;
  const areaCovered = firstStop && lastStop ? `${firstStop} – ${lastStop}` : "—";
  const pickupWindow =
    sortedStops.length > 0 && sortedStops[0].scheduledTime && sortedStops[sortedStops.length - 1].scheduledTime
      ? `${sortedStops[0].scheduledTime} – ${sortedStops[sortedStops.length - 1].scheduledTime}`
      : "—";

  return (
    <div className="mx-auto max-w-[1024px]">
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-text-muted hover:text-text">
        ← All routes
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-[18px]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-2xl">🚌</span>
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <h1 className="font-mono text-[34px] font-bold leading-none tracking-[0.01em] text-text">
            {vehicle ? vehicle.registrationNo : route.name}
          </h1>
          <p className="text-[15px] text-text-muted">
            {route.code ?? route.name} · {stops.length} stops
            {route.distanceKm ? ` · ${route.distanceKm} km` : ""}
            {sortedStops[0]?.scheduledTime ? ` · departs ${sortedStops[0].scheduledTime}` : ""}
            {sortedStops[sortedStops.length - 1]?.scheduledTime ? ` · arrives ${sortedStops[sortedStops.length - 1].scheduledTime}` : ""}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-[999px] border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text">
          <span className={`h-[9px] w-[9px] rounded-full ${route.status === "ACTIVE" ? "bg-primary" : "bg-text-muted"}`} />
          {route.status === "ACTIVE" ? "On route" : route.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Occupancy", value: `${occPct}%`, unit: `${activeStudents.length}/${capacity}` },
          { label: "Route length", value: route.distanceKm ?? "—", unit: route.distanceKm ? "km" : undefined },
          { label: "Odometer", value: latestOdometerKm != null ? latestOdometerKm.toLocaleString("en-IN") : "—", unit: latestOdometerKm != null ? "km" : undefined },
          { label: "Mileage", value: mileageKmPerLitre != null ? mileageKmPerLitre.toFixed(1) : "—", unit: mileageKmPerLitre != null ? "km/l" : undefined },
          { label: "Term fee", value: "Not tracked", unit: undefined },
        ].map((tile) => (
          <div key={tile.label} className="card-hover flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">{tile.label}</p>
            <p className="flex items-baseline gap-2 font-mono text-[26px] font-bold leading-none tracking-[-0.02em] text-text">
              {tile.value}
              {tile.unit && <span className="text-sm font-sans font-normal text-text-muted">{tile.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <section className="relative rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Vehicle specification</h2>
          {vehicle ? (
            <>
              <p className="mt-1 text-[13px] text-text-muted">Registered {formatDate(vehicle.createdAt)}</p>
              <VehicleSpecFields
                model={vehicle.model}
                spec={vehicleSpec}
                capacity={vehicle.capacity}
                ownership={vehicle.ownership}
                gpsLabel={gpsLabel}
                lastServiceDate={lastServiceDate}
              />
            </>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No vehicle currently assigned to this route.</p>
          )}
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Occupancy</h2>
          <div className="mt-4 flex items-center justify-between">
            <p className="flex items-baseline gap-2 font-mono text-[30px] font-bold leading-none tracking-[-0.02em] text-text">
              {activeStudents.length}
              <span className="text-sm font-sans font-normal text-text-muted">/ {capacity} seats</span>
            </p>
            <span className="rounded-[999px] px-[9px] py-[3px] text-[11.5px] font-bold" style={{ background: "#EFF4FF", color: "#1E3A8A" }}>
              {seatsFree} free
            </span>
          </div>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full" style={{ background: "#EEF2F7" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, occPct))}%`, background: "var(--color-primary)" }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-[18px]">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Students</span>
              <span className="font-mono text-[18px] font-semibold text-text">{activeStudents.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">Staff</span>
              <span className="font-mono text-[18px] font-semibold text-text">{staffCount}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Route &amp; stop timings</h2>
          {sortedStops.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No stops yet.</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-[26px] border-b border-border pb-5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">From</span>
                  <span className="text-[20px] font-bold tracking-[-0.02em] text-text">{sortedStops[0].stopName}</span>
                </div>
                <span className="text-xl text-text-muted">→</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">To</span>
                  <span className="text-[20px] font-bold tracking-[-0.02em] text-text">{sortedStops[sortedStops.length - 1].stopName}</span>
                </div>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {sortedStops.map((stop, i) => (
                  <li key={stop.id} className="card-hover flex items-center gap-4 rounded-[12px] px-3 py-[15px]">
                    <span className="w-[26px] shrink-0 font-mono text-[13px] text-text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[16px] font-semibold text-text">{stop.stopName}</span>
                    {stop.scheduledTime && <span className="shrink-0 font-mono text-[14px] font-medium text-primary">{stop.scheduledTime}</span>}
                    <span className="w-[74px] shrink-0 text-right text-[13px] text-text-muted">
                      {(studentsByStop.get(stop.stopName) ?? []).length} board
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Crew</h2>
          <div className="mt-4 flex flex-col gap-[18px]">
            {driver ? (
              <>
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary-deep">
                    {initialsOf(driver.fullName)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[18px] font-semibold tracking-[-0.01em] text-text">{driver.fullName}</span>
                    <span className="font-mono text-[13px] text-text-muted">{driver.phone ?? "—"}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-[18px] sm:grid-cols-4">
                  {[
                    ["Licence no", driver.licenceNo],
                    ["Valid till", formatDate(driver.licenceExpiry)],
                    ["Experience", driver.experienceYears != null ? `${driver.experienceYears} yrs` : "—"],
                    ["Blood group", driver.bloodGroup ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">{label}</span>
                      <span className="font-mono text-[15px] font-medium text-text">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted">No driver assigned.</p>
            )}
            {attendant && (
              <div className="flex items-center gap-3.5 border-t border-border pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-field text-[12px] font-semibold text-text-muted">
                  {initialsOf(attendant.fullName)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[16px] font-semibold text-text">{attendant.fullName}</span>
                  <span className="text-[13px] text-text-muted">Bus attendant{attendant.phone ? ` · ${attendant.phone}` : ""}</span>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Stops &amp; students</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            {activeStudents.length} students across {studentsByStop.size} stops
          </p>
          {activeStudents.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No students assigned to this route.</p>
          ) : (
            <div className="flex flex-col">
              {sortedStops
                .filter((stop) => (studentsByStop.get(stop.stopName) ?? []).length > 0)
                .map((stop, i) => {
                  const group = studentsByStop.get(stop.stopName) ?? [];
                  return (
                    <div key={stop.id} className="flex flex-col gap-3.5 border-t border-border py-[18px] first:border-t-0">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary/10 font-mono text-[13px] text-primary-deep">
                          {i + 1}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[16px] font-semibold tracking-[-0.01em] text-text">{stop.stopName}</span>
                          <span className="text-[13px] text-text-muted">
                            {stop.scheduledTime ? `pickup ${stop.scheduledTime} · ` : ""}
                            {group.length} student{group.length === 1 ? "" : "s"} board here
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {group.map((s) => (
                          <div key={s.id} className="flex min-w-0 items-center gap-[11px] rounded-[10px] bg-field px-[13px] py-[11px]">
                            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary-deep">
                              {`${s.studentFirstName[0] ?? ""}${(s.studentLastName ?? "")[0] ?? ""}`.toUpperCase()}
                            </span>
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold text-text">
                                {s.studentFirstName} {s.studentLastName ?? ""}
                              </span>
                              <span className="font-mono text-xs text-text-muted">
                                {s.gradeName ? `${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""} · ` : ""}
                                {s.admissionNo}
                              </span>
                            </span>
                            {s.status !== "ACTIVE" && (
                              <span className="ml-auto shrink-0">
                                <StatusPill tone={studentTone(s.status)} label={s.status} />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-[18px]">
          <section className="rounded-[16px] border border-border bg-surface p-[22px]">
            <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Documents &amp; compliance</h2>
            {docs.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">No documents on file.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {docs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                    <div>
                      <p className="font-semibold text-text">
                        {d.source} · {d.docType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-text-muted">{d.docNo ?? "—"} · valid till {formatDate(d.validTo)}</p>
                    </div>
                    <StatusPill tone={docTone(d.validTo)} label={docLabel(d.validTo)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[16px] border border-border bg-surface p-[22px]">
            <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Safety &amp; fitment</h2>
            <p className="mt-2 text-sm text-text-muted">
              No safety/fitment checklist is tracked in the system yet — not recorded, not shown here as a placeholder.
            </p>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <section className="rounded-[16px] border border-border bg-surface p-[22px]">
          <h2 className="text-[19px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Route card</h2>
          <div className="mt-4 grid grid-cols-2 gap-[18px] sm:grid-cols-3">
            {[
              ["Area covered", areaCovered],
              ["Pickup window", pickupWindow],
              ["Driver phone", driver?.phone ?? "—"],
              ["Licence", driver?.licenceNo ?? "—"],
              ["Seating capacity", capacity ? `${capacity} seats` : "—"],
              ["Term fee", "Not tracked"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-text-muted">{label}</span>
                <span className="text-[15px] font-semibold text-text">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
