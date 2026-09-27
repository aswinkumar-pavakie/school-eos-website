// Health In-charge -- Dashboard: what the infirmary desk needs right now. Every figure is
// a real count from the backend (GET /health-incharge/dashboard).

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { AcknowledgeAlertButton, NotifyParentButton, RecordVisitModal } from "@/components/health-incharge/HealthForms";
import { formatDateTime } from "@/lib/format";
import { ACTION_LABEL, ALERT_LABEL, classLabel, getHealthDashboard, studentName } from "@/lib/health-incharge-api";
import { percentOf } from "@/lib/format";

export default async function HealthDashboardPage() {
  let data;
  try {
    data = await getHealthDashboard();
  } catch (e) {
    return <ErrorState message={e instanceof Error ? e.message : "Couldn't load the dashboard."} />;
  }
  const { counts, recentVisits, needsNotice, openAlerts } = data;

  return (
    <div className="mx-auto max-w-[1024px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Health &amp; Infirmary</h1>
          <p className="mt-2 text-[15px] text-text-muted">Today&apos;s infirmary desk: visits, guardians to inform, and open alerts.</p>
        </div>
        <RecordVisitModal />
      </div>

      <div className="mt-6">
        <KpiGrid>
          <KpiCard
            eyebrow="Visits today"
            value={String(counts.visitsToday)}
            delta={`${counts.visitsThisWeek} this week`}
            bar={counts.visitsThisWeek > 0 ? percentOf(counts.visitsToday, counts.visitsThisWeek) : undefined}
          />
          <KpiCard eyebrow="Guardians to inform" value={String(counts.needsParentNotice)} delta="serious visits not yet notified" />
          <KpiCard eyebrow="Open alerts" value={String(counts.openAlerts)} delta="awaiting acknowledgement" />
          <KpiCard eyebrow="Contacts this week" value={String(counts.escalationsThisWeek)} delta="parent / doctor calls logged" />
        </KpiGrid>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-text">Guardians to inform</h2>
            <Link href="/health-incharge/visits?notice=1" className="text-[13px] font-semibold text-primary">View all</Link>
          </div>
          {needsNotice.length === 0 ? (
            <div className="mt-3"><EmptyState title="All caught up" body="Every serious visit has its guardians informed." /></div>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {needsNotice.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-semibold text-text">{studentName(v)}</span>
                    <span className="block text-[12px] text-text-muted">{classLabel(v.gradeName, v.sectionName)} · {ACTION_LABEL[v.action] ?? v.action} · {formatDateTime(v.visitedAt)}</span>
                  </span>
                  <NotifyParentButton visitId={v.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-text">Open alerts</h2>
            <Link href="/health-incharge/alerts" className="text-[13px] font-semibold text-primary">View all</Link>
          </div>
          {openAlerts.length === 0 ? (
            <div className="mt-3"><EmptyState title="No open alerts" body="Nothing is waiting for you." /></div>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {openAlerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-semibold text-text">{ALERT_LABEL[a.alertType] ?? a.alertType}</span>
                    <span className="block text-[12px] text-text-muted">
                      {a.studentFirstName ? studentName(a) : (a.scopeType ?? "School")} · {formatDateTime(a.detectedAt)}
                    </span>
                  </span>
                  <AcknowledgeAlertButton alertId={a.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-text">Recent visits</h2>
          <Link href="/health-incharge/visits" className="text-[13px] font-semibold text-primary">All visits</Link>
        </div>
        {recentVisits.length === 0 ? (
          <div className="mt-3"><EmptyState title="No visits yet" body="Recorded visits appear here." /></div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">
                  <th className="py-2 pr-3">Student</th><th className="py-2 pr-3">Class</th><th className="py-2 pr-3">Complaint</th><th className="py-2 pr-3">Action</th><th className="py-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentVisits.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 pr-3 font-semibold text-text"><Link href={`/health-incharge/students/${v.studentId}`} className="hover:text-primary">{studentName(v)}</Link></td>
                    <td className="py-2.5 pr-3 text-text-muted">{classLabel(v.gradeName, v.sectionName)}</td>
                    <td className="py-2.5 pr-3 text-text">{v.complaint}</td>
                    <td className="py-2.5 pr-3 text-text">{ACTION_LABEL[v.action] ?? v.action}</td>
                    <td className="py-2.5 text-text-muted">{formatDateTime(v.visitedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {counts.profilesWithoutBloodGroup > 0 && (
        <p className="mt-4 text-[13px] text-text-muted">
          {counts.profilesWithoutBloodGroup} student health profile(s) have no blood group recorded.
        </p>
      )}
    </div>
  );
}
