// Principal -> Transport -> Route detail: read-only oversight (Vehicle ->
// Route -> Driver, and Student -> Route -> Stop -> Vehicle). No add/change/
// cancel controls anywhere -- assigning a student to a route/stop, editing
// vehicle specs, or crew changes all stay Admin/Transport Manager actions.
//
// Rebuilt to pixel-match the SIS Principal mockup's Route detail screen via
// TransportOversightRouteDetail, the exact same shared component Vice
// Principal's own route detail page renders -- see that component's own
// comment for the two fields (Term fee, Safety & fitment) honestly shown as
// not tracked/not recorded rather than fabricated to match the mockup.

import { notFound } from "next/navigation";
import {
  TransportOversightRouteDetail,
  type RouteDetailData,
  type StopRow,
  type VehicleFull,
  type DriverFull,
  type AttendantFull,
  type DocRow,
  type MaintenanceRow,
} from "@/components/transport/TransportOversightRouteDetail";
import type { VehicleSpec } from "@/components/transport/VehicleSpecPanel";
import type { AssignedStudent } from "@/components/transport/RouteAssignedStudents";
import { apiFetch } from "@/lib/api";

interface VehicleRouteAssignment {
  id: string;
  vehicleId: string;
  routeId: string;
  driverId: string | null;
  attendantId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
}
interface FuelLogEntry {
  id: string;
  filledOn: string;
  litres: string | number;
  odometerKm: number | null;
}
interface GpsStatus {
  deviceUid: string;
  status: string;
}

function pickCurrentAssignment(assignments: VehicleRouteAssignment[]): VehicleRouteAssignment | null {
  if (assignments.length === 0) return null;
  const openEnded = assignments.filter((a) => !a.effectiveTo);
  const pool = openEnded.length > 0 ? openEnded : assignments;
  return pool.reduce((latest, a) => (a.effectiveFrom > latest.effectiveFrom ? a : latest));
}

/** Real mileage from consecutive real fuel-log odometer readings -- distance
 * covered between two fill-ups divided by the litres used to cover it,
 * averaged across every such pair. Not fabricated: every input is a real
 * `vehicle_fuel_log` row. Returns null (shown as "—") if there isn't at
 * least one usable consecutive pair with both odometer readings recorded. */
function computeMileage(entries: FuelLogEntry[]): number | null {
  const withOdo = [...entries].filter((e) => e.odometerKm != null).sort((a, b) => (a.filledOn < b.filledOn ? -1 : 1));
  if (withOdo.length < 2) return null;
  let totalKm = 0;
  let totalLitres = 0;
  for (let i = 1; i < withOdo.length; i++) {
    const km = (withOdo[i].odometerKm as number) - (withOdo[i - 1].odometerKm as number);
    const litres = Number(withOdo[i].litres);
    if (km > 0 && litres > 0) {
      totalKm += km;
      totalLitres += litres;
    }
  }
  return totalLitres > 0 ? totalKm / totalLitres : null;
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

  const { data: route }: { data: RouteDetailData } = await routeRes.json();
  const stops: StopRow[] = stopsRes.ok ? (await stopsRes.json()).data : [];
  const students: AssignedStudent[] = studentsRes.ok ? (await studentsRes.json()).data : [];
  const assignments: VehicleRouteAssignment[] = assignmentsRes.ok ? (await assignmentsRes.json()).data : [];
  const assignment = pickCurrentAssignment(assignments);

  let vehicle: VehicleFull | null = null;
  let vehicleSpec: VehicleSpec | null = null;
  let gpsLabel: string | null = null;
  let driver: DriverFull | null = null;
  let attendant: AttendantFull | null = null;
  let docs: DocRow[] = [];
  let latestOdometerKm: number | null = null;
  let lastServiceDate: string | null = null;
  let mileageKmPerLitre: number | null = null;

  if (assignment) {
    const [vehicleRes, specRes, gpsRes, driverRes, attendantRes, vehicleDocsRes, driverDocsRes, maintenanceRes, fuelLogRes] = await Promise.all([
      apiFetch(`/vehicles/${assignment.vehicleId}`),
      apiFetch(`/vehicles/${assignment.vehicleId}/spec`),
      apiFetch(`/vehicles/${assignment.vehicleId}/gps-status`),
      assignment.driverId ? apiFetch(`/drivers/${assignment.driverId}`) : Promise.resolve(null),
      assignment.attendantId ? apiFetch(`/attendants/${assignment.attendantId}`) : Promise.resolve(null),
      apiFetch(`/vehicles/${assignment.vehicleId}/documents`),
      assignment.driverId ? apiFetch(`/drivers/${assignment.driverId}/documents`) : Promise.resolve(null),
      apiFetch(`/vehicles/${assignment.vehicleId}/maintenance`),
      apiFetch(`/vehicles/${assignment.vehicleId}/fuel-log`),
    ]);

    vehicle = vehicleRes.ok ? (await vehicleRes.json()).data : null;
    vehicleSpec = specRes.ok ? (await specRes.json()).data : null;
    const gps: GpsStatus | null = gpsRes.ok ? (await gpsRes.json()).data : null;
    gpsLabel = gps ? `${gps.deviceUid} · ${gps.status === "ACTIVE" ? "online" : "offline"}` : null;
    driver = driverRes?.ok ? (await driverRes.json()).data : null;
    attendant = attendantRes?.ok ? (await attendantRes.json()).data : null;

    const vehicleDocs: { id: string; docType: string; docNo: string | null; validTo: string }[] = vehicleDocsRes.ok ? (await vehicleDocsRes.json()).data : [];
    const driverDocs: { id: string; docType: string; docNo: string | null; validTo: string }[] = driverDocsRes?.ok ? (await driverDocsRes.json()).data : [];
    docs = [
      ...vehicleDocs.map((d) => ({ ...d, source: "Vehicle" as const })),
      ...driverDocs.map((d) => ({ ...d, source: "Driver" as const })),
    ];

    const maintenance: MaintenanceRow[] = maintenanceRes.ok ? (await maintenanceRes.json()).data : [];
    const latestService = maintenance.length > 0 ? [...maintenance].sort((a, b) => (a.performedOn > b.performedOn ? -1 : 1))[0] : null;
    latestOdometerKm = latestService?.odometerKm ?? null;
    lastServiceDate = latestService?.performedOn ?? null;

    const fuelLog: FuelLogEntry[] = fuelLogRes.ok ? (await fuelLogRes.json()).data : [];
    mileageKmPerLitre = computeMileage(fuelLog);
  }

  return (
    <TransportOversightRouteDetail
      basePath="/principal/transport"
      route={route}
      stops={stops}
      students={students}
      vehicle={vehicle}
      vehicleSpec={vehicleSpec}
      gpsLabel={gpsLabel}
      driver={driver}
      attendant={attendant}
      docs={docs}
      latestOdometerKm={latestOdometerKm}
      lastServiceDate={lastServiceDate}
      mileageKmPerLitre={mileageKmPerLitre}
    />
  );
}
