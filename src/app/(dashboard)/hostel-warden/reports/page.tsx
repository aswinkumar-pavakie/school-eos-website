// Reports -- pixel-matched to the design's own "Build a report" picker-tile
// + date-range layout. See ReportBuilder.tsx's own header comment for why
// its 4 tiles are the real sections this module has data for, not the
// design's own fabricated "Students with pending fees"/"Feedback" options,
// and why there's no "past reports" history table (none exists server-side).

import { ErrorState } from "@/components/ui/EmptyState";
import { formatMoneySummary } from "@/lib/format";
import {
  getStudentFees,
  listComplaints,
  listEmergencyExitRequests,
  listGatePassRequests,
  listHostelStructure,
  listRoomAllocations,
} from "@/lib/hostel-warden-api";
import { ReportBuilder, type ReportSection } from "./ReportBuilder";

export default async function ReportsPage() {
  try {
    const [allocations, blocks, complaints, gatePasses, emergencyExits] = await Promise.all([
      listRoomAllocations(),
      listHostelStructure(),
      listComplaints(),
      listGatePassRequests(),
      listEmergencyExitRequests(),
    ]);

    const activeAllocations = allocations.filter((a) => a.status === "ACTIVE");
    const totalCapacity = blocks.flatMap((b) => b.rooms).reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
    const occupancyRows: (string | number)[][] = [
      ["Block", "Rooms", "Beds occupied", "Beds vacant"],
      ...blocks.map((b) => {
        const capacity = b.rooms.reduce((sum, r) => sum + (r.bedCapacity || 0), 0);
        const occupied = activeAllocations.filter((a) => a.blockId === b.id).length;
        return [b.name, b.rooms.length, occupied, Math.max(0, capacity - occupied)];
      }),
    ];

    const complaintCounts = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.state] = (acc[c.state] ?? 0) + 1;
      return acc;
    }, {});
    const complaintRows: (string | number)[][] = [["Status", "Count"], ...Object.entries(complaintCounts)];

    const tagged = [...gatePasses, ...emergencyExits];
    const gateCounts = tagged.reduce<Record<string, number>>((acc, r) => {
      acc[r.state] = (acc[r.state] ?? 0) + 1;
      return acc;
    }, {});
    const gateRows: (string | number)[][] = [["Status", "Count"], ...Object.entries(gateCounts)];

    const fees = await Promise.all(activeAllocations.map((a) => getStudentFees(a.studentId).catch(() => null)));
    const totalPaid = fees.reduce((sum, f) => sum + (f ? Number(f.totalPaidPaise) : 0), 0);
    const totalDue = fees.reduce((sum, f) => sum + (f ? Number(f.totalDuePaise) : 0), 0);
    const feesRows: (string | number)[][] = [["Metric", "Amount"], ["Collected", formatMoneySummary(totalPaid)], ["Outstanding", formatMoneySummary(totalDue)]];

    const sections: ReportSection[] = [
      { key: "occupancy", label: "Occupancy", note: `${activeAllocations.length} of ${totalCapacity} beds taken`, rows: occupancyRows },
      { key: "complaints", label: "Complaints", note: `${complaints.length} logged`, rows: complaintRows },
      { key: "gate", label: "Gate movement", note: `${tagged.length} passes on record`, rows: gateRows },
      { key: "fees", label: "Fees", note: `${formatMoneySummary(totalDue)} outstanding`, rows: feesRows },
    ];

    return <ReportBuilder sections={sections} />;
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load reports."} />;
  }
}
