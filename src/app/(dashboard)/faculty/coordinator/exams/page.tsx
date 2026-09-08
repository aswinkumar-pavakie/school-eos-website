import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getCoordinatorStructure, listCoordinatorExams } from "@/lib/faculty-coordinator-api";
import { CreateExamModal } from "./CreateExamModal";

const STATE_LABELS: Record<string, string> = {
  DRAFT: "Draft", SCHEDULED: "Scheduled", CONDUCTED: "Conducted", MARKS_ENTRY: "Marks entry open",
  VERIFIED: "Verified", PUBLISHED: "Published", LOCKED: "Locked",
};

export default async function CoordinatorExamsPage() {
  try {
    const [{ grades }, exams] = await Promise.all([getCoordinatorStructure(), listCoordinatorExams()]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/faculty/coordinator" className="text-xs font-semibold text-text-muted hover:text-text">← Coordinator</Link>
            <h1 className="mt-1 text-2xl font-extrabold text-text">Examinations</h1>
            <p className="mt-1 text-sm text-text-muted">Configure the schedule, then monitor marks-entry readiness.</p>
          </div>
          <CreateExamModal grades={grades} />
        </div>

        {exams.length === 0 ? (
          <EmptyState title="No exams yet" body="Create your first exam above." />
        ) : (
          <div className="flex flex-col gap-2">
            {exams.map((e) => (
              <Link key={e.examId} href={`/faculty/coordinator/exams/${e.examId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div>
                  <p className="text-sm font-bold text-text">{e.name}</p>
                  <p className="text-xs text-text-muted">{e.examType.replace(/_/g, " ")}{e.term ? ` · ${e.term}` : ""} · {e.gradeNames.join(", ")}</p>
                </div>
                <span className="rounded-[7px] bg-field px-2 py-0.5 text-xs font-bold text-text-muted">{STATE_LABELS[e.state] ?? e.state}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load examinations. Nothing was changed — try again." />;
  }
}
