// Check-in / check-out -- the design's own gate register: exits and returns
// logged by the warden. Real data merged from every approved outing
// (parent-app Gate Pass/Emergency Exit requests, plus Warden-authored
// Movement Log entries) -- "checked out" vs "checked in" is the real
// actual_return_at column now (see migration
// 0021_outing_request_movement_log_fields.sql), not just an inferred
// time-window guess. Night Attendance (roll call) moved to its own route --
// see night-attendance/page.tsx's own header comment for why.

import { ErrorState } from "@/components/ui/EmptyState";
import {
  listEmergencyExitRequests,
  listGatePassRequests,
  listHostelStructure,
  listMovementLogEntries,
  listRoomAllocations,
} from "@/lib/hostel-warden-api";
import { GateRegisterView, type GateRow } from "./GateRegisterView";

export default async function GatePage() {
  try {
    const [gatePasses, emergencyExits, directEntries, allocations, blocks] = await Promise.all([
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listMovementLogEntries(),
      listRoomAllocations(),
      listHostelStructure(),
    ]);

    const admissionByStudent = new Map<string, string>();
    const roomByStudent = new Map<string, string>();
    const blockByStudent = new Map<string, string>();
    for (const a of allocations) {
      admissionByStudent.set(a.studentId, a.admissionNo);
      roomByStudent.set(a.studentId, a.roomNo);
      blockByStudent.set(a.studentId, a.blockName);
    }

    const outRows: GateRow[] = [...gatePasses, ...emergencyExits, ...directEntries]
      .filter((r) => r.state === "APPROVED")
      .map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: [r.studentFirstName, r.studentLastName].filter(Boolean).join(" "),
        admissionNo: admissionByStudent.get(r.studentId) ?? "—",
        room: roomByStudent.get(r.studentId) ?? "—",
        blockName: blockByStudent.get(r.studentId) ?? "—",
        destination: r.destination,
        reason: r.reason,
        dueAt: r.expectedReturn,
        returned: r.actualReturnAt !== null,
      }))
      .sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1));

    return <GateRegisterView outRows={outRows} blocks={blocks} />;
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the gate register."} />;
  }
}
