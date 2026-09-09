"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";

interface VehicleOption {
  id: string;
  registrationNo: string;
  model: string | null;
}

interface StudentBoardingRow {
  studentId: string;
  studentName: string;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  stopName: string;
  boardingStatus: "ENTERED" | "NOT_ENTERED";
  boardingTime: string | null;
  leaveStatus: "APPROVED" | "NONE";
  leaveReason: string | null;
  finalStatus: "ENTERED" | "ABSENT" | "NOT_ENTERED";
}

interface BoardingMonitorResult {
  route: { id: string; name: string } | null;
  trip: { id: string; direction: string; state: string; tripDate: string } | null;
  students: StudentBoardingRow[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function finalStatusTone(status: StudentBoardingRow["finalStatus"]): "success" | "pending" | "critical" {
  if (status === "ENTERED") return "success";
  if (status === "ABSENT") return "critical";
  return "pending";
}

function finalStatusLabel(status: StudentBoardingRow["finalStatus"]): string {
  if (status === "ENTERED") return "Entered";
  if (status === "ABSENT") return "Absent";
  return "Not entered";
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function BoardingMonitorClient({ vehicles }: { vehicles: VehicleOption[] }) {
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [result, setResult] = useState<BoardingMonitorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No setState here for the "nothing selected" case -- the JSX below only
    // ever reads `result` behind a `vehicleId &&` guard, so a stale result
    // simply never renders once vehicleId is cleared; no reset needed.
    if (!vehicleId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/transport-ops-boarding-monitor?vehicleId=${vehicleId}&date=${date}`)
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body?.message ?? "Couldn't load boarding data for this bus.");
          setResult(null);
          return;
        }
        setResult(body.data as BoardingMonitorResult);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load boarding data for this bus.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleId, date]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex max-w-xs flex-1 flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Bus</span>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">Select a bus</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNo}
                {v.model ? ` (${v.model})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
      </div>

      {!vehicleId && (
        <p className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center text-sm text-text-muted">
          Select a bus to view student boarding.
        </p>
      )}

      {vehicleId && loading && <p className="mt-6 text-sm text-text-muted">Loading…</p>}

      {vehicleId && !loading && error && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-8 text-center">
          <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this bus</p>
          <p className="mt-1.5 text-sm text-text-muted">{error}</p>
        </div>
      )}

      {vehicleId && !loading && !error && result && (
        <div className="mt-6 flex flex-col gap-6">
          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text">
                {result.route ? (
                  <>
                    Route: <span className="font-semibold">{result.route.name}</span>
                  </>
                ) : (
                  <span className="text-text-muted">No route currently assigned to this bus.</span>
                )}
              </p>
              {result.trip ? (
                <StatusPill tone="pending" label={`${result.trip.direction === "PICKUP" ? "Pickup" : "Drop"} · ${result.trip.state}`} />
              ) : (
                <p className="text-xs text-text-muted">No trip available for this bus/date.</p>
              )}
            </div>
          </section>

          <section className="rounded-[16px] border border-border bg-surface p-[18px]">
            <p className="text-[13px] text-text-muted">{result.students.length} students assigned to this bus</p>
            {result.students.length === 0 ? (
              <p className="mt-4 py-6 text-center text-sm text-text-muted">
                No students are assigned to this bus.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-[0.05em] text-text-muted">
                      <th className="pb-2 pr-3">Student</th>
                      <th className="pb-2 pr-3">Class / Section</th>
                      <th className="pb-2 pr-3">Stop</th>
                      <th className="pb-2 pr-3">Boarding Status</th>
                      <th className="pb-2 pr-3">Boarding Time</th>
                      <th className="pb-2 pr-3">Leave Status</th>
                      <th className="pb-2">Final Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.students.map((s) => (
                      <tr key={s.studentId} className="border-b border-border">
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-text">{s.studentName}</p>
                          <p className="text-xs text-text-muted">{s.admissionNo}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-text">
                          {s.gradeName ? `${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-text">{s.stopName}</td>
                        <td className="py-2.5 pr-3 text-text">{s.boardingStatus === "ENTERED" ? "Entered" : "Not entered"}</td>
                        <td className="py-2.5 pr-3 text-text">{formatTime(s.boardingTime)}</td>
                        <td className="py-2.5 pr-3 text-text">
                          {s.leaveStatus === "APPROVED" ? (
                            <span title={s.leaveReason ?? undefined}>Approved{s.leaveReason ? ` — ${s.leaveReason}` : ""}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5">
                          <StatusPill tone={finalStatusTone(s.finalStatus)} label={finalStatusLabel(s.finalStatus)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
