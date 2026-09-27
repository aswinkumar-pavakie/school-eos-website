// Reports -- a real, composed grade-wise summary over data this module
// already computes elsewhere (Attendance, Performance, Syllabus tracking,
// Academic approvals) -- see faculty-academic-coordinator.service.ts's own
// getReports for why each section uses its own latest applicable exam
// rather than one shared exam id, and why "attendance" here is today's
// snapshot (the only cross-section attendance data this schema supports)
// rather than a fabricated term-to-date trend.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorReports } from "@/lib/faculty-coordinator-api";

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
      <div style={{ fontSize: 14, color: "var(--acc-body-muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em", margin: "9px 0 6px" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--acc-body-muted)" }}>{sub}</div>
    </div>
  );
}

export default async function ReportsPage() {
  try {
    const r = await getCoordinatorReports();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Reports</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {r.stages.join(", ")} · {r.gradeCount} grade{r.gradeCount === 1 ? "" : "s"} · {r.studentCount} students
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <Kpi label="Avg. exam score" value={r.kpis.avgExamPercent !== null ? `${r.kpis.avgExamPercent}%` : "—"} sub="across each class's latest published exam" />
          <Kpi label="Syllabus coverage" value={r.kpis.avgSyllabusPercent !== null ? `${r.kpis.avgSyllabusPercent}%` : "—"} sub="average across all subject offerings" />
          <Kpi label="Today's attendance" value={r.kpis.avgAttendancePercent !== null ? `${r.kpis.avgAttendancePercent}%` : "Not marked yet"} sub="across sections marked so far today" />
          <Kpi label="Open academic approvals" value={String(r.kpis.openApprovals)} sub="unassigned offerings + sections without an advisor" />
        </div>

        <Card hover={false} style={{ padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>Class-wise exam results</div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", margin: "5px 0 16px" }}>Each class&rsquo;s own most recently published exam</div>
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 90px 90px 90px 100px", gap: 10, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>CLASS</div><div>EXAM</div><div>ADVISOR</div>
              <div style={{ textAlign: "right" }}>STRENGTH</div><div style={{ textAlign: "right" }}>PASS %</div><div style={{ textAlign: "right" }}>AVERAGE</div><div style={{ textAlign: "right" }}>BELOW 35%</div>
            </div>
            {r.classResults.map((row) => (
              <div key={row.sectionId} className="acc-row-hover" style={{ display: "grid", gridTemplateColumns: "90px 1fr 1fr 90px 90px 90px 100px", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--acc-divider-soft)", fontFamily: "var(--acc-font-mono)", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "var(--acc-navy)" }}>{row.gradeName} {row.sectionName}</div>
                <div style={{ fontFamily: "inherit" }}>{row.examName}</div>
                <div style={{ fontFamily: "inherit" }}>{row.advisorName ?? "—"}</div>
                <div style={{ textAlign: "right" }}>{row.strength}</div>
                <div style={{ textAlign: "right", color: (row.passPercent ?? 0) < 60 ? "var(--acc-red)" : undefined }}>{row.passPercent ?? "—"}%</div>
                <div style={{ textAlign: "right" }}>{row.average ?? "—"}</div>
                <div style={{ textAlign: "right", color: row.below35 > 0 ? "var(--acc-red)" : undefined }}>{row.below35}</div>
              </div>
            ))}
            {r.classResults.length === 0 && <EmptyPanel label="No published exam results yet for your scope." />}
          </div>
        </Card>

        <Card hover={false} style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Subject-wise performance</div>
          {r.subjectPerformance.map((s) => (
            <div key={s.subjectName} style={{ display: "grid", gridTemplateColumns: "200px 1fr 80px", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{s.subjectName}</div>
              <div style={{ height: 8, background: "var(--acc-border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: 8, background: "var(--acc-accent)", width: `${s.average}%` }} />
              </div>
              <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 13, color: "var(--acc-body)", textAlign: "right" }}>{s.average}%</div>
            </div>
          ))}
          {r.subjectPerformance.length === 0 && <EmptyPanel label="No subject-wise marks yet for your scope." />}
        </Card>

        <Card hover={false} style={{ padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>Attendance register · class-wise</div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", margin: "5px 0 16px" }}>Today&rsquo;s marking snapshot</div>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 95px 95px 110px 120px", gap: 10, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>CLASS</div><div style={{ textAlign: "right" }}>STRENGTH</div><div style={{ textAlign: "right" }}>PRESENT</div><div style={{ textAlign: "right" }}>ABSENT</div><div>STATUS</div>
            </div>
            {r.attendance.map((a) => (
              <div key={a.sectionId} className="acc-row-hover" style={{ display: "grid", gridTemplateColumns: "90px 95px 95px 110px 120px", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--acc-divider-soft)", fontFamily: "var(--acc-font-mono)", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "var(--acc-navy)", fontFamily: "inherit" }}>{a.gradeName} {a.sectionName}</div>
                <div style={{ textAlign: "right" }}>{a.studentCount}</div>
                <div style={{ textAlign: "right" }}>{a.presentCount}</div>
                <div style={{ textAlign: "right", color: a.absentCount > 0 ? "var(--acc-red)" : undefined }}>{a.absentCount}</div>
                <div style={{ fontFamily: "inherit" }}>{a.sessionFound ? (a.isLocked ? "Locked" : "Marked") : "Not marked yet"}</div>
              </div>
            ))}
            {r.attendance.length === 0 && <EmptyPanel label="No sections in your scope." />}
          </div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load reports."} />;
  }
}
