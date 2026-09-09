import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getExamSchedule, listChildren, resolveSelectedChild } from "@/lib/parent-api";
import type { ExamScheduleRow } from "@/lib/parent-api";

export default async function ParentExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const rows = await getExamSchedule(selected.studentId);
    const groups = new Map<string, ExamScheduleRow[]>();
    for (const row of rows) {
      const list = groups.get(row.examName) ?? [];
      list.push(row);
      groups.set(row.examName, list);
    }

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Exams</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {groups.size === 0 ? (
          <div className="mt-6">
            <EmptyState title="No exams scheduled" body="Nothing scheduled for this child yet." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {[...groups.entries()].map(([examName, subjects]) => (
              <div key={examName} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <h2 className="text-[15px] font-extrabold text-text">{examName}</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-text-muted">
                        <th className="px-3 py-2">Subject</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Duration</th>
                        <th className="px-3 py-2">Room</th>
                        <th className="px-3 py-2">Max marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subjects.map((s) => (
                        <tr key={s.examSubjectId}>
                          <td className="px-3 py-2 font-semibold text-text">{s.subjectName}</td>
                          <td className="px-3 py-2 text-text">{s.examDate ? formatDate(s.examDate) : "TBA"}</td>
                          <td className="px-3 py-2 text-text">{s.startTime ? s.startTime.slice(0, 5) : "TBA"}</td>
                          <td className="px-3 py-2 text-text">{s.durationMinutes !== null ? `${s.durationMinutes} min` : "TBA"}</td>
                          <td className="px-3 py-2 text-text">{s.room ?? "TBA"}</td>
                          <td className="px-3 py-2 text-text">{s.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load exam schedule. Nothing was changed — try again." />;
  }
}
