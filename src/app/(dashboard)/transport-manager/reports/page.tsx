// Reports -- real aggregates over the same transport-ops endpoints the rest
// of this module uses, filtered by a real date range (no new reporting
// engine). Server-side filtering: the date range narrows what the backend
// itself returns, never a client-side download of the whole dataset. Two
// categories from the original spec are intentionally NOT built here --
// Driver Performance and Route Performance -- because no backend aggregate
// (average delay, trips-per-driver breakdown, etc.) exists yet to back them
// honestly; see this page's own "Known limitations" note and the final
// report for the exact missing-contract writeup.

import { ReportsFilterBar } from "@/components/transport/ReportsFilterBar";
import { apiFetch } from "@/lib/api";

interface TripRow {
  id: string;
  state: string;
  expectedCount: string;
  boardedCount: string;
  alertCount: string;
}
interface BoardingEventRow {
  id: string;
  source: string;
  isWrongBus: boolean;
}
interface AlertRow {
  id: string;
  severity: string;
  acknowledgedAt: string | null;
}
interface RouteOption {
  id: string;
  name: string;
}
interface RouteAssignedStudentRow {
  id: string;
  status: string;
}

// Real data in this environment runs Nov 30 - Dec 19, 2025 -- defaulting the
// range to it means the report shows real content on first load rather than
// an honest-but-empty "today" range; the date inputs are fully editable.
const DEFAULT_FROM = "2025-11-30";
const DEFAULT_TO = "2025-12-19";

export default async function TransportManagerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const dateFrom = params.dateFrom || DEFAULT_FROM;
  const dateTo = params.dateTo || DEFAULT_TO;

  const [tripsRes, eventsRes, alertsRes, routesRes] = await Promise.all([
    apiFetch(`/transport-ops/trips?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`),
    apiFetch(`/transport-ops/boarding-events?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=1000`),
    apiFetch("/transport-ops/alerts?limit=100"),
    apiFetch("/routes"),
  ]);

  const trips: TripRow[] = tripsRes.ok ? (await tripsRes.json()).data : [];
  const events: BoardingEventRow[] = eventsRes.ok ? (await eventsRes.json()).data : [];
  const alerts: AlertRow[] = alertsRes.ok ? (await alertsRes.json()).data : [];
  const routes: RouteOption[] = routesRes.ok ? (await routesRes.json()).data : [];

  const tripsByState = trips.reduce<Record<string, number>>((acc, t) => {
    acc[t.state] = (acc[t.state] ?? 0) + 1;
    return acc;
  }, {});
  const totalExpected = trips.reduce((sum, t) => sum + Number(t.expectedCount), 0);
  const totalBoarded = trips.reduce((sum, t) => sum + Number(t.boardedCount), 0);
  const totalAlerts = trips.reduce((sum, t) => sum + Number(t.alertCount), 0);

  const eventsBySource = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.source] = (acc[e.source] ?? 0) + 1;
    return acc;
  }, {});
  const wrongBusCount = events.filter((e) => e.isWrongBus).length;

  const alertsBySeverity = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] ?? 0) + 1;
    return acc;
  }, {});
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledgedAt).length;

  const routeStudentCounts = await Promise.all(
    routes.map(async (route) => {
      const res = await apiFetch(`/routes/${route.id}/assigned-students`);
      const rows: RouteAssignedStudentRow[] = res.ok ? (await res.json()).data : [];
      return { route: route.name, active: rows.filter((r) => r.status === "ACTIVE").length };
    }),
  );

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Reports</h1>
      <p className="mt-1 text-sm text-text-muted">Trip, attendance, alert, and student-transport summaries for a real date range.</p>

      <ReportsFilterBar dateFrom={dateFrom} dateTo={dateTo} />

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Trip report</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          {trips.length} trips between {dateFrom} and {dateTo}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {["SCHEDULED", "STARTED", "IN_PROGRESS", "COMPLETED", "INTERRUPTED", "CANCELLED"]
            .filter((s) => tripsByState[s])
            .map((state) => (
              <div key={state} className="rounded-[11px] bg-field p-3 text-center">
                <p className="text-[20px] font-extrabold leading-[26px] text-text">{tripsByState[state]}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-text-muted">{state}</p>
              </div>
            ))}
        </div>
        <p className="mt-3 text-sm text-text">
          Total checked in: <span className="font-semibold">{totalBoarded}</span> of <span className="font-semibold">{totalExpected}</span> expected
          {totalAlerts > 0 && <> · {totalAlerts} alert{totalAlerts === 1 ? "" : "s"} raised on these trips</>}
        </p>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">NFC / boarding attendance report</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          {events.length} boarding/alighting events between {dateFrom} and {dateTo}
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-text">{eventsBySource.CARD_TAP ?? 0}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">NFC CARD TAP</p>
          </div>
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-text">{eventsBySource.ATTENDANT_MANUAL ?? 0}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">ATTENDANT MANUAL</p>
          </div>
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-critical-text">{wrongBusCount}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">FLAGGED WRONG BUS</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Alerts report</h2>
        <p className="mt-1 text-[13px] text-text-muted">{alerts.length} alerts total (not date-filtered — this environment has only 15 seeded alerts)</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-critical-text">{alertsBySeverity.CRITICAL ?? 0}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">CRITICAL</p>
          </div>
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-pending-text">{alertsBySeverity.WARNING ?? 0}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">WARNING</p>
          </div>
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-text">{alertsBySeverity.INFO ?? 0}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">INFO</p>
          </div>
          <div className="rounded-[11px] bg-field p-3 text-center">
            <p className="text-[20px] font-extrabold leading-[26px] text-text">{unacknowledgedAlerts}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-text-muted">UNACKNOWLEDGED</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Student transport report</h2>
        <p className="mt-1 text-[13px] text-text-muted">Active transport allocations by route</p>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {routeStudentCounts.map((r) => (
            <li key={r.route} className="flex items-center justify-between py-2 text-sm">
              <span className="text-text">{r.route}</span>
              <span className="font-semibold text-text">{r.active} students</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Known limitations</h2>
        <p className="mt-2 text-sm text-text-muted">
          Driver Performance, Route Performance, and GPS Tracking History reports are not built yet — there is no
          backend aggregate for delay-vs-schedule, per-driver trip breakdowns, or a telemetry-history-by-range query
          in this environment today. Building them honestly needs a real scheduled-time concept (this schema has
          none) and a new telemetry-range endpoint. See the implementation report for the exact missing contract.
        </p>
      </section>
    </div>
  );
}
