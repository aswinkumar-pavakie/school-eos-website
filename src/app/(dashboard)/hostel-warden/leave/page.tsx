// Leave register -- the design's own "isTable" leave screen. Home leave in
// the real schema is just an outing_request with isOvernight=true, and the
// Warden's own real path to create one is the same Movement Log write
// (purpose=HOME_LEAVE) the Movement log page's "Record an exit" already
// uses -- so "+ Record leave" here (see RecordLeaveForm.tsx) reuses that
// exact real backend rather than inventing a second write path. The
// register itself is still the read-only history of every home-leave
// entry, real data, no warden-authored write beyond the one shared form.

import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyRow, StatusPill, TableShell, Td, Th } from "@/components/hostel-warden-ui/primitives";
import { formatDateTime } from "@/lib/format";
import { nowMs } from "@/lib/hostel-warden-time";
import { listEmergencyExitRequests, listGatePassRequests, listMovementLogEntries, listRoomAllocations } from "@/lib/hostel-warden-api";
import { RecordLeaveForm } from "./RecordLeaveForm";

export default async function LeaveRegisterPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  try {
    const [gatePasses, emergencyExits, directEntries, allocations] = await Promise.all([
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listMovementLogEntries(),
      listRoomAllocations(),
    ]);
    const roomByStudent = new Map<string, string>();
    for (const a of allocations) roomByStudent.set(a.studentId, `${a.roomNo} · ${a.blockName}`);

    const students = allocations
      .filter((a) => a.status === "ACTIVE")
      .map((a) => ({
        studentId: a.studentId,
        name: [a.studentFirstName, a.studentLastName].filter(Boolean).join(" "),
        room: `${a.roomNo} · ${a.blockName}`,
      }));

    const nowIso = new Date(nowMs()).toISOString();
    const rows = [...gatePasses, ...emergencyExits, ...directEntries]
      .filter((r) => r.isOvernight && r.state === "APPROVED")
      .map((r) => {
        const days = Math.max(1, Math.round((new Date(r.expectedReturn).getTime() - new Date(r.outFrom).getTime()) / 86400000));
        const returned = r.actualReturnAt !== null || r.expectedReturn < nowIso;
        return {
          id: r.id,
          studentName: [r.studentFirstName, r.studentLastName].filter(Boolean).join(" "),
          room: roomByStudent.get(r.studentId) ?? "—",
          reason: r.reason,
          destination: r.destination,
          from: r.outFrom,
          to: r.expectedReturn,
          days,
          returned,
        };
      })
      .filter((r) => !needle || `${r.studentName} ${r.room} ${r.reason}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.from < b.from ? 1 : -1));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <RecordLeaveForm students={students} />
        <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
          <TableShell>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Room</Th>
                <Th>Purpose</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Days</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hw-row-hover">
                  <Td style={{ fontWeight: 600 }}>{r.studentName}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{r.room}</Td>
                  <Td style={{ minWidth: 200 }}>
                    {r.reason}
                    {r.destination && <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-faint)" }}>{r.destination}</span>}
                  </Td>
                  <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDateTime(r.from)}</Td>
                  <Td style={{ whiteSpace: "nowrap", color: "var(--hw-text-muted)" }}>{formatDateTime(r.to)}</Td>
                  <Td>{r.days}</Td>
                  <Td>
                    <StatusPill label={r.returned ? "Past due date" : "Away"} tone={r.returned ? "amber" : "blue"} />
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={7} label="No approved overnight leave on record." />}
            </tbody>
          </TableShell>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the leave register."} />;
  }
}
