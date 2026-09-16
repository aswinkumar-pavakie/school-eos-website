// Movement log -- the design's own "isApprovals" screen, adapted to the real
// backend workflow: PARENTS submit gate-pass / emergency-exit requests from
// their own app (see hostel-warden-api.ts's own header comment); this warden
// account only ever reviews and decides them. The design's "Record an exit"
// warden-authored form has no backend counterpart and is not built -- the
// primary action here is Approve/Reject, not create.

import { ErrorState } from "@/components/ui/EmptyState";
import {
  listEmergencyExitRequests,
  listGatePassRequests,
  listRoomAllocations,
  listStudentGuardians,
  type OutingRequestRow,
} from "@/lib/hostel-warden-api";
import { MovementLogView, type MovementRow } from "./MovementLogView";

export default async function MovementLogPage() {
  try {
    const [gatePasses, emergencyExits, allocations] = await Promise.all([
      listGatePassRequests(),
      listEmergencyExitRequests(),
      listRoomAllocations(),
    ]);

    const roomByStudent = new Map<string, string>();
    for (const a of allocations) {
      roomByStudent.set(a.studentId, `${a.roomNo} · ${a.blockName}`);
    }

    const tagged: (OutingRequestRow & { kind: "gate-pass" | "emergency-exit" })[] = [
      ...gatePasses.map((r) => ({ ...r, kind: "gate-pass" as const })),
      ...emergencyExits.map((r) => ({ ...r, kind: "emergency-exit" as const })),
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
        return {
          id: r.id,
          kind: r.kind,
          studentName: [r.studentFirstName, r.studentLastName].filter(Boolean).join(" "),
          room: roomByStudent.get(r.studentId) ?? "—",
          reason: r.reason,
          destination: r.destination,
          outFrom: r.outFrom,
          expectedReturn: r.expectedReturn,
          isOvernight: r.isOvernight,
          state: r.state,
          requestedByName: requester ? `${requester.relationship} · ${[requester.firstName, requester.lastName].filter(Boolean).join(" ")}` : "—",
        };
      })
      .sort((a, b) => (a.outFrom < b.outFrom ? 1 : -1));

    return <MovementLogView rows={rows} />;
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the movement log."} />;
  }
}
