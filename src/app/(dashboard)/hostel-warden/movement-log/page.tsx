// Movement log -- the design's own "isApprovals" screen. Two real, distinct
// kinds of row now: parent-app-submitted Gate Pass/Emergency Exit requests
// (reviewed here via Approve/Reject, as before) AND Warden-authored direct
// entries (the design's own "Record an exit" form -- the Warden takes the
// parent's call and logs the exit themself, with Record return/Amend
// afterward). See hostel-warden-api.ts's own movement-log section and the
// backend's outing-request.repository.ts createDirect/findDirectEntriesForHostels
// for the real schema this is built on.

import { ErrorState } from "@/components/ui/EmptyState";
import {
  listEmergencyExitRequests,
  listGatePassRequests,
  listHostelStructure,
  listMovementLogEntries,
  listRoomAllocations,
  listStudentGuardians,
  type OutingRequestRow,
} from "@/lib/hostel-warden-api";
import { MovementLogView, type MovementRow } from "./MovementLogView";

export default async function MovementLogPage() {
  try {
    const [gatePasses, emergencyExits, directEntries, allocations, blocks] = await Promise.all([
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listMovementLogEntries(),
      listRoomAllocations(),
      listHostelStructure(),
    ]);

    const roomByStudent = new Map<string, string>();
    for (const a of allocations) {
      roomByStudent.set(a.studentId, `${a.roomNo} · ${a.blockName}`);
    }

    const tagged: (OutingRequestRow & { kind: "gate-pass" | "emergency-exit" | "movement-log" })[] = [
      ...gatePasses.map((r) => ({ ...r, kind: "gate-pass" as const })),
      ...emergencyExits.map((r) => ({ ...r, kind: "emergency-exit" as const })),
      ...directEntries.map((r) => ({ ...r, kind: "movement-log" as const })),
    ];

    const studentIds = Array.from(new Set(tagged.map((r) => r.studentId)));
    const guardiansByStudent = new Map<string, Awaited<ReturnType<typeof listStudentGuardians>>>();
    await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          guardiansByStudent.set(studentId, await listStudentGuardians(studentId));
        } catch {
          guardiansByStudent.set(studentId, []);
        }
      }),
    );

    const rows: MovementRow[] = tagged
      .map((r) => {
        const guardians = guardiansByStudent.get(r.studentId) ?? [];
        const requester = r.requestedBy ? guardians.find((g) => g.personId === r.requestedBy) : undefined;
        const calledBy = r.calledByName ? `${r.calledByName} · ${r.calledByPhone ?? ""}`.trim() : undefined;
        return {
          id: r.id,
          kind: r.kind,
          studentId: r.studentId,
          studentName: [r.studentFirstName, r.studentLastName].filter(Boolean).join(" "),
          room: roomByStudent.get(r.studentId) ?? "—",
          reason: r.reason,
          destination: r.destination,
          outFrom: r.outFrom,
          expectedReturn: r.expectedReturn,
          isOvernight: r.isOvernight,
          state: r.state,
          purposeCategory: r.purposeCategory,
          actualReturnAt: r.actualReturnAt,
          requestedByName: calledBy ?? (requester ? `${requester.relationship} · ${[requester.firstName, requester.lastName].filter(Boolean).join(" ")}` : "—"),
        };
      })
      .sort((a, b) => (a.outFrom < b.outFrom ? 1 : -1));

    const students = allocations
      .filter((a) => a.status === "ACTIVE")
      .map((a) => ({
        studentId: a.studentId,
        name: [a.studentFirstName, a.studentLastName].filter(Boolean).join(" "),
        room: `${a.roomNo} · ${a.blockName}`,
      }));

    return <MovementLogView rows={rows} students={students} blocks={blocks} />;
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the movement log."} />;
  }
}
