import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel, PrimaryButton } from "@/components/academic-coordinator-ui/primitives";
import { formatDate } from "@/lib/format";
import { getCoordinatorOfferings, getExamReadiness, listCoordinatorExams, listExamSubjects } from "@/lib/faculty-coordinator-api";
import { AddSubjectForm } from "./AddSubjectForm";
import { advanceExamAction } from "../actions";

const STATE_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  CONDUCTED: "Conducted",
  MARKS_ENTRY: "Marks entry open",
  VERIFIED: "Verified",
  PUBLISHED: "Published",
  LOCKED: "Locked",
};
const NEXT_LABEL: Record<string, string> = { DRAFT: "Mark scheduled", SCHEDULED: "Mark conducted", CONDUCTED: "Open marks entry" };

export default async function ExamDetailPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { examId } = await params;
  const { tab } = await searchParams;
  const readinessTab = tab === "readiness";

  try {
    const exams = await listCoordinatorExams();
    const exam = exams.find((e) => e.examId === examId);
    if (!exam) return <EmptyPanel label="This exam is outside your scope." />;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Link href="/academic-coordinator/exams?tab=history" style={{ fontSize: 13, fontWeight: 600, color: "var(--acc-accent)" }}>
              ← Exam setup
            </Link>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--acc-navy)", marginTop: 4 }}>{exam.name}</div>
            <div style={{ fontSize: 13, color: "var(--acc-tertiary)", marginTop: 2 }}>
              {STATE_LABELS[exam.state] ?? exam.state} · {exam.gradeNames.join(", ")}
            </div>
          </div>
          {NEXT_LABEL[exam.state] && (
            <form action={advanceExamAction.bind(null, examId)}>
              <PrimaryButton type="submit">{NEXT_LABEL[exam.state]}</PrimaryButton>
            </form>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--acc-border)" }}>
          <Link href={`/academic-coordinator/exams/${examId}`} style={{ padding: "10px 6px", fontSize: 14, fontWeight: 700, color: !readinessTab ? "var(--acc-accent)" : "var(--acc-tertiary)", borderBottom: !readinessTab ? "2px solid var(--acc-accent)" : "2px solid transparent" }}>
            Subjects
          </Link>
          <Link href={`/academic-coordinator/exams/${examId}?tab=readiness`} style={{ padding: "10px 6px", fontSize: 14, fontWeight: 700, color: readinessTab ? "var(--acc-accent)" : "var(--acc-tertiary)", borderBottom: readinessTab ? "2px solid var(--acc-accent)" : "2px solid transparent" }}>
            Readiness
          </Link>
        </div>

        {readinessTab ? <ReadinessTab examId={examId} /> : <SubjectsTab examId={examId} gradeNames={exam.gradeNames} />}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this exam."} />;
  }
}

async function SubjectsTab({ examId, gradeNames }: { examId: string; gradeNames: string[] }) {
  const [subjects, allOfferings] = await Promise.all([listExamSubjects(examId), getCoordinatorOfferings()]);
  const eligibleOfferings = allOfferings.filter((o) => gradeNames.includes(o.gradeName));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <AddSubjectForm examId={examId} offerings={eligibleOfferings} />
      </div>
      {subjects.length === 0 && <EmptyPanel label="No classes configured yet." />}
      {subjects.map((s) => (
        <Card key={s.examSubjectId} style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--acc-navy)" }}>
            {s.gradeName} {s.sectionName} · {s.subjectName}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 4 }}>
            Max {s.maxMarks}
            {s.passMarks ? ` · Pass ${s.passMarks}` : ""}
            {s.examDate ? ` · ${formatDate(s.examDate)}` : " · Date not set"}
            {s.room ? ` · ${s.room}` : ""}
          </div>
        </Card>
      ))}
    </div>
  );
}

async function ReadinessTab({ examId }: { examId: string }) {
  const rows = await getExamReadiness(examId);
  if (rows.length === 0) return <EmptyPanel label="Add a class in the Subjects tab first." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((r) => {
        const pct = r.expectedCount > 0 ? Math.round((r.enteredCount / r.expectedCount) * 100) : 0;
        return (
          <Card key={r.examSubjectId} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--acc-navy)" }}>
              {r.gradeName} {r.sectionName} · {r.subjectName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <div style={{ flex: 1, height: 8, background: "var(--acc-border)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: 8, borderRadius: 99, background: pct === 100 ? "var(--acc-green)" : pct > 0 ? "var(--acc-amber)" : "var(--acc-red)", width: `${pct}%` }} />
              </div>
              <span style={{ fontFamily: "var(--acc-font-mono)", fontSize: 13, fontWeight: 700, color: "var(--acc-navy)" }}>
                {r.enteredCount}/{r.expectedCount}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 6 }}>Verified {r.verifiedCount}/{r.expectedCount}</div>
          </Card>
        );
      })}
    </div>
  );
}
