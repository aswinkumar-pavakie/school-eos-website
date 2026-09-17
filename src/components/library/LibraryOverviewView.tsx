// Shared Library oversight view -- Admin/Principal/Vice Principal all render
// the exact same real GET /library/overview data (plus Admin/Principal's own
// real GET /library/issues?overdueOnly for the fines table; VP doesn't have
// that grant, see vice-principal/library/page.tsx's own comment), so this one
// component avoids tripling ~130 lines of pixel-identical markup. Pixel-
// matched against Principal Console.dc.html's own "library" page (line
// ~1645-1669) -- checked against the literal inline styles, not inferred:
//
//   isBars ("Copies available by grade band") and the mockup's "Total ebooks"
//   stat are both deliberately NOT implemented -- library_book has no
//   grade_band or is_ebook column in the real schema, so there's no real data
//   to show. "Today's activity" IS real (library_issue.issued_at/returned_at),
//   added to the backend overview for this pass.
//
// Section styles used here, copied verbatim from the mockup:
//   isList row: flex items-center justify-between gap-[18px] py-[15px]
//     border-t border-[#eef1f6] (every row, including the first)
//   isTable "Overdue & fines": ACCESSION(link)/TITLE(strong)/STUDENT/CLASS/
//     DUE DATE(mono)/DAYS(mono)/FINE(strong)

import Link from "next/link";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatDate, formatMoneySummary, formatRelativeTime } from "@/lib/format";
import type { LibraryIssue, LibraryOverview } from "@/lib/library-api";

function prettifyAction(action: string): string {
  const words = action.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export function LibraryOverviewView({
  overview,
  overdueIssues,
  financeHref,
}: {
  overview: LibraryOverview;
  /** Omitted entirely for roles with no real circulation-detail access (see
   * this component's own top comment) -- the "Overdue & fines" table just
   * doesn't render rather than showing empty/fake rows. */
  overdueIssues?: LibraryIssue[];
  /** Admin's own real "Collected in Finance" link -- omitted for roles with
   * no Finance-facing route of their own. */
  financeHref?: string;
}) {
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const overdueFinesPct = overview.issuedCopies > 0 ? Math.round((overview.overdueCount / overview.issuedCopies) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1180px]">
      <div>
        {/* 38px/700/-0.028em, per Principal Console.dc.html's own page.title markup. */}
        <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Library</h1>
        <p className="mt-1.5 text-sm text-text-muted">School overview of the library module · {dateLabel}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          eyebrow="Available books"
          value={String(overview.availableCopies)}
          detail={[`of ${overview.totalCopies} copies`, `${overview.issuedCopies} checked out`]}
        />
        <KpiCard
          eyebrow="Active borrowings"
          value={String(overview.issuedCopies)}
          detail={[`of ${overview.totalCopies} copies`, `${overview.overdueCount} of them overdue`]}
        />
        <KpiCard
          eyebrow="Overdue books"
          value={String(overview.overdueCount)}
          detail={[`of ${overview.issuedCopies} borrowings`, `${formatMoneySummary(overview.pendingFinesAmountPaise)} in fines outstanding`]}
          pctBadge={`${overdueFinesPct}%`}
          bar={overdueFinesPct}
        />
        <KpiCard
          eyebrow="Today's activity"
          value={String(overview.todayIssuedCount + overview.todayReturnedCount)}
          detail={`${overview.todayIssuedCount} issued · ${overview.todayReturnedCount} returned`}
        />
        <KpiCard
          eyebrow="Lost & damaged"
          value={String(overview.lostCopies + overview.damagedCopies)}
          detail={[`of ${overview.totalCopies} copies`, `${overview.lostCopies} lost · ${overview.damagedCopies} damaged`]}
        />
        <KpiCard
          eyebrow="Active members"
          value={String(overview.activeMembers)}
          detail={[`${overview.pendingReservationsCount} pending reservations`, `${overview.readyReservationsCount} ready for pickup`]}
        />
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-5">
        <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Recent activity</h2>
        <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
          Latest issues, returns and reported losses
        </p>
        <div className="mt-2 flex flex-col">
          {overview.recentActivity.length === 0 && (
            <p className="py-7 text-[15px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
              No activity recorded yet.
            </p>
          )}
          {overview.recentActivity.map((event) => (
            <div key={event.id} className="card-hover flex items-center justify-between gap-[18px] rounded-[12px] border-t border-[#eef1f6] px-2 py-[15px]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-text">{prettifyAction(event.action)}</p>
                {event.detail && (
                  <p className="truncate text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                    {event.detail}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
                {formatRelativeTime(event.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {overdueIssues && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-5">
          <h2 className="text-[19px] font-semibold leading-[24px] tracking-[-0.015em] text-text">Overdue &amp; fines</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}>
            Copies past due and the fine each has run up
          </p>
          {overdueIssues.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">No overdue books right now.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                    <th className="px-3 py-2.5">Accession</th>
                    <th className="px-3 py-2.5">Title</th>
                    <th className="px-3 py-2.5">Student</th>
                    <th className="px-3 py-2.5">Due date</th>
                    <th className="px-3 py-2.5">Days</th>
                    <th className="px-3 py-2.5">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overdueIssues.map((i) => (
                    <tr key={i.id}>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-primary">{i.copyCode}</td>
                      <td className="px-3 py-2.5 font-semibold text-text">{i.bookTitle}</td>
                      <td className="px-3 py-2.5 text-text-muted">{i.memberName}</td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-text-muted">{formatDate(i.dueDate)}</td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-text-muted">{i.daysOverdue}</td>
                      <td className="px-3 py-2.5 font-semibold text-text">{formatMoneySummary(i.projectedFinePaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {financeHref && (
        <p className="mt-4 text-xs text-text-muted">
          Fines are collected in{" "}
          <Link href={financeHref} className="font-semibold text-primary hover:underline">
            Finance &rsaquo; Library
          </Link>
          .
        </p>
      )}
    </div>
  );
}
