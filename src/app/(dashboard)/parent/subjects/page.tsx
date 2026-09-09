import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listChildren, listSubjects, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentSubjectsPage({
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

    const subjects = await listSubjects(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Subjects</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No subjects yet" body="Subjects will appear here once offerings are set up." />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {subjects.map((s) => {
              const pct = Math.max(0, Math.min(100, s.syllabusProgressPercent));
              return (
                <div key={s.subjectOfferingId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-text">{s.subjectName}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {orDash(s.teacherName)}
                        {s.weeklyPeriods !== null ? ` · ${s.weeklyPeriods} periods/week` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-text">{pct}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-field">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">Syllabus progress</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load subjects. Nothing was changed — try again." />;
  }
}
