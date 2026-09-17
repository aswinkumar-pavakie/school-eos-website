// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isStudentDetail"
// screen ("{{ stu.name }}"). Real data via GET /faculty/students/:studentId
// (faculty-student-detail.controller.ts) -- a new, section-scoped read
// reusing the exact same, already-built StudentsService/GuardianLinksService/
// AttendanceRecordsService/StudentFeesService the ADMIN-only
// students.controller.ts already calls, authorized against this teacher
// being the advisor of the student's own current section. No schema change.

import { redirect } from "next/navigation";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { Card } from "@/components/faculty-ui/Card";
import { StatusPill } from "@/components/faculty-ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getStudentDetail } from "@/lib/faculty-api";

function paiseToRupees(paise: string): string {
  return (Number(paise) / 100).toLocaleString("en-IN");
}

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const { student, guardians, attendance, fees } = await getStudentDetail(studentId);
    const name = [student.firstName, student.lastName].filter(Boolean).join(" ");

    return (
      <div>
        <BackButton href="/faculty/students" label="Back to students" />
        <div className="flex flex-wrap items-start justify-between gap-4" style={{ marginTop: 18 }}>
          <div>
            <h1 style={{ margin: 0, font: "700 34px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>{name}</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              {student.gradeName && student.sectionName ? `Class ${student.gradeName}-${student.sectionName}` : "No current class"}
              {student.rollNo ? ` · Roll ${student.rollNo}` : ""} · Admission {student.admissionNo}
            </p>
          </div>
          <StatusPill tone={student.status === "ACTIVE" ? "blue" : "gray"}>{student.status}</StatusPill>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2" style={{ marginTop: 22 }}>
          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Admission details</h3>
            {[
              { label: "Admission no", value: student.admissionNo },
              { label: "Admission date", value: new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Blood group", value: student.bloodGroup ?? "--" },
              { label: "Hosteller", value: student.isHosteller ? "Yes" : "No" },
              { label: "School transport", value: student.usesSchoolTransport ? "Yes" : "No" },
              {
                label: "Address",
                value: [student.addressLine1, student.addressLine2, student.city, student.state, student.pincode].filter(Boolean).join(", ") || "--",
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4" style={{ padding: "10px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <span style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{row.label}</span>
                <span style={{ font: "600 13.5px/1.4 var(--fac-font-sans)", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Parent / guardian contacts</h3>
            {guardians.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No guardian on record.</p>
            ) : (
              guardians.map((g) => (
                <div key={g.id} className="fac-hover-lift" style={{ padding: "11px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                  <div className="flex items-center gap-2.5">
                    <span style={{ font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{[g.firstName, g.lastName].filter(Boolean).join(" ")}</span>
                    {g.isPrimaryContact && <StatusPill tone="blue" size="sm">Primary</StatusPill>}
                  </div>
                  <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                    {g.relationship}{g.occupation ? ` · ${g.occupation}` : ""}
                  </span>
                </div>
              ))
            )}
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Attendance history</h3>
            <div className="flex items-end justify-between">
              <div>
                <div style={{ font: "700 34px/1.1 var(--fac-font-sans)" }}>{attendance.percentage !== null ? `${attendance.percentage}%` : "--"}</div>
                <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>
                  {attendance.presentCount} of {attendance.totalCount} sessions present
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: "0 0 14px", font: "700 19px/1.2 var(--fac-font-sans)" }}>Fee status</h3>
            <div className="flex items-center gap-2.5">
              <StatusPill tone={fees.overallStatus === "OVERDUE" ? "red" : fees.overallStatus === "PAID" || fees.overallStatus === "NO_ASSIGNMENT" ? "blue" : "gray"}>
                {fees.overallStatus.replace(/_/g, " ")}
              </StatusPill>
            </div>
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 14 }}>
              <div>
                <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>PENDING</div>
                <div style={{ font: "700 20px/1.2 var(--fac-font-sans)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalPendingPaise)}</div>
              </div>
              <div>
                <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>OVERDUE</div>
                <div style={{ font: "700 20px/1.2 var(--fac-font-sans)", marginTop: 6, color: Number(fees.totalOverduePaise) > 0 ? "var(--fac-red-text)" : "var(--fac-ink)" }}>
                  &#8377;{paiseToRupees(fees.totalOverduePaise)}
                </div>
              </div>
              <div>
                <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>PAID</div>
                <div style={{ font: "700 20px/1.2 var(--fac-font-sans)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalPaidPaise)}</div>
              </div>
              <div>
                <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>TOTAL DUE</div>
                <div style={{ font: "700 20px/1.2 var(--fac-font-sans)", marginTop: 6 }}>&#8377;{paiseToRupees(fees.totalDuePaise)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this student's profile. Nothing was changed -- try again." />;
  }
}
