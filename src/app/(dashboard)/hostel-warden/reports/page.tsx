// Reports -- the design's own report-builder picks from sections like
// "Students with pending fees"/"Feedback" that have no real backend
// aggregate; rather than fabricate those, this composes real sections from
// data this module already has genuine access to (occupancy, complaints,
// gate movement, fees), each with a real CSV export of what's on screen --
// not a decorative "downloaded" toast with nothing behind it.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card } from "@/components/hostel-warden-ui/primitives";
import { formatMoneySummary } from "@/lib/format";
import {
  getStudentFees,
  listComplaints,
  listEmergencyExitRequests,
  listGatePassRequests,
  listHostelStructure,
  listRoomAllocations,
} from "@/lib/hostel-warden-api";
import { DownloadCsvButton } from "./DownloadCsvButton";

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
      const key = r.state; // real values: REQUESTED/APPROVED/REJECTED/CANCELLED/COMPLETED
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const gateRows: (string | number)[][] = [["Status", "Count"], ...Object.entries(gateCounts)];

    const fees = await Promise.all(activeAllocations.map((a) => getStudentFees(a.studentId).catch(() => null)));
    const totalPaid = fees.reduce((sum, f) => sum + (f ? Number(f.totalPaidPaise) : 0), 0);
    const totalDue = fees.reduce((sum, f) => sum + (f ? Number(f.totalDuePaise) : 0), 0);
    const feesRows: (string | number)[][] = [["Metric", "Amount (paise)"], ["Collected", totalPaid], ["Outstanding", totalDue]];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800 }}>Occupancy</h2>
            <DownloadCsvButton filename="occupancy.csv" rows={occupancyRows} />
          </div>
          <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)" }}>
            {activeAllocations.length} of {totalCapacity} beds occupied across {blocks.length} block{blocks.length === 1 ? "" : "s"}.
          </div>
        </Card>

        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800 }}>Complaints</h2>
            <DownloadCsvButton filename="complaints.csv" rows={complaintRows} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(complaintCounts).map(([state, count]) => (
              <div key={state} style={{ fontSize: 13.5 }}>
                <b>{count}</b> <span style={{ color: "var(--hw-text-muted)" }}>{state.replace("_", " ").toLowerCase()}</span>
              </div>
            ))}
            {complaints.length === 0 && <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)" }}>No complaints logged yet.</div>}
          </div>
        </Card>

        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800 }}>Gate movement</h2>
            <DownloadCsvButton filename="gate-movement.csv" rows={gateRows} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(gateCounts).map(([state, count]) => (
              <div key={state} style={{ fontSize: 13.5 }}>
                <b>{count}</b> <span style={{ color: "var(--hw-text-muted)" }}>{state.replace("_", " ").toLowerCase()}</span>
              </div>
            ))}
            {tagged.length === 0 && <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)" }}>No gate pass or emergency exit requests on record.</div>}
          </div>
        </Card>

        <Card style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: 19, fontWeight: 800 }}>Fees</h2>
            <DownloadCsvButton filename="fees.csv" rows={feesRows} />
          </div>
          <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)" }}>
            {formatMoneySummary(totalPaid)} collected · {formatMoneySummary(totalDue)} outstanding across {activeAllocations.length} boarders.
          </div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load reports."} />;
  }
}
