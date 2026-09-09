// NFC Attendance -- real bus_boarding_event rows via
// GET /transport-ops/boarding-events. Honesty note (also in the file this
// reads from): every row in this environment is currently recorded via
// "source": "ATTENDANT_MANUAL" -- zero BUS-type NFC terminals or
// BUS_BOARDING card taps exist in this database yet, so "Recorded via" will
// show "Attendant (manual)" for everything until real bus NFC hardware is
// deployed. Nothing here is relabelled to look like an NFC tap that didn't
// happen.

import Link from "next/link";
import { NfcAttendanceFilterBar } from "@/components/transport/NfcAttendanceFilterBar";
import { apiFetch } from "@/lib/api";
import { formatTime } from "@/lib/format";

interface BoardingEventRow {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  registrationNo: string;
  routeName: string;
  direction: string;
  stopName: string | null;
  source: string;
  cardUid: string | null;
  tapResult: string | null;
  isWrongBus: boolean;
  recordedAt: string;
}

export default async function TransportManagerNfcAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vehicleId?: string; routeId?: string; gradeId?: string; source?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  if (params.vehicleId) query.set("vehicleId", params.vehicleId);
  if (params.routeId) query.set("routeId", params.routeId);
  if (params.gradeId) query.set("gradeId", params.gradeId);
  if (params.source) query.set("source", params.source);
  query.set("page", String(page));
  query.set("limit", "50");

  const [eventsRes, vehiclesRes, routesRes, gradesRes] = await Promise.all([
    apiFetch(`/transport-ops/boarding-events?${query.toString()}`),
    apiFetch("/vehicles"),
    apiFetch("/routes"),
    apiFetch("/grades"),
  ]);

  if (!eventsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load NFC Attendance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: events, meta } = (await eventsRes.json()) as {
    data: BoardingEventRow[];
    meta: { page: number; limit: number; total: number };
  };
  const { data: vehicles }: { data: { id: string; registrationNo: string }[] } = vehiclesRes.ok
    ? await vehiclesRes.json()
    : { data: [] };
  const { data: routes }: { data: { id: string; name: string }[] } = routesRes.ok ? await routesRes.json() : { data: [] };
  const { data: grades }: { data: { id: string; name: string }[] } = gradesRes.ok ? await gradesRes.json() : { data: [] };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.date) next.set("date", params.date);
    if (params.vehicleId) next.set("vehicleId", params.vehicleId);
    if (params.routeId) next.set("routeId", params.routeId);
    if (params.gradeId) next.set("gradeId", params.gradeId);
    if (params.source) next.set("source", params.source);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/transport-manager/nfc-attendance?${next.toString()}`;
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[28px] font-bold leading-[34px] text-text">NFC Attendance</h1>
      <p className="mt-1 text-sm text-text-muted">{meta.total} boarding/alighting events match this filter.</p>

      <NfcAttendanceFilterBar
        date={params.date ?? ""}
        vehicleId={params.vehicleId ?? ""}
        routeId={params.routeId ?? ""}
        gradeId={params.gradeId ?? ""}
        source={params.source ?? ""}
        vehicles={vehicles}
        routes={routes}
        grades={grades}
      />

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-text-muted">
                <th className="pb-2 pr-3">Student</th>
                <th className="pb-2 pr-3">Bus / Route</th>
                <th className="pb-2 pr-3">Direction</th>
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Recorded via</th>
                <th className="pb-2">Flag</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-text-muted">
                    No boarding/alighting events match this filter.
                  </td>
                </tr>
              )}
              {events.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-text">
                      {e.studentFirstName} {e.studentLastName ?? ""}
                    </p>
                    <p className="text-xs text-text-muted">
                      {e.admissionNo}
                      {e.gradeName ? ` · ${e.gradeName}${e.sectionName ? `-${e.sectionName}` : ""}` : ""}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 text-text">
                    {e.registrationNo} · {e.routeName}
                    {e.stopName ? <span className="block text-xs text-text-muted">{e.stopName}</span> : null}
                  </td>
                  <td className="py-2.5 pr-3 text-text">{e.direction === "BOARD" ? "Boarded" : "Alighted"}</td>
                  <td className="py-2.5 pr-3 text-text">{formatTime(e.recordedAt)}</td>
                  <td className="py-2.5 pr-3 text-text">
                    {e.source === "CARD_TAP" ? (
                      <>
                        NFC card tap
                        {e.tapResult ? <span className="block text-xs text-text-muted">{e.tapResult}</span> : null}
                      </>
                    ) : (
                      "Attendant (manual)"
                    )}
                  </td>
                  <td className="py-2.5 text-text">{e.isWrongBus ? <span className="font-semibold text-critical-text">Wrong bus</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
