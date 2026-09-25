// Performance -- pixel-adapted from the design's own Performance screen.
// Real exam marks/rank/grade-distribution, reusing the exact same
// computation a class advisor's own screen already uses
// (FacultyClassResultsService), server-side scoped to the coordinator's own
// sections -- see faculty-academic-coordinator.service.ts's own
// getPerformance.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorStructure, getPerformance, listPerformanceExams } from "@/lib/faculty-coordinator-api";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ sectionId?: string; examId?: string }> }) {
  const { sectionId: sectionIdParam, examId: examIdParam } = await searchParams;

  try {
    const { sections } = await getCoordinatorStructure();
    if (sections.length === 0) return <ErrorState message="No sections in your scope." />;
    const sectionId = sectionIdParam || sections[0].sectionId;

    const exams = await listPerformanceExams(sectionId);
    const examId = examIdParam || exams[0]?.examId;
    const results = examId ? await getPerformance(sectionId, examId) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Performance</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>Exam marks and rank for classes under your co-ordination</div>
        </div>

        <form style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select name="sectionId" defaultValue={sectionId} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", fontSize: 14, background: "#fff" }}>
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.gradeName} {s.sectionName}
              </option>
            ))}
          </select>
          <select name="examId" defaultValue={examId} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", fontSize: 14, background: "#fff" }}>
            {exams.map((e) => (
              <option key={e.examId} value={e.examId}>
                {e.examName}
              </option>
            ))}
          </select>
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
        </form>

        {exams.length === 0 && <EmptyPanel label="No published exams for this section yet." />}

        {results && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>CLASS AVERAGE</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>{results.classAvg ?? "—"}%</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>TOPPER</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>{results.topper ?? "—"}%</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>PASS RATE</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", marginTop: 6 }}>
                  {results.pass.count}/{results.pass.total}
                </div>
              </div>
            </div>

            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Rank list</div>
              <div style={{ maxHeight: 620, overflowY: "auto" }}>
                {[...results.students]
                  .filter((s) => s.percent !== null)
                  .sort((a, b) => (b.totalObtained / (b.totalMax || 1)) - (a.totalObtained / (a.totalMax || 1)))
                  .map((s, i) => (
                    <div key={s.studentId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 6px", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                      <div style={{ width: 44, flex: "0 0 44px", textAlign: "center", background: "var(--acc-accent-tint)", color: "var(--acc-accent)", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 800 }}>#{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--acc-navy)" }}>{s.studentName}</div>
                        <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12, color: "var(--acc-tertiary)", marginTop: 2 }}>Roll {s.rollNo ?? "—"}</div>
                        <div style={{ height: 6, background: "#eef2f8", borderRadius: 99, marginTop: 9, overflow: "hidden" }}>
                          <div style={{ height: 6, background: "var(--acc-accent)", width: `${s.percent}%` }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 14, color: "var(--acc-navy)" }}>
                          {s.totalObtained}/{s.totalMax}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-accent)", marginTop: 3 }}>{s.percent}%</div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 14 }}>Grade distribution</div>
              {results.gradeDistribution.map((band) => (
                <div key={band.grade} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0" }}>
                  <div style={{ width: 140, flex: "0 0 140px", fontSize: 13.5, fontWeight: 700, color: "var(--acc-navy)" }}>{band.label}</div>
                  <div style={{ flex: 1, height: 8, background: "#eef2f8", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: 8, background: "var(--acc-accent)", width: `${band.percentOfClass}%` }} />
                  </div>
                  <div style={{ width: 40, textAlign: "right", fontFamily: "var(--acc-font-mono)", fontSize: 13 }}>{band.count}</div>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load performance."} />;
  }
}
