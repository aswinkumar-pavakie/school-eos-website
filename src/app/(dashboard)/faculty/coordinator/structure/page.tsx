import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { getCoordinatorStructure, getEligibleFaculty } from "@/lib/faculty-coordinator-api";
import { AssignAdvisorModal } from "./AssignAdvisorModal";
import { revokeAdvisorAction } from "../actions";

export default async function CoordinatorStructurePage({ searchParams }: { searchParams: Promise<{ gradeId?: string }> }) {
  try {
    const { gradeId } = await searchParams;
    const [{ grades, sections }, faculty] = await Promise.all([getCoordinatorStructure(), getEligibleFaculty()]);
    const filtered = gradeId ? sections.filter((s) => s.gradeId === gradeId) : sections;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/faculty/coordinator" className="text-xs font-semibold text-text-muted hover:text-text">← Coordinator</Link>
          <h1 className="mt-1 text-2xl font-extrabold text-text">Academic Structure</h1>
          <p className="mt-1 text-sm text-text-muted">Every grade and section in your scope, with its real class advisor.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/faculty/coordinator/structure" className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${!gradeId ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}>All grades</Link>
          {grades.map((g) => (
            <Link key={g.gradeId} href={`/faculty/coordinator/structure?gradeId=${g.gradeId}`} className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${gradeId === g.gradeId ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}>
              {g.gradeName}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No sections found" body="No section matches this filter." />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <div key={s.sectionId} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-bold text-text">{s.gradeName} {s.sectionName}</p>
                  <p className="text-xs text-text-muted">{s.studentCount} students {s.advisorName ? `· Advisor: ${s.advisorName}` : "· No advisor assigned"}</p>
                </div>
                <div className="flex gap-2">
                  <AssignAdvisorModal sectionId={s.sectionId} sectionLabel={`${s.gradeName} ${s.sectionName}`} faculty={faculty} currentAdvisorName={s.advisorName} />
                  {s.advisorRoleAssignmentId ? (
                    <form action={revokeAdvisorAction.bind(null, s.sectionId)}>
                      <PlainButton type="submit" variant="danger">Revoke</PlainButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load academic structure. Nothing was changed — try again." />;
  }
}
