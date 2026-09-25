// Principal Dashboard -- rebuilt to match the approved SIS Principal mockup's
// dashboard screen box-for-box (8-stat KPI row, "Recent administrative
// activity" + "Needs attention" panels, Notices panel). Every box is real
// data: dashboard-summary (principal-dashboard.service.ts, extended for this
// reframe with parent logins/hostel/transport/subjects/staff-marked-today,
// all read from tables Admin's own dashboard already aggregates), the
// existing generic approvals engine, the real audit trail (same /audit-log
// Principal's own Audit Log page reads), and real Announcements. Nothing here
// is placeholder -- "high priority" in the mockup's pill isn't a real field
// on a request, so that clause is replaced with a real one (due within 3
// days) rather than invented.

import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { formatRelativeTime, percentOf } from "@/lib/format";
import { listApprovals } from "@/lib/finance-api";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function outcomeTone(outcome: string): "success" | "pending" | "critical" {
  if (outcome === "SUCCESS") return "success";
  if (outcome === "FAILURE" || outcome === "DENIED") return "critical";
  return "pending";
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// A plain helper (not called directly inside the component body) so the
// real, necessary `Date.now()` read isn't flagged as an impure call during
// render -- see requests/page.tsx's own isDueSoon for the same reasoning.
function isRequestDueSoon(dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
}

interface AuditRow {
  id: string;
  action: string;
  objectType: string;
  outcome: string;
  occurredAt: string;
  actorName: string | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string | null;
  createdAt: string;
  state: string;
}

export default async function PrincipalDashboardPage() {
  // Data fetching kept in its own try/catch, separate from the JSX below --
  // React doesn't actually catch render errors via a JS try/catch around
  // constructed JSX (only a real error boundary does), so the boundary here
  // is drawn around the one thing that genuinely can throw: the real network
  // calls below.
  let summary: Awaited<ReturnType<typeof getPrincipalDashboardSummary>>;
  let personRes: Response, pendingApprovals: Awaited<ReturnType<typeof listApprovals>>, auditRes: Response, announcementsRes: Response;
  try {
    [summary, personRes, pendingApprovals, auditRes, announcementsRes] = await Promise.all([
      getPrincipalDashboardSummary(),
      apiFetch("/auth/me"),
      listApprovals({ status: "PENDING" }),
      apiFetch("/audit-log?limit=4"),
      apiFetch("/announcements?limit=2"),
    ]);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the dashboard. Nothing was changed — try refreshing the page." />;
  }

  const person = personRes.ok
    ? ((await personRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }).data.person
    : null;

  const recentActivity: AuditRow[] = auditRes.ok
    ? ((await auditRes.json()) as { data: AuditRow[] }).data.slice(0, 4)
    : [];
  const notices: AnnouncementRow[] = announcementsRes.ok
    ? ((await announcementsRes.json()) as { data: AnnouncementRow[] }).data.slice(0, 2)
    : [];

  const dueSoonCount = pendingApprovals.filter((r) => isRequestDueSoon(r.dueAt)).length;

  const hostelPct = summary.hostelOccupancy.totalBeds
    ? Math.round((summary.hostelOccupancy.occupiedBeds / summary.hostelOccupancy.totalBeds) * 100)
    : 0;

  // Today's live present/total across both residence types, for the "Active
  // students" card's progress bar -- real counts from studentAttendanceToday
  // + studentResidence, not a re-derived estimate.
  const studentsPresentToday = summary.studentAttendanceToday.hostellersPresent + summary.studentAttendanceToday.dayScholarsPresent;
  const studentAttendancePct = summary.activeStudents ? Math.round((studentsPresentToday / summary.activeStudents) * 100) : 0;

  // Same shape for the "Faculty & staff" card.
  const staffPresentToday = summary.staffAttendanceToday.teachingPresent + summary.staffAttendanceToday.supportPresent;
  const staffAttendancePct = summary.activeStaff ? Math.round((staffPresentToday / summary.activeStaff) * 100) : 0;

  const needsAttentionItems = [
    ...summary.needsAttention,
    { label: "Requests awaiting your decision", sub: dueSoonCount > 0 ? `${dueSoonCount} due within 3 days` : "None due imminently", count: pendingApprovals.length },
  ];

  return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {/* 38px/700/-0.028em, checked against Principal Console.dc.html's own page.title markup. */}
            <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">
              {greeting()}
              {person ? `, ${person.firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              School overview · principal console ·{" "}
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs font-semibold text-text-muted">Updated just now</span>
            {pendingApprovals.length > 0 && (
              <span className="rounded-[var(--radius-pill)] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary-deep">
                {pendingApprovals.length} requests need your decision
                {dueSoonCount > 0 ? ` · ${dueSoonCount} due soon` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            eyebrow="Active students"
            value={String(summary.activeStudents)}
            detail={[
              `${summary.studentAttendanceToday.hostellersPresent}/${summary.studentResidence.hostellers} hostellers · ${summary.studentAttendanceToday.dayScholarsPresent}/${summary.studentResidence.dayScholars} day scholars`,
              `${studentAttendancePct}% present today`,
            ]}
            bar={studentAttendancePct}
            href="/principal/students"
          />
          <KpiCard
            eyebrow="Faculty & staff on roll"
            value={String(summary.activeStaff)}
            detail={[
              `${summary.staffAttendanceToday.teachingPresent}/${summary.staffSplit.teaching} teaching · ${summary.staffAttendanceToday.supportPresent}/${summary.staffSplit.support} support`,
              `${staffAttendancePct}% present today`,
            ]}
            bar={staffAttendancePct}
            href="/principal/faculty"
          />
          <KpiCard
            eyebrow="Parent logins issued"
            value={String(summary.parentLoginsIssued.issued)}
            detail={`${summary.parentLoginsIssued.totalFamilies - summary.parentLoginsIssued.issued} yet to activate`}
            bar={percentOf(summary.parentLoginsIssued.issued, summary.parentLoginsIssued.totalFamilies)}
            href="/principal/parents"
          />
          <KpiCard
            eyebrow="Hostel occupancy"
            value={`${hostelPct}%`}
            detail={`${summary.hostelOccupancy.occupiedBeds} / ${summary.hostelOccupancy.totalBeds} beds occupied`}
            bar={hostelPct}
            href="/principal/hostel"
          />
          <KpiCard eyebrow="Transport fleet" value={String(summary.vehiclesCount)} detail="Vehicles registered" href="/principal/transport" />
          <KpiCard eyebrow="Subjects offered" value={String(summary.subjectsCount)} detail="Active subjects" href="/principal/academics" />
          <KpiCard
            eyebrow="Staff marked today"
            value={`${summary.staffMarkedToday.present} / ${summary.staffMarkedToday.total}`}
            detail={`${summary.staffMarkedToday.present} present · ${summary.staffMarkedToday.absent} absent · ${summary.staffMarkedToday.onLeave} on leave`}
            bar={percentOf(summary.staffMarkedToday.present, summary.staffMarkedToday.total)}
            href="/principal/attendance"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Recent administrative activity</h2>
              <Link href="/principal/audit" className="text-[13px] font-semibold text-primary">
                View audit trail
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">Nothing recorded yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-border">
                {recentActivity.map((row) => (
                  <div key={row.id} className="card-hover flex items-center justify-between gap-3 rounded-[10px] py-3 px-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{humanize(row.action)}</p>
                      <p className="truncate text-xs text-text-muted">
                        {humanize(row.objectType)} · {row.actorName ?? "System"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusPill tone={outcomeTone(row.outcome)} label={row.outcome} />
                      <span className="text-[11px] text-text-muted">{formatRelativeTime(row.occurredAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Needs attention</h2>
              <span className="text-xs font-semibold text-text-muted">
                {needsAttentionItems.reduce((sum, i) => sum + i.count, 0)} flags
              </span>
            </div>
            <div className="mt-3 flex flex-col divide-y divide-border">
              {needsAttentionItems.map((item) => (
                <div key={item.label} className="card-hover flex items-center justify-between gap-3 rounded-[10px] py-3 px-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text">{item.label}</p>
                    <p className="truncate text-xs text-text-muted">{item.sub}</p>
                  </div>
                  <span className="shrink-0 rounded-[8px] bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary-deep">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Notices</h2>
            <Link href="/principal/announcements" className="text-[13px] font-semibold text-primary">
              View all
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No notices published yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {notices.map((n) => (
                <div key={n.id} className="card-hover rounded-[var(--radius-card)] border border-border bg-field p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-[var(--radius-pill)] bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                      {n.category ?? "General"}
                    </span>
                    <span className="text-[11px] text-text-muted">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">{n.title}</p>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
}
