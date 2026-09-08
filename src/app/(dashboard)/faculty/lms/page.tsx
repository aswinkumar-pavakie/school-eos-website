import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listLmsSubjects } from "@/lib/faculty-lms-api";

export default async function LmsSubjectsPage() {
  try {
    const subjects = await listLmsSubjects();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Current Term</h1>
          <p className="mt-1 text-sm text-text-muted">One folder per subject you teach, shared across every class you teach it to.</p>
        </div>

        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet" body="You are not assigned to teach any subject." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link
                key={s.subjectId}
                href={`/faculty/lms/${s.subjectId}`}
                className="rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <p className="text-sm font-bold text-text">{s.subjectName}</p>
                <p className="mt-1 text-xs text-text-muted">{s.classes.map((c) => `${c.gradeName} ${c.sectionName}`).join(", ")}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load Current Term. Nothing was changed — try again." />;
  }
}
