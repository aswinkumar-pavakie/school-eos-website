// Syllabus tracking -- real syllabus_unit/syllabus_progress tables (already
// populated), the exact same computation Parent's own "Subjects" screen
// already uses per child, rolled up across every subject offering in scope.
// Read-only -- actually marking a unit done stays the subject teacher's own
// job (this module has no write path onto syllabus_progress).

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import { listSyllabusCoverage } from "@/lib/faculty-coordinator-api";

export default async function SyllabusPage() {
  try {
    const rows = await listSyllabusCoverage();
    const avg = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : null;
    const behindCount = rows.filter((r) => r.behindUnits > 0).length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Syllabus tracking</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {avg !== null ? `${avg}% average coverage` : "No syllabus data yet"} · {behindCount} subject{behindCount === 1 ? "" : "s"} behind schedule
          </div>
        </div>

        <Card hover={false} style={{ padding: "20px 22px", overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr 1fr 100px", gap: 12, fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
              <div>CLASS</div>
              <div>SUBJECT</div>
              <div>TEACHER</div>
              <div>COVERAGE</div>
              <div style={{ textAlign: "right" }}>STATUS</div>
            </div>
            {rows.map((r) => (
              <div key={r.subjectOfferingId} className="acc-row-hover" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr 1fr 100px", gap: 12, alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--acc-navy)" }}>
                  {r.gradeName} {r.sectionName}
                </div>
                <div style={{ fontSize: 14, color: "#334155" }}>{r.subjectName}</div>
                <div style={{ fontSize: 13.5, color: "#475569" }}>{r.teacherName ?? "—"}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#eef2f8", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: 6, background: r.percent < 50 ? "var(--acc-red)" : "var(--acc-accent)", width: `${r.percent}%` }} />
                    </div>
                    <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12.5, color: "#334155", minWidth: 32, textAlign: "right" }}>{r.percent}%</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--acc-tertiary)", marginTop: 3 }}>{r.doneUnits}/{r.totalUnits} units</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {r.behindUnits > 0 ? <StatusPill label={`${r.behindUnits} behind`} tone="red" /> : <StatusPill label="On track" tone="green" />}
                </div>
              </div>
            ))}
            {rows.length === 0 && <EmptyPanel label="No syllabus units configured for your scope yet." />}
          </div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load syllabus tracking."} />;
  }
}
