// Trip detail -- vehicle/driver/route, the real boarding/alighting timeline
// (bus_boarding_event, oldest first), and real student_trip_status attendance
// counts. No geofencing/route-deviation math -- "timeline" is only ever real
// recorded events, matching Bus Tracking's own established rule.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

interface TripDetail {
  id: string;
  tripDate: string;
  direction: string;
  state: string;
  startedAt: string | null;
  completedAt: string | null;
  distanceKm: string | null;
  registrationNo: string;
  routeName: string;
  driverName: string | null;
}

interface AttendanceCounts {
  expected: string;
  boarded: string;
  dropped: string;
  notBoarded: string;
  absent: string;
}

interface TimelineRow {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  stopName: string | null;
  direction: string;
  source: string;
  isWrongBus: boolean;
  recordedAt: string;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "COMPLETED") return "success";
  if (state === "CANCELLED" || state === "INTERRUPTED") return "critical";
  return "pending";
}

export default async function TransportManagerTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/transport-ops/trips/${id}`);

  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this trip</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data } = (await res.json()) as {
    data: { trip: TripDetail; attendance: AttendanceCounts; timeline: TimelineRow[] };
  };
  const { trip, attendance, timeline } = data;

  return (
    <div className="mx-auto max-w-[900px]">
      <BackLink href="/transport-manager/trips" label="Back to Trips" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {trip.registrationNo} · {trip.routeName}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {trip.direction === "PICKUP" ? "Pickup" : "Drop"} · {formatDate(trip.tripDate)}
            {trip.driverName ? ` · Driver: ${trip.driverName}` : ""}
          </p>
        </div>
        <StatusPill tone={stateTone(trip.state)} label={trip.state} />
      </div>

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Timing</h2>
        <div className="mt-2 flex flex-wrap gap-6 text-sm text-text">
          <p>Started: {trip.startedAt ? formatTime(trip.startedAt) : "Not started"}</p>
          <p>Completed: {trip.completedAt ? formatTime(trip.completedAt) : "Not completed"}</p>
          {trip.distanceKm && <p>Distance: {trip.distanceKm} km</p>}
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Attendance</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {[
            { label: "Expected", value: attendance.expected },
            { label: "Boarded", value: attendance.boarded },
            { label: "Dropped", value: attendance.dropped },
            { label: "Not boarded", value: attendance.notBoarded },
            { label: "Absent", value: attendance.absent },
          ].map((tile) => (
            <div key={tile.label} className="rounded-[11px] bg-field p-3 text-center">
              <p className="text-[20px] font-extrabold leading-[26px] text-text">{tile.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-text-muted">{tile.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Timeline</h2>
        <p className="mt-1 text-[13px] text-text-muted">Every real boarding/alighting event recorded on this trip.</p>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {timeline.length === 0 && <li className="py-4 text-center text-sm text-text-muted">No boarding/alighting events recorded yet.</li>}
          {timeline.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <p className="font-semibold text-text">
                  {event.studentFirstName} {event.studentLastName ?? ""} · {event.direction === "BOARD" ? "Boarded" : "Alighted"}
                  {event.stopName ? ` at ${event.stopName}` : ""}
                </p>
                <p className="text-xs text-text-muted">
                  {formatTime(event.recordedAt)} · recorded via {event.source === "CARD_TAP" ? "NFC card tap" : "attendant (manual)"}
                  {event.isWrongBus ? " · flagged: wrong bus" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
