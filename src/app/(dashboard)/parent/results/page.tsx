// Performance -- pixel-rebuilt from the design's own isPerformance screen.
// Real exam/mark data (listResultExams/getResults). The design's own
// "Rank X of 42" and "Class teacher's remark" / "Download report card
// (PDF)" have no real backend anywhere in this schema for a parent-scoped
// read (no cross-student ranking exposed to Parent, no remark/PDF
// generation endpoint) -- both are honestly omitted rather than invented;
// see this file's own note for the exact gap.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { getResults, listChildren, listResultExams, resolveSelectedChild } from "@/lib/parent-api";

function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  return "D";
}

export default async function ParentResultsPage({ searchParams }: { searchParams: Promise<{ studentId?: string; examId?: string }> }) {
  try {
    const { studentId: requestedStudentId, examId: requestedExamId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const exams = await listResultExams(selected.studentId);
    const selectedExam = exams.find((e) => e.examId === requestedExamId) ?? exams[exams.length - 1];
    const result = selectedExam ? await getResults(selected.studentId, selectedExam.examId) : null;

    return (
      <div className="parent-scope" style={{ width: "100%" }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: "var(--par-ink)" }}>Performance</div>
        <div style={{ fontSize: 14, color: "var(--par-body-muted)", marginBottom: 20 }}>Report card · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>

        {exams.length === 0 ? (
          <EmptyPanel label="No exams published yet." />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(exams.length, 4)}, minmax(0,1fr))`, gap: 10, marginBottom: 20 }}>
              {exams.map((e) => {
                const active = e.examId === selectedExam?.examId;
                return (
                  <a key={e.examId} href={`/parent/results?studentId=${selected.studentId}&examId=${e.examId}`} style={{ textDecoration: "none" }}>
                    <div style={{ borderRadius: 12, padding: 12, textAlign: "center", background: active ? "var(--par-navy)" : "#fff", border: active ? undefined : "1px solid var(--par-border)", color: active ? "#fff" : "var(--par-ink)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{e.examName}</div>
                    </div>
                  </a>
                );
              })}
            </div>

            {result && result.percent !== null ? (
              <>
                <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--par-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Total marks</div>
                      <div><span style={{ fontSize: 30, fontWeight: 800, color: "var(--par-ink)" }}>{result.totalObtained}</span><span style={{ fontSize: 14, color: "var(--par-body-muted)" }}> / {result.totalMax}</span></div>
                    </div>
                  </div>
                  <div style={{ height: 8, background: "var(--par-divider)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ height: "100%", background: "var(--par-primary)", width: `${result.percent}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, background: "var(--par-tint)", color: "var(--par-primary)", padding: "5px 12px", borderRadius: 20 }}>Grade {gradeFor(result.percent)} · {result.percent}% average</span>
                </div>

                <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 20 }}>
                  {result.subjects.map((s) => (
                    <div key={s.subjectName} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--par-divider)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--par-tint)", color: "var(--par-primary)", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {s.subjectName.slice(0, 3).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{s.subjectName}</div>
                        {s.isAbsent && <div style={{ fontSize: 12, color: "var(--par-red)" }}>Absent</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div><span style={{ fontSize: 16, fontWeight: 800, color: "var(--par-ink)" }}>{s.isAbsent ? "—" : s.marksObtained}</span><span style={{ fontSize: 12, color: "var(--par-body-muted)" }}>/{s.maxMarks}</span></div>
                        {!s.isAbsent && s.marksObtained !== null && (
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--par-primary)" }}>{gradeFor(Math.round((s.marksObtained / s.maxMarks) * 100))}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyPanel label="Results not published yet." />
            )}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load performance."} />;
  }
}
