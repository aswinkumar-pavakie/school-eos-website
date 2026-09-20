// Hostel fees -- the design's own invoices/receipts screen doesn't have a
// backend counterpart (no hostel-scoped fee module exists in
// school-eos-backend); what IS real is per-student fee status via Finance's
// own StudentFeesService, reachable to this role at
// GET /hostel/students/:id/fees (an additive endpoint this build adds --
// see hostel-warden-api.ts's own comment). This screen composes that real,
// per-student data into the boarder-fee view the design pictures: every
// resident, with a real Paid/Partial/Pending/Overdue status and amount
// breakdown, plus the shared header search and a status-filter chip row
// (see FeesView.tsx) -- both explicitly asked for.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card } from "@/components/hostel-warden-ui/primitives";
import { formatMoneySummary } from "@/lib/format";
import { getStudentFees, listRoomAllocations } from "@/lib/hostel-warden-api";
import { FeesView, type FeeRow } from "./FeesView";

export default async function HostelFeesPage() {
  try {
    const allocations = (await listRoomAllocations()).filter((a) => a.status === "ACTIVE");
    const settled = await Promise.all(
      allocations.map(async (a) => {
        const fees = await getStudentFees(a.studentId).catch(() => null);
        return { allocation: a, fees };
      }),
    );

    const rows: FeeRow[] = settled
      .filter((r): r is { allocation: (typeof settled)[number]["allocation"]; fees: NonNullable<(typeof settled)[number]["fees"]> } => r.fees !== null)
      .map((r) => ({
        studentId: r.allocation.studentId,
        name: [r.allocation.studentFirstName, r.allocation.studentLastName].filter(Boolean).join(" "),
        room: `${r.allocation.roomNo} · ${r.allocation.blockName}`,
        totalDuePaise: r.fees.totalDuePaise,
        totalPaidPaise: r.fees.totalPaidPaise,
        totalOverduePaise: r.fees.totalOverduePaise,
        overallStatus: r.fees.overallStatus,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalDue = rows.reduce((sum, r) => sum + Number(r.totalDuePaise), 0);
    const totalPaid = rows.reduce((sum, r) => sum + Number(r.totalPaidPaise), 0);
    const totalOverdue = rows.reduce((sum, r) => sum + Number(r.totalOverduePaise), 0);
    const defaulters = rows.filter((r) => r.overallStatus === "OVERDUE").length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Collected</div>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, marginTop: 6 }}>{formatMoneySummary(totalPaid)}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Outstanding</div>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, marginTop: 6 }}>{formatMoneySummary(totalDue)}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Overdue</div>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, marginTop: 6 }}>{formatMoneySummary(totalOverdue)}</div>
          </Card>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)" }}>Defaulters</div>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, marginTop: 6 }}>{defaulters}</div>
          </Card>
        </div>

        <FeesView rows={rows} />
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load hostel fees."} />;
  }
}
