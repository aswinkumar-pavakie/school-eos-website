import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listChildren, listCurrentTerm, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentTermPage({
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

    const subjects = await listCurrentTerm(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Current Term</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {subjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No subjects yet" body="Subjects will appear here once this term's offerings are set up." />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {subjects.map((s) => (
              <Link
                key={s.subjectOfferingId}
                href={`/parent/term/${s.subjectOfferingId}?studentId=${selected.studentId}`}
                className="rounded-[var(--radius-card)] border border-border bg-surface p-4 hover:border-primary/40"
              >
                <p className="text-sm font-bold text-text">{s.subjectName}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {orDash(s.teacherName)}
                  {s.weeklyPeriods !== null ? ` · ${s.weeklyPeriods} periods/week` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load current term. Nothing was changed — try again." />;
  }
}
