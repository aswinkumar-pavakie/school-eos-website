import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listIssues } from "@/lib/library-api";
import { formatDate, statusLabel, statusTone } from "@/lib/format";
import { IssueBookForm } from "./IssueBookForm";
import { IssueRowActions } from "./IssueRowActions";

const STATUS_OPTIONS = ["ISSUED", "RETURNED", "OVERDUE", "LOST"];

export default async function CirculationPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; overdueOnly?: string; startDate?: string; endDate?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const overdueOnly = params.overdueOnly === "true";

  try {
    const { data: issues, meta } = await listIssues({
      search: params.search || undefined,
      status: params.status || undefined,
      overdueOnly: overdueOnly || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      page,
      limit: 50,
    });
    const total = meta?.total ?? issues.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.search) next.set("search", params.search);
      if (params.status) next.set("status", params.status);
      if (overdueOnly) next.set("overdueOnly", "true");
      if (params.startDate) next.set("startDate", params.startDate);
      if (params.endDate) next.set("endDate", params.endDate);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/circulation?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1200px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Circulation</h1>
          <p className="mt-1 text-sm text-text-muted">Issue, return, renew -- {total} issues in this view.</p>
        </div>

        <div className="mt-6">
          <IssueBookForm />
        </div>

        <form action="/library/circulation" className="mt-6 flex flex-wrap items-center gap-2.5">
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by member or book title…"
            className="h-[42px] w-full max-w-xs rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect
            name="status"
            defaultValue={params.status ?? ""}
            className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </AutoSubmitSelect>
          <label className="flex h-[42px] items-center gap-2 rounded-[11px] border border-border bg-field px-3.5 text-sm text-text">
            <input type="checkbox" name="overdueOnly" value="true" defaultChecked={overdueOnly} className="h-4 w-4 accent-primary" />
            Overdue only
          </label>
          <input
            type="date"
            name="startDate"
            defaultValue={params.startDate ?? ""}
            aria-label="Issued from"
            className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={params.endDate ?? ""}
            aria-label="Issued to"
            className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <button type="submit" className="h-[42px] rounded-[11px] border border-border px-4 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/circulation" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Renewed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {issues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted">No issues match this view.</td>
                </tr>
              )}
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    {issue.bookTitle}
                    <p className="font-mono text-xs font-normal text-text-muted">
                      {issue.copyCode} · #{issue.id.slice(0, 8).toUpperCase()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/library/members/${issue.memberId}`} className="font-semibold text-primary hover:underline">
                      {issue.memberName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(issue.issuedAt)}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {formatDate(issue.dueDate)}
                    {issue.isOverdue && issue.status !== "RETURNED" && (
                      <p className="text-xs font-semibold text-critical-text">{issue.daysOverdue}d overdue</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{issue.renewedCount}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(issue.status)} label={statusLabel(issue.status)} />
                  </td>
                  <td className="px-4 py-3">
                    <IssueRowActions issue={issue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">Previous</Link>}
              {page < totalPages && <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">Next</Link>}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load circulation</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
