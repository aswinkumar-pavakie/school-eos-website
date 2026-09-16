// Leave register -- the design's own "isTable" leave screen, adapted: the
// design lets the warden author a leave entry directly, but overnight leave
// in the real schema is just an outing_request with isOvernight=true, and
// the warden never creates those (see hostel-warden-api.ts's own header
// comment) -- only reviews them (Movement log). This register is the
// read-only history of every approved overnight request: real data, no
// warden-authored write.

import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyRow, StatusPill, TableShell, Td, Th } from "@/components/hostel-warden-ui/primitives";
import { formatDateTime } from "@/lib/format";
import { nowMs } from "@/lib/hostel-warden-time";
import { listEmergencyExitRequests, listGatePassRequests, listRoomAllocations } from "@/lib/hostel-warden-api";

export default async function LeaveRegisterPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  try {
    const [gatePasses, emergencyExits, allocations] = await Promise.all([
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listRoomAllocations(),
    ]);
    const roomByStudent = new Map<string, string>();
    for (const a of allocations) roomByStudent.set(a.studentId, `${a.roomNo} · ${a.blockName}`);

    const nowIso = new Date(nowMs()).toISOString();
    const rows = [...gatePasses, ...emergencyExits]
      .filter((r) => r.isOvernight && r.state === "APPROVED")
      .map((r) => {
        const days = Math.max(1, Math.round((new Date(r.expectedReturn).getTime() - new Date(r.outFrom).getTime()) / 86400000));
        const returned = r.expectedReturn < nowIso; // best-effort: no explicit check-in event exists in the real schema
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
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the leave register."} />;
  }
}
