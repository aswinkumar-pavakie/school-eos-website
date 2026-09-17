// Student profile -- the design's own detail sections (Personal / Academic /
// Hostel / Guardian), backed by real read-only data: the allocation record
// (Room & Bed View), real guardians, and real per-student fee status (a new,
// additive backend endpoint this build adds -- GET /hostel/students/:id/fees,
// reusing Finance's own StudentFeesService the same way /faculty/students/:id
// already does -- see hostel-warden-api.ts's own comment).

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, StatusPill } from "@/components/hostel-warden-ui/primitives";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { getStudentFees, getStudentRoom, listStudentGuardians } from "@/lib/hostel-warden-api";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--hw-text-faint)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--hw-text)" }}>{value}</span>
    </div>
  );
}

const FEE_STATUS_TONE = { NO_ASSIGNMENT: "gray", PAID: "blue", PARTIAL: "amber", PENDING: "amber", OVERDUE: "red" } as const;
const FEE_STATUS_LABEL = { NO_ASSIGNMENT: "No fee plan on record", PAID: "Paid", PARTIAL: "Partially paid", PENDING: "Pending", OVERDUE: "Overdue" } as const;

export default async function HostelWardenStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;

  try {
    const allocation = await getStudentRoom(studentId);
    const [guardians, fees] = await Promise.all([
      listStudentGuardians(studentId).catch(() => []),
      getStudentFees(studentId).catch(() => null),
    ]);
    const studentName = [allocation.studentFirstName, allocation.studentLastName].filter(Boolean).join(" ");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Link href="/hostel-warden/students" style={{ fontSize: 13, fontWeight: 600, color: "var(--hw-accent-700)" }}>
          ← All students
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 56, height: 56, flex: "0 0 56px", borderRadius: "50%", background: "var(--hw-accent-900)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>
            {studentName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{studentName}</h2>
            <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)", marginTop: 2 }}>
              {allocation.admissionNo} · {[allocation.gradeName, allocation.sectionName].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
          <Card style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Hostel</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Hostel" value={allocation.hostelName} />
              <Field label="Block" value={allocation.blockName} />
              <Field label="Room" value={`${allocation.roomNo} (Floor ${allocation.floorNo})`} />
              <Field label="Bed" value={allocation.bedNo} />
              <Field label="Allotted from" value={formatDate(allocation.allocatedFrom)} />
              <Field label="Status" value={allocation.status} />
            </div>
          </Card>

          <Card style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Guardians</h3>
            {guardians.length === 0 && <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>No guardian contact on record.</div>}
            {guardians.map((g) => (
              <div key={g.personId} style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 10, borderBottom: "1px solid var(--hw-divider-soft)" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {[g.firstName, g.lastName].filter(Boolean).join(" ")} · {g.relationship}
                  {g.isPrimaryContact && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "var(--hw-accent-700)" }}>PRIMARY</span>}
                </span>
                <span style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>{g.mobile ?? "No phone on record"}</span>
              </div>
            ))}
          </Card>

          <Card style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Fees</h3>
            {fees ? (
              <>
                <div>
                  <StatusPill label={FEE_STATUS_LABEL[fees.overallStatus]} tone={FEE_STATUS_TONE[fees.overallStatus]} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Total due" value={formatMoneySummary(fees.totalDuePaise)} />
                  <Field label="Paid so far" value={formatMoneySummary(fees.totalPaidPaise)} />
                  {Number(fees.totalOverduePaise) > 0 && <Field label="Overdue" value={formatMoneySummary(fees.totalOverduePaise)} />}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>Fee status isn&rsquo;t available right now.</div>
            )}
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this student."} />;
  }
}
