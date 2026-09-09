// Parent Library -- real membership summary (issued/due-soon/pending fine),
// this child's own borrowed + past issues, and a read-only catalogue search
// -- same /parent/students/:id/library/* routes the Parent mobile app's own
// Library screen already calls.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatMoneyDetail, formatMoneySummary, orDash } from "@/lib/format";
import {
  getLibrarySummary,
  listChildren,
  resolveSelectedChild,
  searchLibraryCatalog,
  type LibraryIssueRow,
} from "@/lib/parent-api";

export default async function ParentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; tab?: string; search?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, tab, search } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const [summary, books] = await Promise.all([
      getLibrarySummary(selected.studentId),
      searchLibraryCatalog(selected.studentId, search).catch(() => []),
    ]);

    const activeTab = tab === "history" ? "history" : "borrowed";
    const rows = activeTab === "history" ? summary.history : summary.borrowed;

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Library</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6">
          <KpiGrid>
            <KpiCard eyebrow="Books issued" value={String(summary.stats.issuedCount)} />
            <KpiCard eyebrow="Due soon" value={String(summary.stats.dueSoonCount)} />
            <KpiCard eyebrow="Pending fine" value={formatMoneySummary(summary.stats.pendingFinePaise)} />
          </KpiGrid>
        </div>

        {!summary.hasLibraryCard ? (
          <div className="mt-6">
            <EmptyState title="No library card yet" body="This child doesn't have a library membership on record." />
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex gap-2 border-b border-border">
              <Link
                href={`/parent/library?studentId=${selected.studentId}&tab=borrowed`}
                className={`px-3 py-2 text-sm font-bold ${activeTab === "borrowed" ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
              >
                Borrowed
              </Link>
              <Link
                href={`/parent/library?studentId=${selected.studentId}&tab=history`}
                className={`px-3 py-2 text-sm font-bold ${activeTab === "history" ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
              >
                History
              </Link>
            </div>

            <div className="mt-4">
              {rows.length === 0 ? (
                <EmptyState
                  title={activeTab === "history" ? "No past issues" : "No books currently borrowed"}
                  body={activeTab === "history" ? "Returned books will appear here." : "Books issued to this child will appear here."}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {rows.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Catalogue</h2>
          <form method="get" action="/parent/library" className="mt-3 flex flex-wrap items-center gap-3">
            <input type="hidden" name="studentId" value={selected.studentId} />
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search title, author…"
              className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text"
            />
            <button type="submit" className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field">
              Search
            </button>
            {search ? (
              <Link href={`/parent/library?studentId=${selected.studentId}`} className="text-xs font-bold text-text-muted hover:text-text">
                Clear
              </Link>
            ) : null}
          </form>

          <div className="mt-4">
            {books.length === 0 ? (
              <EmptyState title="No books found" body="Try a different search." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((b) => (
                  <div key={b.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                    <p className="text-sm font-bold text-text">{b.title}</p>
                    <p className="text-xs text-text-muted">
                      {orDash(b.author)}
                      {b.categoryName ? ` · ${b.categoryName}` : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-text-muted">
                      {b.copiesSummary.available} of {b.copiesSummary.total} available
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the library. Nothing was changed — try again." />;
  }
}

function IssueRow({ issue }: { issue: LibraryIssueRow }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div>
        <p className="text-sm font-bold text-text">{issue.bookTitle}</p>
        <p className="text-xs text-text-muted">
          Copy {issue.copyCode} · Issued {formatDate(issue.issuedAt)} · Due {formatDate(issue.dueDate)}
          {issue.returnedAt ? ` · Returned ${formatDate(issue.returnedAt)}` : ""}
        </p>
        {issue.isOverdue ? (
          <p className="mt-1 text-xs font-semibold text-critical-text">
            {issue.daysOverdue} day{issue.daysOverdue === 1 ? "" : "s"} overdue · Fine {formatMoneyDetail(issue.projectedFinePaise)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {issue.isOverdue ? <StatusPill state="OVERDUE" /> : <StatusPill state={issue.status} />}
      </div>
    </div>
  );
}
