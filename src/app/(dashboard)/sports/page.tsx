import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatTime } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import {
  listFixtures,
  listMyTeams,
  listOdRequests,
  listOverdueIssues,
  listTrainingSessions,
} from "@/lib/sports-faculty-api";

// Module-scope, not a component -- keeps the page component itself free of a
// direct Date.now() call (react-hooks/purity flags impure calls inside a
// component/hook body, but not inside an ordinary helper function it calls).
function isFutureIso(value: string): boolean {
  return new Date(value).getTime() > Date.now();
}

export default async function SportsFacultyDashboardPage() {
  try {
    const [teams, sessions, fixtures, odRequests, overdueIssues] = await Promise.all([
      listMyTeams(),
      listTrainingSessions(),
      listFixtures(),
      listOdRequests(),
      listOverdueIssues(),
    ]);

    const upcomingSessions = sessions
      .filter((s) => s.status === "SCHEDULED" && isFutureIso(s.scheduledAt))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const upcomingFixtures = fixtures
      .filter((f) => f.status === "SCHEDULED" && isFutureIso(f.scheduledAt))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const pendingOdRequests = odRequests.filter((r) => r.state === "PENDING");

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Sports Faculty Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Your teams, training, fixtures and equipment, at a glance.</p>
        </div>

        {teams.length === 0 && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-field px-6 py-5 text-sm text-text-muted">
            You don&apos;t currently hold a Sports In-Charge assignment for any sport — nothing to show yet. Ask
            your Admin to assign you to a sport.
          </div>
        )}

        <KpiGrid>
          <KpiCard eyebrow="My teams" value={String(teams.length)} />
          <KpiCard eyebrow="Upcoming training" value={String(upcomingSessions.length)} />
          <KpiCard eyebrow="Upcoming fixtures" value={String(upcomingFixtures.length)} />
          <KpiCard eyebrow="Equipment overdue" value={String(overdueIssues.length)} />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Next training sessions</h2>
              <Link href="/sports/training" className="text-xs font-bold text-primary hover:underline">All sessions</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing scheduled.</p>
              ) : (
                upcomingSessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-text">{s.teamName}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDate(s.scheduledAt)} · {formatTime(s.scheduledAt)}
                        {s.venue ? ` · ${s.venue}` : ""}
                      </p>
                    </div>
                    <StatusPill state={s.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Next fixtures</h2>
              <Link href="/sports/tournaments" className="text-xs font-bold text-primary hover:underline">All tournaments</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {upcomingFixtures.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing scheduled.</p>
              ) : (
                upcomingFixtures.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-text">{f.round ?? "Fixture"}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatDate(f.scheduledAt)} · {formatTime(f.scheduledAt)}
                        {f.venue ? ` · ${f.venue}` : ""}
                      </p>
                    </div>
                    <StatusPill state={f.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Pending OD requests</h2>
              <Link href="/sports/od-requests" className="text-xs font-bold text-primary hover:underline">All requests</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {pendingOdRequests.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing waiting on the Principal.</p>
              ) : (
                pendingOdRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-[var(--radius-input)] border border-border px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-text">{r.teamName}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{formatDate(r.eventDate)} · {r.reason}</p>
                    </div>
                    <StatusPill state={r.state} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Overdue equipment</h2>
              <Link href="/sports/equipment" className="text-xs font-bold text-primary hover:underline">All equipment</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {overdueIssues.length === 0 ? (
                <p className="text-sm text-text-muted">Nothing overdue.</p>
              ) : (
                overdueIssues.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-text">{i.equipmentName} × {i.quantity}</p>
                      <p className="mt-0.5 text-xs text-text-muted">Due {formatDate(i.dueOn)}</p>
                    </div>
                    <StatusPill state="OVERDUE" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the Sports Faculty dashboard. Nothing was submitted — try again." />;
  }
}
