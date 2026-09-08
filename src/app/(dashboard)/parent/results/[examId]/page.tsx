import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { getResults, listChildren, listResultExams, resolveSelectedChild } from "@/lib/parent-api";

function remarkFor(percent: number): string {
  if (percent >= 90) return "Excellent";
  if (percent >= 75) return "Good";
  if (percent >= 50) return "Satisfactory";
  return "Needs improvement";
}

export default async function ParentResultDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { examId } = await params;
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const [exams, result] = await Promise.all([
      listResultExams(selected.studentId),
      getResults(selected.studentId, examId),
    ]);
    const exam = exams.find((e) => e.examId === examId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/parent/results?studentId=${selected.studentId}`} className="text-xs font-semibold text-primary hover:underline">
              ← Report Card
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold text-text">{exam?.examName ?? "Result"}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
              {exam?.term ? ` · ${exam.term}` : ""}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {result.subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No subjects found" body="No marks have been recorded for this exam yet." />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Max marks</th>
                  <th className="px-4 py-3">Marks obtained</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.subjects.map((row) => (
                  <tr key={row.subjectName}>
                    <td className="px-4 py-3 font-semibold text-text">{row.subjectName}</td>
                    <td className="px-4 py-3 text-text">{row.maxMarks}</td>
                    <td className="px-4 py-3 text-text">
                      {row.isAbsent ? "—" : row.marksObtained !== null ? row.marksObtained : "Pending"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill state={row.isAbsent ? "ABSENT" : "PRESENT"} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-bold text-text">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{result.totalMax}</td>
                  <td className="px-4 py-3">{result.totalObtained}</td>
                  <td className="px-4 py-3">{result.percent !== null ? `${result.percent}%` : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {result.percent !== null ? (
          <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-field p-4">
            <p className="text-sm font-bold text-text">Remark: {remarkFor(result.percent)}</p>
          </div>
        ) : null}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this result. Nothing was changed — try again." />;
  }
}
