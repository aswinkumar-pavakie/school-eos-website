// Student-wise marks for one finished exam x subject -- reached from a
// Finished row on the Class Teacher's Exams screen. Real data only, already
// scoped server-side (the caller owns the offering or is the section's class
// advisor).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getMarksForExamSubject } from "@/lib/faculty-exams-api";
import { BackButton } from "@/components/faculty-ui/BackButton";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

export default async function ExamSubjectMarksPage({
  params,
}: {
  params: Promise<{ subjectOfferingId: string; examId: string }>;
}) {
  const { subjectOfferingId, examId } = await params;
  let students: Awaited<ReturnType<typeof getMarksForExamSubject>>["students"];
  try {
    ({ students } = await getMarksForExamSubject(subjectOfferingId, examId));
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load these marks. Nothing was changed -- try again." />;
  }

  const scored = students.filter((s) => s.marksObtained !== null && s.maxMarks);
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, s) => sum + ((s.marksObtained as number) / (s.maxMarks as number)) * 100, 0) / scored.length)
      : null;
  const ordered = [...students].sort((a, b) => (a.rollNo ?? 9999) - (b.rollNo ?? 9999));

  return (
    <div>
      <BackButton href="/faculty/class-exams?tab=finished" label="Back to exams" />
      <h1 style={{ margin: "18px 0 0", font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Marks</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
        {average !== null ? `Class average ${average}%` : "No marks entered yet"}
      </p>

      <div style={{ marginTop: 20 }}>
        {ordered.length === 0 ? (
          <FacultyEmptyState message="No students found." />
        ) : (
          <Card padding="6px 22px">
            <div
              className="grid"
              style={{
                gridTemplateColumns: "2fr 1fr 1.4fr",
                gap: 12,
                padding: "16px 0 12px",
                borderBottom: "1px solid var(--fac-border)",
                font: "600 11px/1 var(--fac-font-sans)",
                letterSpacing: ".07em",
                color: "var(--fac-tertiary)",
              }}
            >
              <div>STUDENT</div>
              <div>ROLL NO</div>
              <div style={{ textAlign: "right" }}>MARKS</div>
            </div>
            {ordered.map((s) => {
              const percent = s.marksObtained !== null && s.maxMarks ? Math.round((s.marksObtained / s.maxMarks) * 100) : null;
              return (
                <div
                  key={s.studentId}
                  className="grid items-center"
                  style={{ gridTemplateColumns: "2fr 1fr 1.4fr", gap: 12, padding: "16px 0", borderBottom: "1px solid var(--fac-divider)" }}
                >
                  <span style={{ font: "600 15px/1.3 var(--fac-font-sans)", color: "var(--fac-navy)" }}>{s.studentName}</span>
                  <span className="fac-font-mono" style={{ font: "400 14px/1 var(--fac-font-mono)", color: "var(--fac-body-muted)" }}>{s.rollNo ?? "--"}</span>
                  <span
                    style={{
                      textAlign: "right",
                      font: "700 14px/1 var(--fac-font-sans)",
                      color: s.isAbsent ? "var(--fac-red)" : s.marksObtained !== null ? "var(--fac-ink)" : "var(--fac-tertiary)",
                    }}
                  >
                    {s.isAbsent ? "Absent" : s.marksObtained !== null ? `${s.marksObtained}/${s.maxMarks}${percent !== null ? ` (${percent}%)` : ""}` : "Not entered"}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
