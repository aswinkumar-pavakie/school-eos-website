// Attendance -- pixel-adapted from the design's own Attendance screen. Real
// per-section data for one date: getCoordinatorAttendance() composes real
// attendance_session + attendance_record rows, server-side scoped to this
// coordinator's own sections (see faculty-academic-coordinator.service.ts's
// own listAttendance). No cross-section rollup existed anywhere in this
// schema before -- this is the real, newly-added backend for it, not a
// fabricated number.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import { listCoordinatorAttendance } from "@/lib/faculty-coordinator-api";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const effectiveDate = date || todayIso();

  try {
    const rows = await listCoordinatorAttendance(effectiveDate);
    const totalStudents = rows.reduce((a, r) => a + r.studentCount, 0);
    const totalPresent = rows.reduce((a, r) => a + r.presentCount, 0);
    const totalMarked = rows.reduce((a, r) => a + r.presentCount + r.absentCount + r.otherCount, 0);
    const sectionsMarked = rows.filter((r) => r.sessionFound).length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Attendance</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {new Date(effectiveDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {sectionsMarked} of {rows.length} sections marked
          </div>
        </div>

        <form style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" name="date" defaultValue={effectiveDate} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "10px 12px", fontSize: 14 }} />
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
            <div style={{ fontSize: 14, color: "var(--acc-body-muted)", fontWeight: 600 }}>Students on roll</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", margin: "9px 0 6px" }}>{totalStudents}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
            <div style={{ fontSize: 14, color: "var(--acc-body-muted)", fontWeight: 600 }}>Marked present</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", margin: "9px 0 6px" }}>{totalPresent}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
            <div style={{ fontSize: 14, color: "var(--acc-body-muted)", fontWeight: 600 }}>Attendance marked</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", margin: "9px 0 6px" }}>{totalMarked}/{totalStudents}</div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 130px 130px", gap: 12, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>SECTION</div>
              <div style={{ textAlign: "right" }}>STRENGTH</div>
              <div style={{ textAlign: "right" }}>PRESENT</div>
              <div style={{ textAlign: "right" }}>ABSENT</div>
              <div>STATUS</div>
            </div>
            {rows.map((r) => (
              <Link key={r.sectionId} href={`/academic-coordinator/attendance/${r.sectionId}?date=${effectiveDate}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="acc-row-hover" style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 130px 130px", gap: 12, alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--acc-divider-soft)", cursor: "pointer" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>
                    {r.gradeName} {r.sectionName}
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--acc-font-mono)", fontSize: 13 }}>{r.studentCount}</div>
                  <div style={{ textAlign: "right", fontFamily: "var(--acc-font-mono)", fontSize: 13 }}>{r.presentCount}</div>
                  <div style={{ textAlign: "right", fontFamily: "var(--acc-font-mono)", fontSize: 13, color: r.absentCount > 0 ? "var(--acc-red)" : undefined }}>{r.absentCount}</div>
                  <div>
                    {r.sessionFound ? (
                      <StatusPill label={r.isLocked ? "Published" : "Marked"} tone={r.isLocked ? "gray" : "green"} />
                    ) : (
                      <StatusPill label="Not marked" tone="amber" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {rows.length === 0 && <EmptyPanel label="No sections in your scope." />}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load attendance."} />;
  }
}
