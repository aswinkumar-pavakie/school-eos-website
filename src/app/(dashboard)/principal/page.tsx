// Principal Dashboard -- real data only. Per the approved API documentation
// (Principal: "dashboard/approvals on mobile, full reports on web"), this stays
// deliberately light: a few leadership-relevant institution counts (GET
// /principal/dashboard-summary, PRINCIPAL-only) plus Principal's own real pending
// approvals (the existing generic /approvals engine, reused unmodified -- same
// listApprovals() Finance's own approvals inbox already calls). Nothing here is
// placeholder data; anything not yet backed by a real endpoint (Examinations/
// Timetable approvals) is named as coming later, matching Admin dashboard's own
// convention for its own not-yet-built metrics.

import Link from "next/link";
import { redirect } from "next/navigation";
import { AcademicsIcon, FacultyIcon, StudentsIcon } from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { listApprovals } from "@/lib/finance-api";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PrincipalDashboardPage() {
  try {
    const [summary, personRes, pendingApprovals] = await Promise.all([
      getPrincipalDashboardSummary(),
      apiFetch("/auth/me"),
      listApprovals({ status: "PENDING" }),
    ]);

    const person = personRes.ok
      ? ((await personRes.json()) as { data: { person: { firstName: string } } }).data.person
      : null;

    const yearLabel = summary.currentAcademicYear
      ? summary.currentAcademicYear.name
      : "No current year set";
    const yearDetail = summary.currentAcademicYear
      ? `${formatDate(summary.currentAcademicYear.startDate)} – ${formatDate(summary.currentAcademicYear.endDate)}`
      : "Set by Admin in Academics";

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">
              {greeting()}
              {person ? `, ${person.firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-text-muted">Institution overview · Principal</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            eyebrow="Active students"
            value={String(summary.activeStudents)}
            detail="Currently enrolled"
            icon={<StudentsIcon className="h-5 w-5" />}
          />
          <KpiCard
            eyebrow="Faculty & staff on roll"
            value={String(summary.activeStaff)}
            detail="Active staff"
            icon={<FacultyIcon className="h-5 w-5" />}
          />
          <KpiCard eyebrow="Academic year" value={yearLabel} detail={yearDetail} icon={<AcademicsIcon className="h-5 w-5" />} />
        </div>

        <div className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Awaiting your decision</h2>
            <Link href="/principal/requests" className="text-[13px] font-semibold text-primary">
              View all
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No pending approvals" body="Nothing is waiting on your decision right now." />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {pendingApprovals.slice(0, 8).map((r) => (
                <Link
                  key={r.id}
                  href={`/principal/requests/${r.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-field px-4 py-3 hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text">{r.requestType.replace(/_/g, " ")}</p>
                    <p className="truncate text-xs text-text-muted">
                      {r.requestedByName ?? r.requestedBy} · raised {formatDate(r.createdAt)}
                      {r.dueAt ? ` · due ${formatDate(r.dueAt)}` : ""}
                      {r.amountPaise ? ` · ${formatMoneySummary(r.amountPaise)}` : ""}
                    </p>
                  </div>
                  <StatusPill state={r.state} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Coming in a later phase</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            These need modules that aren&apos;t built yet, so they&apos;re left out rather
            than shown with placeholder numbers.
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {[
              "Examinations & Timetable approvals — needs the Examinations module",
              "Academic oversight — Students, Parents, Faculty detail views",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13px] text-text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the dashboard. Nothing was changed — try refreshing the page." />;
  }
}
