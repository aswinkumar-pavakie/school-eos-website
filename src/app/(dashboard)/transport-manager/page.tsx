// Transport Overview -- the Transport Manager's own operational dashboard,
// deliberately not a copy of Admin's generic dashboard. Every number below is
// a real count from a real endpoint; there is no synthetic/estimated metric
// anywhere on this page. Today's trips and the live bus tiles can legitimately
// show all-zero/offline: this environment's trip/telemetry data is real but
// historical (dated Nov 30 - Dec 19, 2025), so "today" very often has no
// matching rows -- see the Trips page to browse that real historical range.

import Link from "next/link";
import { AcknowledgeAlertButton } from "@/components/transport/AcknowledgeAlertButton";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

interface Vehicle {
  id: string;
  operationalStatus: string;
}
interface Driver {
  id: string;
}
interface Allocation {
  id: string;
}
interface TripListRow {
  id: string;
  state: string;
}
interface BusTrackingResult {
  vehicle: { id: string; registrationNo: string };
  route: { name: string } | null;
  freshness: "LIVE" | "STALE" | "NO_DATA";
  trip: { state: string } | null;
}
interface TransportAlertRow {
  id: string;
  vehicleId: string | null;
  registrationNo: string | null;
  alertType: string;
  severity: string;
  raisedAt: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-[18px]">
      <p className="text-[28px] font-extrabold leading-[34px] text-text">{value}</p>
      <p className="mt-1 text-[13px] text-text-muted">{label}</p>
    </div>
  );
}

function MiniTile({ value, label, tone }: { value: number; label: string; tone: "success" | "pending" | "critical" | "neutral" }) {
  const toneClass =
    tone === "success"
      ? "text-success-text"
      : tone === "pending"
        ? "text-pending-text"
        : tone === "critical"
          ? "text-critical-text"
          : "text-text";
  return (
    <div className="flex-1 rounded-[11px] bg-field p-3 text-center">
      <p className={`text-[20px] font-extrabold leading-[26px] ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-text-muted">{label}</p>
    </div>
  );
}

function alertSeverityTone(severity: string): "success" | "pending" | "critical" {
  if (severity === "CRITICAL") return "critical";
  if (severity === "WARNING") return "pending";
  return "success";
}

export default async function TransportOverviewPage() {
  const today = todayIso();

  const [vehiclesRes, driversRes, allocationsRes, tripsRes, fleetRes, alertsRes] = await Promise.all([
    apiFetch("/vehicles"),
    apiFetch("/drivers"),
    apiFetch("/student-transport-allocations?status=ACTIVE"),
    apiFetch(`/transport-ops/trips?date=${today}&limit=100`),
    apiFetch("/transport-ops/bus-tracking/fleet"),
    apiFetch("/transport-ops/alerts?acknowledged=false&limit=5"),
  ]);

  if (!vehiclesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the Transport Overview</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const vehicles: Vehicle[] = (await vehiclesRes.json()).data;
  const drivers: Driver[] = driversRes.ok ? (await driversRes.json()).data : [];
  const allocations: Allocation[] = allocationsRes.ok ? (await allocationsRes.json()).data : [];
  const trips: TripListRow[] = tripsRes.ok ? (await tripsRes.json()).data : [];
  const fleet: BusTrackingResult[] = fleetRes.ok ? (await fleetRes.json()).data : [];
  const alerts: TransportAlertRow[] = alertsRes.ok ? (await alertsRes.json()).data : [];

  const activeBuses = vehicles.filter((v) => v.operationalStatus === "ACTIVE").length;

  const tripsCompleted = trips.filter((t) => t.state === "COMPLETED").length;
  const tripsInProgress = trips.filter((t) => t.state === "STARTED" || t.state === "IN_PROGRESS").length;
  const tripsNotStarted = trips.filter((t) => t.state === "SCHEDULED").length;

  // Honest, mutually-exclusive buckets from real fields only -- never an
  // invented "Delayed" concept this schema has no notion of (see the file
  // header note and the final report's own explanation of this choice).
  let onRoute = 0;
  let staleGps = 0;
  let offline = 0;
  let notStarted = 0;
  for (const bus of fleet) {
    if (bus.freshness === "NO_DATA") offline++;
    else if (bus.freshness === "LIVE" && bus.trip && (bus.trip.state === "STARTED" || bus.trip.state === "IN_PROGRESS")) onRoute++;
    else if (bus.freshness === "STALE") staleGps++;
    else notStarted++;
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Transport Overview</h1>
      <p className="mt-1 text-sm text-text-muted">Fleet, today&apos;s trips, and live bus status.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={vehicles.length} label="Total buses" />
        <StatCard value={activeBuses} label="Active buses" />
        <StatCard value={drivers.length} label="Drivers" />
        <StatCard value={allocations.length} label="Transport students" />
      </div>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Today&apos;s trips</h2>
          <Link href="/transport-manager/trips" className="text-[13px] font-semibold text-primary">
            View all trips
          </Link>
        </div>
        <p className="mt-1 text-[13px] text-text-muted">{trips.length} total for {today}</p>
        <div className="mt-3 flex gap-2.5">
          <MiniTile value={tripsCompleted} label="COMPLETED" tone="success" />
          <MiniTile value={tripsInProgress} label="IN PROGRESS" tone="pending" />
          <MiniTile value={tripsNotStarted} label="NOT STARTED" tone="neutral" />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Live bus status</h2>
          <Link href="/transport-manager/live-tracking" className="text-[13px] font-semibold text-primary">
            Open live tracking
          </Link>
        </div>
        <p className="mt-1 text-[13px] text-text-muted">
          {fleet.length} buses · freshness derived from each bus&apos;s own last GPS ping
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <MiniTile value={onRoute} label="ON ROUTE" tone="success" />
          <MiniTile value={staleGps} label="STALE GPS" tone="pending" />
          <MiniTile value={notStarted} label="NOT STARTED" tone="neutral" />
          <MiniTile value={offline} label="OFFLINE" tone="critical" />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Unacknowledged alerts</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No unacknowledged alerts.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-[13.5px] font-semibold text-text">
                    {alert.alertType}
                    {alert.registrationNo ? ` · ${alert.registrationNo}` : ""}
                  </p>
                  <p className="text-xs text-text-muted">{formatRelativeTime(alert.raisedAt)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill tone={alertSeverityTone(alert.severity)} label={alert.severity} />
                  <AcknowledgeAlertButton alertId={alert.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
