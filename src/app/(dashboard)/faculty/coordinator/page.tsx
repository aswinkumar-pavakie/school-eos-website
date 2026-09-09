import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { getCoordinatorDashboard } from "@/lib/faculty-coordinator-api";

const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-Primary", PRIMARY: "Primary", MIDDLE: "Middle", SECONDARY: "Secondary", HIGHER_SECONDARY: "Higher Secondary",
};

const TILES = [
  { href: "/faculty/coordinator/structure", label: "Academic Structure", detail: "Grades, sections & class advisors" },
  { href: "/faculty/coordinator/offerings", label: "Faculty & Workload", detail: "Who teaches which class" },
  { href: "/faculty/coordinator/timetable", label: "Class Timetable", detail: "Draft, then publish" },
  { href: "/faculty/coordinator/exams", label: "Examinations", detail: "Configure & monitor readiness" },
  { href: "/faculty/coordinator/calendar", label: "Academic Calendar", detail: "Create, edit & delete events" },
];

export default async function CoordinatorDashboardPage() {
  try {
    const d = await getCoordinatorDashboard();

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Academic Coordinator</h1>
          <p className="mt-1 text-sm text-text-muted">{d.stages.map((s) => STAGE_LABELS[s] ?? s).join(", ")}</p>
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Grades" value={String(d.gradeCount)} />
          <KpiCard eyebrow="Sections" value={String(d.sectionCount)} />
          <KpiCard eyebrow="Students" value={String(d.studentCount)} />
          <KpiCard eyebrow="Faculty" value={String(d.facultyCount)} />
        </KpiGrid>

        {d.unassignedOfferings > 0 || d.sectionsWithoutAdvisor > 0 ? (
          <div className="rounded-[var(--radius-card)] border border-pending-text/30 bg-pending-bg px-4 py-3 text-sm text-pending-text">
            {d.unassignedOfferings > 0 ? `${d.unassignedOfferings} class${d.unassignedOfferings === 1 ? "" : "es"} without a teacher. ` : ""}
            {d.sectionsWithoutAdvisor > 0 ? `${d.sectionsWithoutAdvisor} section${d.sectionsWithoutAdvisor === 1 ? "" : "s"} without a class advisor.` : ""}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <p className="text-sm font-bold text-text">{t.label}</p>
              <p className="mt-1 text-xs text-text-muted">{t.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the Coordinator dashboard. Nothing was changed — try again." />;
  }
}
