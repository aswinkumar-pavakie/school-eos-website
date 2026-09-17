// Hostel fees -- the design's own invoices/receipts screen doesn't have a
// backend counterpart (no hostel-scoped fee module exists in
// school-eos-backend); what IS real is per-student fee status via Finance's
// own StudentFeesService, now reachable to this role at
// GET /hostel/students/:id/fees (an additive endpoint this build adds --
// see hostel-warden-api.ts's own comment). This screen composes that real,
// per-student data into the boarder-fee view the design pictures, rather
// than showing a bare "not available" gap notice for data that, per-student,
// genuinely exists.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyRow, StatusPill, TableShell, Td, Th, type PillTone } from "@/components/hostel-warden-ui/primitives";
import { formatMoneySummary } from "@/lib/format";
import { getStudentFees, listRoomAllocations, type StudentFeeOverallStatus } from "@/lib/hostel-warden-api";

const STATUS_TONE: Record<StudentFeeOverallStatus, PillTone> = {
  NO_ASSIGNMENT: "gray",
  PAID: "blue",
  PARTIAL: "amber",
  PENDING: "amber",
  OVERDUE: "red",
};
const STATUS_LABEL: Record<StudentFeeOverallStatus, string> = {
  NO_ASSIGNMENT: "No fee plan",
  PAID: "Paid",
  PARTIAL: "Partially paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

export default async function HostelFeesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  try {
    const allocations = (await listRoomAllocations()).filter((a) => a.status === "ACTIVE");
    const rows = await Promise.all(
      allocations.map(async (a) => {
        const fees = await getStudentFees(a.studentId).catch(() => null);
        return { allocation: a, fees };
      }),
    );

    const withFees = rows.filter((r) => r.fees !== null) as { allocation: (typeof rows)[number]["allocation"]; fees: NonNullable<(typeof rows)[number]["fees"]> }[];
    const filtered = withFees.filter((r) => {
      if (!needle) return true;
      const name = [r.allocation.studentFirstName, r.allocation.studentLastName].filter(Boolean).join(" ");
      return `${name} ${r.allocation.admissionNo} ${r.allocation.roomNo}`.toLowerCase().includes(needle);
    });

    const totalDue = withFees.reduce((sum, r) => sum + Number(r.fees.totalDuePaise), 0);
    const totalPaid = withFees.reduce((sum, r) => sum + Number(r.fees.totalPaidPaise), 0);
    const totalOverdue = withFees.reduce((sum, r) => sum + Number(r.fees.totalOverduePaise), 0);
    const defaulters = withFees.filter((r) => r.fees.overallStatus === "OVERDUE").length;

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

        <div className="hw-lift" style={{ border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", overflow: "hidden" }}>
          <TableShell>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Room</Th>
                <Th align="right">Total due</Th>
                <Th align="right">Paid</Th>
                <Th align="right">Overdue</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.allocation.id} className="hw-row-hover">
                  <Td style={{ fontWeight: 600 }}>{[r.allocation.studentFirstName, r.allocation.studentLastName].filter(Boolean).join(" ")}</Td>
                  <Td style={{ color: "var(--hw-text-muted)" }}>{r.allocation.roomNo} · {r.allocation.blockName}</Td>
                  <Td align="right">{formatMoneySummary(r.fees.totalDuePaise)}</Td>
                  <Td align="right">{formatMoneySummary(r.fees.totalPaidPaise)}</Td>
                  <Td align="right">{formatMoneySummary(r.fees.totalOverduePaise)}</Td>
                  <Td>
                    <StatusPill label={STATUS_LABEL[r.fees.overallStatus]} tone={STATUS_TONE[r.fees.overallStatus]} />
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && <EmptyRow colSpan={6} label={needle ? "No students match that search." : "No fee records available."} />}
            </tbody>
          </TableShell>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load hostel fees."} />;
  }
}
