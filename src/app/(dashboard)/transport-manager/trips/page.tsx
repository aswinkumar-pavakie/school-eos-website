// Trips -- real trip lifecycle rows via GET /transport-ops/trips. No default
// date filter: this environment's real trip data is historical (Nov 30 - Dec
// 19, 2025), so defaulting to "today" would show an empty list on first
// load -- unfiltered (newest first) is the genuinely useful default; picking
// a date narrows to it.

import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TripsFilterBar } from "@/components/transport/TripsFilterBar";
import { apiFetch } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

interface TripRow {
  id: string;
  tripDate: string;
  direction: string;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  registrationNo: string;
  routeName: string;
  driverName: string | null;
  expectedCount: string;
  boardedCount: string;
  alertCount: string;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "COMPLETED") return "success";
  if (state === "CANCELLED" || state === "INTERRUPTED") return "critical";
  return "pending";
}

export default async function TransportManagerTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vehicleId?: string; routeId?: string; state?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  if (params.vehicleId) query.set("vehicleId", params.vehicleId);
  if (params.routeId) query.set("routeId", params.routeId);
  if (params.state) query.set("state", params.state);
  query.set("page", String(page));
  query.set("limit", "25");

  const [tripsRes, vehiclesRes, routesRes] = await Promise.all([
    apiFetch(`/transport-ops/trips?${query.toString()}`),
    apiFetch("/vehicles"),
    apiFetch("/routes"),
  ]);

  if (!tripsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Trips</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: trips, meta } = (await tripsRes.json()) as {
    data: TripRow[];
    meta: { page: number; limit: number; total: number };
  };
  const { data: vehicles }: { data: { id: string; registrationNo: string }[] } = vehiclesRes.ok
    ? await vehiclesRes.json()
    : { data: [] };
  const { data: routes }: { data: { id: string; name: string }[] } = routesRes.ok ? await routesRes.json() : { data: [] };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.date) next.set("date", params.date);
    if (params.vehicleId) next.set("vehicleId", params.vehicleId);
    if (params.routeId) next.set("routeId", params.routeId);
    if (params.state) next.set("state", params.state);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/transport-manager/trips?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">Trips</h1>
      <p className="mt-1 text-sm text-text-muted">{meta.total} trips match this filter.</p>

      <TripsFilterBar date={params.date ?? ""} vehicleId={params.vehicleId ?? ""} routeId={params.routeId ?? ""} state={params.state ?? ""} vehicles={vehicles} routes={routes} />

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <ul className="flex flex-col divide-y divide-border">
          {trips.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No trips match this filter.</li>}
          {trips.map((trip) => (
            <li key={trip.id} className="py-3">
              <Link href={`/transport-manager/trips/${trip.id}`} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-semibold text-text">
                    {trip.registrationNo} · {trip.routeName} · {trip.direction === "PICKUP" ? "Pickup" : "Drop"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(trip.tripDate)}
                    {trip.driverName ? ` · ${trip.driverName}` : ""}
                    {trip.startedAt ? ` · Started ${formatTime(trip.startedAt)}` : ""}
                    {trip.completedAt ? ` · Ended ${formatTime(trip.completedAt)}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Checked in {trip.boardedCount}/{trip.expectedCount}
                    {Number(trip.alertCount) > 0 ? ` · ${trip.alertCount} alert${trip.alertCount === "1" ? "" : "s"}` : ""}
                  </p>
                </div>
                <StatusPill tone={stateTone(trip.state)} label={trip.state} />
              </Link>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href={hrefWith({ page: String(Math.max(1, page - 1)) })}
              className={`font-semibold ${page <= 1 ? "pointer-events-none text-text-muted opacity-50" : "text-primary"}`}
            >
              Previous
            </Link>
            <span className="text-text-muted">
              Page {page} of {totalPages}
            </span>
            <Link
              href={hrefWith({ page: String(Math.min(totalPages, page + 1)) })}
              className={`font-semibold ${page >= totalPages ? "pointer-events-none text-text-muted opacity-50" : "text-primary"}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
