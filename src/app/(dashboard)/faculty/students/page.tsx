// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isStudentList"
// screen. Real data: with no search text, the section's full real roster
// comes from getAttendanceRoster (the same real endpoint the Attendance
// screen already uses) -- the dedicated students/search endpoint's own
// backend (faculty-class-teacher.service.ts) deliberately returns [] for an
// empty query, it is a search-only endpoint, not a roster-listing one, so it
// is used only once the user actually types something. Attendance column
// shows each student's REAL status for today (from that same roster call)
// instead of a placeholder. Admission no/rank/fee-status columns have no
// FACULTY-authorized data source today (see the plan's "Known gaps") --
// shown as "--" (an honest unknown marker, never fabricated), not hidden.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getAttendanceRoster, listAdvisorSections, searchSectionStudents } from "@/lib/faculty-api";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half day",
  ON_LEAVE: "On leave",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; q?: string }>;
}) {
  try {
    const sections = await listAdvisorSections();
    const params = await searchParams;
    const sectionId = params.sectionId || sections[0]?.sectionId;
    const q = params.q ?? "";

    if (sections.length === 0 || !sectionId) {
      return (
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Students</h1>
          <div style={{ marginTop: 20 }}>
            <FacultyEmptyState message="You are not a class advisor -- the student register is only visible to the section's own class advisor." />
          </div>
        </div>
      );
    }

    const section = sections.find((s) => s.sectionId === sectionId) ?? sections[0];

    let students: { studentId: string; studentName: string; rollNo: number | null; attendanceToday: string | null }[];
    if (q.trim().length > 0) {
      const results = await searchSectionStudents(sectionId, q);
      students = results.map((s) => ({ ...s, attendanceToday: null }));
    } else {
      const roster = await getAttendanceRoster(sectionId, todayIso()).catch(() => null);
      students = roster
        ? roster.records
            .map((r) => ({
              studentId: r.studentId,
              studentName: [r.firstName, r.lastName].filter(Boolean).join(" "),
              rollNo: r.rollNo,
              attendanceToday: r.status,
            }))
            .sort((a, b) => (a.rollNo ?? 9999) - (b.rollNo ?? 9999))
        : [];
    }

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Students</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          {students.length} students in Class {section.gradeName}-{section.sectionName} · search by name or roll number
        </p>

        <div style={{ marginTop: 14 }}>
          <Link
            href="/faculty/class-teacher"
            className="fac-hover-lift"
            style={{ display: "inline-block", border: "1px solid var(--fac-border)", background: "var(--fac-white)", borderRadius: 9, padding: "10px 15px", font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-navy)" }}
          >
            Class duties &amp; officers
          </Link>
        </div>

        <Card padding="20px 22px" className="mt-[18px]">
          <form action={`/faculty/students`} className="flex flex-wrap items-center gap-3.5">
            <input type="hidden" name="sectionId" value={sectionId} />
            <div
              className="flex items-center gap-3"
              style={{ background: "var(--fac-panel)", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 260 }}
            >
              <span style={{ font: "400 14.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Search</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="name or roll number"
                style={{ flex: 1, border: 0, font: "400 14.5px/1 var(--fac-font-sans)", color: "var(--fac-ink)", background: "none", outline: "none" }}
              />
            </div>
            <button type="submit" style={{ border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 10, padding: "14px 22px" }}>
              Search
            </button>
          </form>
        </Card>

        <Card padding="22px" className="mt-[18px]">
          <div className="flex items-baseline gap-4 flex-wrap">
            <div style={{ font: "700 20px/1.2 var(--fac-font-sans)", color: "var(--fac-navy)", flex: 1 }}>Student register</div>
            <div style={{ font: "400 14px/1 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Showing {students.length} records</div>
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 12,
              padding: "18px 0 12px",
              borderBottom: "1px solid var(--fac-border)",
              font: "600 11px/1 var(--fac-font-sans)",
              letterSpacing: ".07em",
              color: "var(--fac-tertiary)",
            }}
          >
            <div>STUDENT</div>
            <div>ROLL NO</div>
            <div>CLASS</div>
            <div style={{ textAlign: "right" }}>ATTENDANCE</div>
          </div>
          {students.map((s) => (
            <Link
              key={s.studentId}
              href={`/faculty/students/${s.studentId}`}
              className="grid w-full items-center"
              style={{
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: 12,
                borderBottom: "1px solid var(--fac-divider)",
                padding: "18px 0",
                transition: "background .12s ease",
              }}
            >
              <span style={{ font: "600 15.5px/1.3 var(--fac-font-sans)", color: "var(--fac-navy)" }}>{s.studentName}</span>
              <span className="fac-font-mono" style={{ font: "400 14px/1 var(--fac-font-mono)", color: "#475569" }}>{s.rollNo ?? "--"}</span>
              <span className="fac-font-mono" style={{ font: "400 14px/1 var(--fac-font-mono)", color: "#475569" }}>
                {section.gradeName}-{section.sectionName}
              </span>
              <span
                style={{
                  textAlign: "right",
                  font: "600 13px/1 var(--fac-font-sans)",
                  color: s.attendanceToday === "ABSENT" ? "#dc2626" : s.attendanceToday ? "var(--fac-primary)" : "var(--fac-tertiary)",
                }}
              >
                {s.attendanceToday ? (ATTENDANCE_LABEL[s.attendanceToday] ?? s.attendanceToday) : "--"}
              </span>
            </Link>
          ))}
          {students.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", font: "400 15px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
              No student matches this search.
            </div>
          )}
        </Card>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the student register. Nothing was changed -- try again." />;
  }
}
