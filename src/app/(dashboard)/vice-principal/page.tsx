// Vice Principal Dashboard -- rebuilt to mirror Principal's own dashboard
// structure box-for-box (same 8-stat KPI row, same two-panel row, same
// Notices panel), per explicit instruction, but showing only what VP is
// actually authorized for. Two real, confirmed differences from Principal's
// version:
//  - No "Recent administrative activity" panel -- audit-log.controller.ts is
//    @Roles('ADMIN', 'PRINCIPAL') only, VICE_PRINCIPAL has no grant. Real
//    "Upcoming on the calendar" data (calendar-events, VP already reads this
//    for its own Academic Calendar page) takes that panel's place instead of
//    silently showing an empty/errored activity feed.
//  - No "Requests awaiting your decision" needs-attention item -- a live DB
//    check this session confirmed VICE_PRINCIPAL is never an
//    approver_role_code on any approval_policy row, so that queue is always
//    empty for VP and would misleadingly imply a decision queue that doesn't
//    exist for this role. The rest of "Needs attention" (summary.needsAttention)
//    comes from the same /principal/dashboard-summary endpoint VP already
//    calls -- @Roles('PRINCIPAL', 'VICE_PRINCIPAL'), genuine parity with
//    Principal on every other field in that response (KPIs below included).
// Notices reuses the same real /announcements GET, which already grants
// VICE_PRINCIPAL read access (announcements.controller.ts).

import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, apiFetch } from "@/lib/api";
import { formatDate, formatRelativeTime, percentOf } from "@/lib/format";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";

interface CalendarEventRow {
  id: string;
  title: string;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string | null;
  createdAt: string;
  state: string;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function VicePrincipalDashboardPage() {
  // Data fetching kept in its own try/catch, separate from the JSX below --
  // React doesn't actually catch render errors via a JS try/catch around
  // constructed JSX (only a real error boundary does), so the boundary here
  // is drawn around the one thing that genuinely can throw: the real network
  // calls below.
  let summary: Awaited<ReturnType<typeof getPrincipalDashboardSummary>>;
  let personRes: Response, eventsRes: Response, announcementsRes: Response;
  try {
    const today = new Date().toISOString().slice(0, 10);
    [summary, personRes, eventsRes, announcementsRes] = await Promise.all([
      getPrincipalDashboardSummary(),
      apiFetch("/auth/me"),
      apiFetch(`/calendar-events?fromDate=${today}`),
      apiFetch("/announcements?limit=2"),
    ]);
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the dashboard. Nothing was changed — try refreshing the page." />;
  }

  const person = personRes.ok
    ? ((await personRes.json()) as { data: { person: { firstName: string } } }).data.person
    : null;
  const events: CalendarEventRow[] = eventsRes.ok
    ? ((await eventsRes.json()) as { data: CalendarEventRow[] }).data.slice(0, 4)
    : [];
  const notices: AnnouncementRow[] = announcementsRes.ok
    ? ((await announcementsRes.json()) as { data: AnnouncementRow[] }).data.slice(0, 2)
    : [];

  const hostelPct = summary.hostelOccupancy.totalBeds
    ? Math.round((summary.hostelOccupancy.occupiedBeds / summary.hostelOccupancy.totalBeds) * 100)
    : 0;

  return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">
              {greeting()}
              {person ? `, ${person.firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              School overview · vice principal console ·{" "}
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-semibold text-text-muted">Updated just now</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            eyebrow="Active students"
            value={String(summary.activeStudents)}
            detail={[
              `Across ${summary.activeSectionsCount} active sections`,
              `${summary.studentResidence.hostellers} hostellers · ${summary.studentResidence.dayScholars} day scholars`,
            ]}
            href="/vice-principal/students"
          />
          <KpiCard
            eyebrow="Faculty & staff on roll"
            value={String(summary.activeStaff)}
            detail={[`${summary.staffSplit.teaching} teaching · ${summary.staffSplit.support} support`, "Active staff"]}
            href="/vice-principal/faculty"
          />
          <KpiCard
            eyebrow="Parent logins issued"
            value={String(summary.parentLoginsIssued.issued)}
            detail={`${summary.parentLoginsIssued.totalFamilies - summary.parentLoginsIssued.issued} yet to activate`}
            bar={percentOf(summary.parentLoginsIssued.issued, summary.parentLoginsIssued.totalFamilies)}
            href="/vice-principal/parents"
          />
          <KpiCard
            eyebrow="Hostel occupancy"
            value={`${hostelPct}%`}
            detail={`${summary.hostelOccupancy.occupiedBeds} / ${summary.hostelOccupancy.totalBeds} beds occupied`}
            bar={hostelPct}
            href="/vice-principal/hostel"
          />
          <KpiCard eyebrow="Transport fleet" value={String(summary.vehiclesCount)} detail="Vehicles registered" href="/vice-principal/transport" />
          <KpiCard eyebrow="Subjects offered" value={String(summary.subjectsCount)} detail="Active subjects" href="/vice-principal/academics" />
          <KpiCard
            eyebrow="Staff marked today"
            value={`${summary.staffMarkedToday.present} / ${summary.staffMarkedToday.total}`}
            detail={`${summary.staffMarkedToday.present} present · ${summary.staffMarkedToday.absent} absent · ${summary.staffMarkedToday.onLeave} on leave`}
            bar={percentOf(summary.staffMarkedToday.present, summary.staffMarkedToday.total)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Upcoming on the calendar</h2>
              <Link href="/vice-principal/academics/academic-calendar" className="text-[13px] font-semibold text-primary">
                View all
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">Nothing scheduled from today onward.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-border">
                {events.map((e) => (
                  <div key={e.id} className="card-hover flex items-center justify-between gap-3 rounded-[10px] py-3 px-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text">{e.title}</p>
                      <p className="truncate text-xs text-text-muted">
                        {formatDate(e.startDate)}
                        {e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ""}
                      </p>
                    </div>
                    {e.isHoliday && <StatusPill tone="pending" label="Holiday" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Needs attention</h2>
              <span className="text-xs font-semibold text-text-muted">
                {summary.needsAttention.reduce((sum, i) => sum + i.count, 0)} flags
              </span>
            </div>
            {summary.needsAttention.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">Nothing flagged right now.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-border">
                {summary.needsAttention.map((item) => (
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
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[21px] font-semibold leading-[26px] tracking-[-0.015em] text-text">Notices</h2>
            <Link href="/vice-principal/announcements" className="text-[13px] font-semibold text-primary">
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
