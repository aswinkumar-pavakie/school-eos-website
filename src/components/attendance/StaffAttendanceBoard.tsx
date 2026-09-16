"use client";

// Bulk staff/teacher attendance -- a "select all" checkbox plus per-row
// checkboxes, then one Present/Absent button marks everyone selected at once.
// Real data from staff_attendance_event (see query.md for the ABSENT event_type
// this needed) -- marking again later just records a new event for that
// staff+date, which is what "current status" always reflects (most recent wins).

import { useMemo, useState } from "react";
import { markStaffAttendanceAction } from "@/app/(dashboard)/admin/attendance/staff-actions";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatTime } from "@/lib/format";

export interface StaffDailyStatus {
  staffId: string;
  employeeNo: string;
  firstName: string;
  lastName: string | null;
  designation: string | null;
  status: string | null;
  markedAt: string | null;
  reason: string | null;
}

function statusLabel(status: string | null): { label: string; tone: "success" | "critical" | "pending" } {
  if (status === "CHECK_IN") return { label: "Present", tone: "success" };
  if (status === "ABSENT") return { label: "Absent", tone: "critical" };
  return { label: "Not marked", tone: "pending" };
}

export function StaffAttendanceBoard({
  date,
  roster,
  revalidatePathOverride,
}: {
  date: string;
  roster: StaffDailyStatus[];
  // Additive, defaults to Admin's own page -- Principal's page passes its own
  // route so marking attendance refreshes its own view, not Admin's.
  revalidatePathOverride?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const allSelected = roster.length > 0 && selected.size === roster.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(roster.map((r) => r.staffId)));
  }

  function toggleOne(staffId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }

  async function mark(status: "PRESENT" | "ABSENT") {
    setError(null);
    setNotice(null);
    if (selected.size === 0) {
      setError("Select at least one staff member first.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required (e.g. \"Daily roll call\").");
      return;
    }
    setIsPending(true);
    const result = await markStaffAttendanceAction([...selected], date, status, reason, revalidatePathOverride);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(`Marked ${selected.size} staff member(s) as ${status.toLowerCase()}.`);
    setSelected(new Set());
  }

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let notMarked = 0;
    for (const r of roster) {
      if (r.status === "CHECK_IN") present++;
      else if (r.status === "ABSENT") absent++;
      else notMarked++;
    }
    return { present, absent, notMarked };
  }, [roster]);

  return (
    <div className="rounded-[16px] border border-border bg-surface p-5">
      {/* "Attendance register" + "N staff on roll", per the mockup's own
          table header markup -- this card wraps the real mark-controls
          (select/reason/Present/Absent) above the table too, a genuine
          capability the read-only mockup doesn't have. */}
      <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Attendance register</h2>
      <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
        {roster.length} staff on roll
      </p>
      <p className="mt-3 text-[13px] text-text-muted">
        {counts.present} present · {counts.absent} absent · {counts.notMarked} not marked yet
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-[11px] bg-field p-3.5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Reason *</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            placeholder="e.g. Daily roll call"
            className="min-w-[220px] rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mark("PRESENT")}
          className="rounded-[11px] bg-success-bg px-3.5 py-2.5 text-sm font-bold text-success-text disabled:opacity-60"
        >
          Mark {selected.size || ""} selected Present
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mark("ABSENT")}
          className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-bold text-critical-text disabled:opacity-60"
        >
          Mark {selected.size || ""} selected Absent
        </button>
      </div>
      {error && <p className="mt-2 rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{error}</p>}
      {notice && <p className="mt-2 rounded-[11px] bg-success-bg px-3 py-2 text-sm text-success-text">{notice}</p>}

      {/* Columns per the mockup's own "Attendance register" table
          (STAFF/EMPLOYEE ID/DEPARTMENT/IN/OUT/STATUS), with two honest real-
          data substitutions: DEPARTMENT -> Designation (staff has no real
          department FK, only a designation string) and IN -> Marked at (the
          real single received_at timestamp on staff_attendance_event) with
          no OUT column at all -- the schema tracks one manual mark per day,
          not separate check-in/check-out punches, so a fabricated OUT time
          isn't shown. */}
      <div className="mt-4 overflow-x-auto rounded-[14px] border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-border" />
              </th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Marked at</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roster.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No active staff records.
                </td>
              </tr>
            )}
            {roster.map((r) => {
              const { label, tone } = statusLabel(r.status);
              return (
                <tr key={r.staffId}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.staffId)}
                      onChange={() => toggleOne(r.staffId)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-text">
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar photoUrl={null} name={`${r.firstName} ${r.lastName ?? ""}`} size={28} />
                      {r.firstName} {r.lastName ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text">{r.employeeNo}</td>
                  <td className="px-4 py-3 text-text-muted">{r.designation ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-muted">
                    {r.markedAt ? formatTime(r.markedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={tone} label={label} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
