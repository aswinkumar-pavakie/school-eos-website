import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listCoordinatorExams, listExamSubjects, getExamReadiness, getCoordinatorOfferings } from "@/lib/faculty-coordinator-api";
import { AddClassModal } from "./AddClassModal";
import { advanceExamAction } from "../../actions";

const STATE_LABELS: Record<string, string> = {
  DRAFT: "Draft", SCHEDULED: "Scheduled", CONDUCTED: "Conducted", MARKS_ENTRY: "Marks entry open",
  VERIFIED: "Verified", PUBLISHED: "Published", LOCKED: "Locked",
};
const NEXT_LABEL: Record<string, string> = { DRAFT: "Mark scheduled", SCHEDULED: "Mark conducted", CONDUCTED: "Open marks entry" };

export default async function CoordinatorExamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  try {
    const { examId } = await params;
    const { tab } = await searchParams;
    const readinessTab = tab === "readiness";

    const exams = await listCoordinatorExams();
    const exam = exams.find((e) => e.examId === examId);
    if (!exam) {
      return <EmptyState title="Exam not found" body="This exam is outside your scope." />;
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/faculty/coordinator/exams" className="text-xs font-semibold text-text-muted hover:text-text">← Examinations</Link>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-text">{exam.name}</h1>
            {NEXT_LABEL[exam.state] ? (
              <form action={advanceExamAction.bind(null, examId)}>
                <PlainButton type="submit" variant="primary">{NEXT_LABEL[exam.state]}</PlainButton>
              </form>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-text-muted">{STATE_LABELS[exam.state] ?? exam.state} · {exam.gradeNames.join(", ")}</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <Link href={`/faculty/coordinator/exams/${examId}`} className={`px-3 py-2 text-sm font-bold ${!readinessTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Subjects</Link>
          <Link href={`/faculty/coordinator/exams/${examId}?tab=readiness`} className={`px-3 py-2 text-sm font-bold ${readinessTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Readiness</Link>
        </div>

        {readinessTab ? <ReadinessTab examId={examId} /> : <SubjectsTab examId={examId} gradeNames={exam.gradeNames} />}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this exam. Nothing was changed — try again." />;
  }
}

async function SubjectsTab({ examId, gradeNames }: { examId: string; gradeNames: string[] }) {
  const [subjects, allOfferings] = await Promise.all([listExamSubjects(examId), getCoordinatorOfferings()]);
  const eligibleOfferings = allOfferings.filter((o) => gradeNames.includes(o.gradeName));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><AddClassModal examId={examId} offerings={eligibleOfferings} /></div>
      {subjects.length === 0 ? (
        <EmptyState title="No classes configured yet" body="Add a class above." />
      ) : (
        <div className="flex flex-col gap-2">
          {subjects.map((s) => (
            <div key={s.examSubjectId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <p className="text-sm font-bold text-text">{s.subjectName} · {s.gradeName} {s.sectionName}</p>
              <p className="text-xs text-text-muted">
                Max {s.maxMarks}{s.passMarks ? ` · Pass ${s.passMarks}` : ""}{s.examDate ? ` · ${formatDate(s.examDate)}` : ""}{s.room ? ` · ${s.room}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function ReadinessTab({ examId }: { examId: string }) {
  const rows = await getExamReadiness(examId);
  if (rows.length === 0) {
    return <EmptyState title="No classes configured yet" body="Add a class in the Subjects tab first." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const pct = r.expectedCount > 0 ? Math.round((r.enteredCount / r.expectedCount) * 100) : 0;
        return (
          <div key={r.examSubjectId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-sm font-bold text-text">{r.subjectName} · {r.gradeName} {r.sectionName}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-field">
                <div className={`h-full rounded-full ${pct === 100 ? "bg-success-text" : pct > 0 ? "bg-pending-text" : "bg-critical-text"}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 font-mono text-xs font-bold text-text">{r.enteredCount}/{r.expectedCount}</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">Verified {r.verifiedCount}/{r.expectedCount}</p>
          </div>
        );
      })}
    </div>
  );
}
