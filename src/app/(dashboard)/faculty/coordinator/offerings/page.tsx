import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getCoordinatorStructure, getCoordinatorOfferings, getEligibleFaculty, getFacultyWorkload } from "@/lib/faculty-coordinator-api";
import { AssignTeacherModal } from "./AssignTeacherModal";

export default async function CoordinatorOfferingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; gradeId?: string }> }) {
  try {
    const { tab, gradeId } = await searchParams;
    const workloadTab = tab === "workload";

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/faculty/coordinator" className="text-xs font-semibold text-text-muted hover:text-text">← Coordinator</Link>
          <h1 className="mt-1 text-2xl font-extrabold text-text">Faculty &amp; Workload</h1>
          <p className="mt-1 text-sm text-text-muted">Who teaches which class, and each teacher&apos;s real weekly load.</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <Link href="/faculty/coordinator/offerings" className={`px-3 py-2 text-sm font-bold ${!workloadTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Assignments</Link>
          <Link href="/faculty/coordinator/offerings?tab=workload" className={`px-3 py-2 text-sm font-bold ${workloadTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Workload</Link>
        </div>

        {workloadTab ? <WorkloadTab /> : <AssignmentsTab gradeId={gradeId} />}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load faculty assignments. Nothing was changed — try again." />;
  }
}

async function AssignmentsTab({ gradeId }: { gradeId?: string }) {
  const [{ grades }, offerings, faculty] = await Promise.all([
    getCoordinatorStructure(),
    getCoordinatorOfferings(gradeId ? { gradeId } : {}),
    getEligibleFaculty(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Link href="/faculty/coordinator/offerings" className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${!gradeId ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}>All grades</Link>
        {grades.map((g) => (
          <Link key={g.gradeId} href={`/faculty/coordinator/offerings?gradeId=${g.gradeId}`} className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${gradeId === g.gradeId ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}>
            {g.gradeName}
          </Link>
        ))}
      </div>

      {offerings.length === 0 ? (
        <EmptyState title="No classes found" body="No subject offering matches this filter." />
      ) : (
        <div className="flex flex-col gap-2">
          {offerings.map((o) => (
            <div key={o.subjectOfferingId} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <div>
                <p className="text-sm font-bold text-text">{o.subjectName}</p>
                <p className="text-xs text-text-muted">{o.gradeName} {o.sectionName} · {o.weeklyPeriods ?? "—"} periods/wk</p>
                <p className={`mt-0.5 text-xs font-semibold ${o.teacherName ? "text-success-text" : "text-pending-text"}`}>{o.teacherName ?? "Unassigned"}</p>
              </div>
              <AssignTeacherModal offering={o} faculty={faculty} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function WorkloadTab() {
  const workload = await getFacultyWorkload();
  const maxPeriods = Math.max(1, ...workload.map((w) => w.weeklyPeriods));

  if (workload.length === 0) {
    return <EmptyState title="No faculty found" body="No teacher currently has a class in your scope." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {workload.map((w) => (
        <div key={w.staffId} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-text">{w.name}</p>
            <p className="font-mono text-sm font-bold text-text">{w.weeklyPeriods} <span className="font-sans text-xs font-normal text-text-muted">periods/wk</span></p>
          </div>
          <p className="text-xs text-text-muted">{w.offeringCount} class{w.offeringCount === 1 ? "" : "es"}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-field">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(w.weeklyPeriods / maxPeriods) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
