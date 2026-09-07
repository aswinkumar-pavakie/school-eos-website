// Admin's Library oversight -- a read-only summary, NOT a second Library operator
// interface. Pulls GET /library/overview and nothing else: this is deliberately the
// ONLY Library endpoint this page calls (the single oversight surface); no
// issue/return/renew buttons, no catalog CRUD, no member management live here --
// those all belong to Library's own module at /library, which Admin does not "view
// as" (see /library/layout.tsx's own comment on why). Same visual language as
// Admin's other overview pages (Inventory): dashboard/KpiCard + dashboard/StatusPill.

import { redirect } from "next/navigation";
import Link from "next/link";
import { AcademicsIcon } from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview } from "@/lib/library-api";
import { formatMoneySummary, formatRelativeTime } from "@/lib/format";

function activityTone(action: string): "success" | "pending" | "critical" {
  const a = action.toUpperCase();
  if (a.includes("RETURN") || a.includes("REACTIVATE")) return "success";
  if (a.includes("LOST") || a.includes("DAMAGE") || a.includes("SUSPEND") || a.includes("OVERDUE")) return "critical";
  return "pending";
}

function prettifyAction(action: string): string {
  const words = action.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export default async function AdminLibraryOverviewPage() {
  try {
    const overview = await getLibraryOverview();

    return (
      <div className="mx-auto max-w-[1100px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Library</h1>
          <p className="mt-1 text-sm text-text-muted">
            Read-only oversight. Day-to-day catalog, circulation and member operations happen in the Library module itself.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard eyebrow="Total books" value={String(overview.totalBooks)} detail={`${overview.totalCopies} copies`} icon={<AcademicsIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Available" value={String(overview.availableCopies)} detail="Ready to issue" icon={<AcademicsIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Issued" value={String(overview.issuedCopies)} detail="Currently on loan" icon={<AcademicsIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Overdue" value={String(overview.overdueCount)} detail="Past due date" icon={<AcademicsIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Lost / damaged" value={`${overview.lostCopies} / ${overview.damagedCopies}`} detail="Unaccounted for / needs repair" icon={<AcademicsIcon className="h-5 w-5" />} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[16px] border border-border bg-surface p-[18px] lg:col-span-2">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Recent activity</h2>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {overview.recentActivity.length === 0 && (
                <li className="py-6 text-center text-sm text-text-muted">No activity recorded yet.</li>
              )}
              {overview.recentActivity.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-text">
                      {prettifyAction(event.action)}
                      {event.detail && <span className="font-normal text-text-muted"> — {event.detail}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusPill tone={activityTone(event.action)} label={prettifyAction(event.action)} />
                    <span className="text-xs text-text-muted">{formatRelativeTime(event.occurredAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-[16px] border border-border bg-surface p-[18px]">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Members &amp; reservations</h2>
              <dl className="mt-3 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Active members</dt>
                  <dd className="font-mono font-bold text-text">{overview.activeMembers}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Pending reservations</dt>
                  <dd className="font-mono font-bold text-text">{overview.pendingReservationsCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Ready for pickup</dt>
                  <dd className="font-mono font-bold text-text">{overview.readyReservationsCount}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[16px] border border-border bg-surface p-[18px]">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Fines</h2>
              <dl className="mt-3 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Pending</dt>
                  <dd className="font-mono font-bold text-text">{formatMoneySummary(overview.pendingFinesAmountPaise)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Sent to Finance</dt>
                  <dd className="font-mono font-bold text-text">{formatMoneySummary(overview.sentToFinanceFinesAmountPaise)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-text-muted">
                Collected in <Link href="/finance/library" className="font-semibold text-primary hover:underline">Finance &rsaquo; Library</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Library oversight</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
