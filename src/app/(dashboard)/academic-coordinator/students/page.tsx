// Students -- pixel-adapted from the design's own Students screen. Real
// data: listCoordinatorStudents() (StudentRepository, server-side scoped to
// this coordinator's own real grades -- see faculty-academic-coordinator.
// service.ts's own listStudents, never trusted from this client) and
// getCoordinatorStructure() for the section filter. Attendance %/rank/fee
// columns from the original design have no confirmed real cross-section
// backend yet (see the module's own research notes) -- omitted rather than
// fabricated. Each row now links to a real per-student detail page (see
// students/[studentId]/page.tsx) -- the same real profile/guardians/
// attendance/fees the Faculty console's own student detail page shows,
// just gated by the coordinator's own real grade scope.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorStructure, listCoordinatorStudents } from "@/lib/faculty-coordinator-api";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ search?: string; sectionId?: string }> }) {
  const { search, sectionId } = await searchParams;

  try {
    const [{ sections }, result] = await Promise.all([
      getCoordinatorStructure(),
      listCoordinatorStudents({ search, sectionId, limit: 200 }),
    ]);
    const students = result.data;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Students</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {result.meta.total} student{result.meta.total === 1 ? "" : "s"} under your co-ordination
          </div>
        </div>

        <form style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--acc-panel)", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", flex: 1, minWidth: 240 }}>
            <span style={{ color: "var(--acc-tertiary)", fontSize: 13 }}>Search</span>
            <input name="search" defaultValue={search ?? ""} placeholder="name, roll or admission number" style={{ border: 0, background: "transparent", outline: "none", flex: 1, fontSize: 14 }} />
          </div>
          <select name="sectionId" defaultValue={sectionId ?? ""} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", fontSize: 14, color: "var(--acc-navy)", fontWeight: 600, background: "#fff" }}>
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.gradeName} {s.sectionName}
              </option>
            ))}
          </select>
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
        </form>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(170px,1.4fr) 150px 130px 110px", gap: 12, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>STUDENT</div>
              <div>ADMISSION NO</div>
              <div>CLASS</div>
              <div>STATUS</div>
            </div>
            {students.map((s) => (
              <Link key={s.id} href={`/academic-coordinator/students/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  className="acc-row-hover"
                  style={{ display: "grid", gridTemplateColumns: "minmax(170px,1.4fr) 150px 130px 110px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--acc-divider-soft)", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{[s.firstName, s.lastName].filter(Boolean).join(" ")}</div>
                  <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12.5, color: "#475569" }}>{s.admissionNo}</div>
                  <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 13, color: "#334155" }}>{s.gradeName ?? "—"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)" }}>{s.status}</div>
                </div>
              </Link>
            ))}
            {students.length === 0 && <EmptyPanel label="No students match this filter." />}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load students."} />;
  }
}
