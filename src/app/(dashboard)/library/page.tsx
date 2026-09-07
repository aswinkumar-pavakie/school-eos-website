// Library's own dashboard -- the ONE full operational home page for this role
// (Admin's oversight view is a separate, much smaller page: src/app/(dashboard)/
// admin/library/page.tsx). Pulls GET /library/overview (+ a small overdue-issues
// slice) and renders a KPI row + book-status breakdown + overdue preview +
// recent-activity list, same shape as Admin's own dashboard.tsx.

import { redirect } from "next/navigation";
import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import {
  AcademicsIcon,
  FinanceIcon,
  RequestsIcon,
  StudentsIcon,
} from "@/components/dashboard/icons";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview, listCategories, listIssues } from "@/lib/library-api";
import { formatDate, formatMoney, formatMoneySummary, formatRelativeTime, statusLabel, statusTone } from "@/lib/format";
import { CreateBookModal } from "./books/CreateBookModal";

function activityTone(action: string): "success" | "pending" | "critical" {
  const a = action.toUpperCase();
  if (a.includes("RETURN") || a.includes("REACTIVATE") || a.includes("RESTORE")) return "success";
  if (a.includes("LOST") || a.includes("DAMAGE") || a.includes("SUSPEND") || a.includes("OVERDUE")) return "critical";
  return "pending";
}

function prettifyAction(action: string): string {
  const words = action.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export default async function LibraryDashboardPage() {
  try {
    const [overview, categories, overdue] = await Promise.all([
      getLibraryOverview(),
      listCategories(),
      listIssues({ overdueOnly: true, limit: 5 }),
    ]);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Library</h1>
            <p className="mt-1 text-sm text-text-muted">Catalog, members, circulation and fines -- at a glance.</p>
          </div>
        </div>

        {/* C. Quick actions -- Issue/return, Manage catalog and Manage members were
            already here and stay exactly as they were; Add Book is new (opens the
            same modal Books' own page uses, not a second create flow). Add Book
            Copy has no single sensible one-click target (a copy always belongs to
            a specific book), and Search Books is the same destination as Manage
            catalog, so neither gets its own separate button here. */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/library/circulation" className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Issue / return a book
          </Link>
          <CreateBookModal categories={categories} />
          <Link href="/library/books" className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-bg">
            Manage catalog
          </Link>
          <Link href="/library/members" className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-bg">
            Manage members
          </Link>
        </div>

        {/* B. Summary cards -- the 8 numbers the spec asks for, exactly. */}
        <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            eyebrow="Total books"
            value={String(overview.totalBooks)}
            detail={`${overview.activeMembers} active members`}
            icon={<AcademicsIcon className="h-5 w-5" />}
            href="/library/books"
          />
          <KpiCard
            eyebrow="Total book copies"
            value={String(overview.totalCopies)}
            detail="Across the whole catalog"
            icon={<AcademicsIcon className="h-5 w-5" />}
            href="/library/books"
          />
          <KpiCard
            eyebrow="Available copies"
            value={String(overview.availableCopies)}
            detail="Ready to issue"
            icon={<AcademicsIcon className="h-5 w-5" />}
            href="/library/books"
          />
          <KpiCard
            eyebrow="Issued books"
            value={String(overview.issuedCopies)}
            detail="Currently on loan"
            icon={<RequestsIcon className="h-5 w-5" />}
            href="/library/circulation"
          />
        </div>

        <div className="mt-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            eyebrow="Overdue books"
            value={String(overview.overdueCount)}
            detail="Past their due date"
            icon={<RequestsIcon className="h-5 w-5" />}
            href="/library/circulation?overdueOnly=true"
          />
          <KpiCard
            eyebrow="Reserved books"
            value={String(overview.pendingReservationsCount)}
            detail="Active reservations"
            icon={<StudentsIcon className="h-5 w-5" />}
            href="/library/reservations"
          />
          <KpiCard
            eyebrow="Lost / damaged"
            value={`${overview.lostCopies} / ${overview.damagedCopies}`}
            detail="Unaccounted for / needs repair"
            icon={<RequestsIcon className="h-5 w-5" />}
            href="/library/books"
          />
          <KpiCard
            eyebrow="Outstanding fines"
            value={formatMoneySummary(
              (Number(overview.pendingFinesAmountPaise) + Number(overview.sentToFinanceFinesAmountPaise)).toString(),
            )}
            detail={`${formatMoneySummary(overview.sentToFinanceFinesAmountPaise)} already sent to Finance`}
            icon={<FinanceIcon className="h-5 w-5" />}
            href="/library/fines"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* D. Overdue section */}
          <div className="rounded-[16px] border border-border bg-surface p-[18px] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Overdue books</h2>
              <Link href="/library/circulation?overdueOnly=true" className="text-[13px] font-semibold text-primary">
                View all overdues
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                    <th className="py-2 pr-3">Member</th>
                    <th className="py-2 pr-3">Book</th>
                    <th className="py-2 pr-3">Due date</th>
                    <th className="py-2 pr-3 text-right">Days overdue</th>
                    <th className="py-2 pr-3 text-right">Est. fine</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overdue.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-text-muted">No overdue books right now.</td>
                    </tr>
                  )}
                  {overdue.data.map((issue) => (
                    <tr key={issue.id}>
                      <td className="py-2.5 pr-3 font-semibold text-text">{issue.memberName}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{issue.bookTitle}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{formatDate(issue.dueDate)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-critical-text">{issue.daysOverdue}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-text-muted">{formatMoney(issue.projectedFinePaise)}</td>
                      <td className="py-2.5">
                        <StatusPill tone={statusTone(issue.status)} label={statusLabel(issue.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* E. Reservation attention */}
            <div className="rounded-[16px] border border-border bg-surface p-[18px]">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Reservations</h2>
              <div className="mt-3 flex items-center gap-6">
                <div>
                  <p className="font-mono text-2xl font-extrabold text-text">{overview.pendingReservationsCount}</p>
                  <p className="text-[13px] text-text-muted">waiting in queue</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-extrabold text-text">{overview.readyReservationsCount}</p>
                  <p className="text-[13px] text-text-muted">ready for pickup</p>
                </div>
              </div>
              <Link href="/library/reservations" className="mt-3 inline-block text-[13px] font-semibold text-primary">
                Manage reservations
              </Link>
            </div>

            {/* G. Book status overview */}
            <div className="rounded-[16px] border border-border bg-surface p-[18px]">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Book status overview</h2>
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {([
                  ["Available", overview.availableCopies, "success"],
                  ["Issued", overview.issuedCopies, "pending"],
                  ["Reserved", overview.reservedCopies, "pending"],
                  ["Lost", overview.lostCopies, "critical"],
                  ["Damaged", overview.damagedCopies, "critical"],
                  ["Under repair", overview.underRepairCopies, "pending"],
                  ["Retired", overview.retiredCopies, "critical"],
                ] as [string, number, "success" | "pending" | "critical"][]).map(([label, value, tone]) => (
                  <li key={label} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-[13px] text-text-muted">{label}</span>
                    <StatusPill tone={tone} label={String(value)} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* F. Recent library activity */}
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
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
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the Library dashboard</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
