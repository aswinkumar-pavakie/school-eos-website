// Student detail -- same real profile faculty-student-detail.service.ts
// already composes (StudentsService.get, GuardianLinksService.listByStudent,
// AttendanceRecordsService.getAttendanceSummaryForStudent,
// StudentFeesService.getSummaryForStudent) for the Faculty console's own
// student detail page (src/app/(dashboard)/faculty/students/[studentId]),
// reused verbatim in content/structure here -- just gated by the
// coordinator's own real grade scope instead of "class advisor of this
// section" (see faculty-academic-coordinator.service.ts's own
// getStudentDetail), and using this module's own theme (--acc-*) instead of
// Faculty's (--fac-*), matching how every other coordinator screen adapts
// the design rather than importing Faculty's own themed components.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorStudentDetail } from "@/lib/faculty-coordinator-api";

function paiseToRupees(paise: string): string {
  return (Number(paise) / 100).toLocaleString("en-IN");
}

export default async function CoordinatorStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const { student, guardians, attendance, fees } = await getCoordinatorStudentDetail(studentId);
    const name = [student.firstName, student.lastName].filter(Boolean).join(" ");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Link href="/academic-coordinator/students" style={{ textDecoration: "none" }}>
          <span style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
            ← Back to students
          </span>
        </Link>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>{name}</div>
            <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 8 }}>
              {student.gradeName && student.sectionName ? `Class ${student.gradeName}-${student.sectionName}` : "No current class"}
              {student.rollNo ? ` · Roll ${student.rollNo}` : ""} · Admission {student.admissionNo}
            </div>
          </div>
          <StatusPill label={student.status} tone={student.status === "ACTIVE" ? "blue" : "gray"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          <Card>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Admission details</div>
            {[
              { label: "Admission no", value: student.admissionNo },
              { label: "Admission date", value: new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Blood group", value: student.bloodGroup ?? "—" },
              { label: "Hosteller", value: student.isHosteller ? "Yes" : "No" },
              { label: "School transport", value: student.usesSchoolTransport ? "Yes" : "No" },
              {
                label: "Address",
                value: [student.addressLine1, student.addressLine2, student.city, student.state, student.pincode].filter(Boolean).join(", ") || "—",
              },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                <span style={{ fontSize: 13.5, color: "var(--acc-tertiary)" }}>{row.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--acc-navy)", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Parent / guardian contacts</div>
            {guardians.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--acc-tertiary)" }}>No guardian on record.</div>
            ) : (
              guardians.map((g) => (
                <div key={g.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{[g.firstName, g.lastName].filter(Boolean).join(" ")}</span>
                    {g.isPrimaryContact && <StatusPill label="Primary" tone="blue" />}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 3 }}>
                    {g.relationship}{g.occupation ? ` · ${g.occupation}` : ""}
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Attendance history</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)" }}>{attendance.percentage !== null ? `${attendance.percentage}%` : "—"}</div>
            <div style={{ fontSize: 13, color: "var(--acc-tertiary)", marginTop: 4 }}>
              {attendance.presentCount} of {attendance.totalCount} sessions present
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Fee status</div>
            <StatusPill
              label={fees.overallStatus.replace(/_/g, " ")}
              tone={fees.overallStatus === "OVERDUE" ? "red" : fees.overallStatus === "PAID" || fees.overallStatus === "NO_ASSIGNMENT" ? "blue" : "gray"}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700 }}>PENDING</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalPendingPaise)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700 }}>OVERDUE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: Number(fees.totalOverduePaise) > 0 ? "var(--acc-red)" : "var(--acc-navy)", marginTop: 6 }}>
                  &#8377;{paiseToRupees(fees.totalOverduePaise)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700 }}>PAID</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalPaidPaise)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700 }}>TOTAL DUE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalDuePaise)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this student's profile."} />;
  }
}
