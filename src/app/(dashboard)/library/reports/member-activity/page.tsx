import { redirect } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { AuthExpiredError } from "@/lib/api";
import { listMembers } from "@/lib/library-api";
import { formatMoneySummary } from "@/lib/format";

// Reuses the same Members list data (activeIssuesCount/overdueCount/
// pendingFinesAmountPaise are already computed there) -- this report doesn't
// recompute per-member activity differently, it just presents it as one
// exportable table instead of an operational list.
export default async function LibraryMemberActivityReportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const { data: members, meta } = await listMembers({ page, limit: 100 });
    const total = meta?.total ?? members.length;
    const limit = meta?.limit ?? 100;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
      <div className="mx-auto max-w-[1100px]">
        <BackLink href="/library/reports" label="Back to Reports" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Member Activity Report</h1>
            <p className="mt-1 text-sm text-text-muted">{total} members -- borrowing, overdue, and fine activity per member.</p>
          </div>
          <ExportCsvLink href="/api/export/library-member-activity" />
        </div>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Books issued</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3 text-right">Outstanding fines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">No members yet.</td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    <Link href={`/library/members/${m.id}`} className="text-primary hover:underline">
                      {m.firstName} {m.lastName ?? ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{m.memberType}</td>
                  <td className="px-4 py-3 text-text-muted">{m.status}</td>
                  <td className="px-4 py-3 text-right font-mono text-text">{m.activeIssuesCount}</td>
                  <td className={`px-4 py-3 text-right font-mono ${m.overdueCount > 0 ? "text-critical-text" : "text-text-muted"}`}>
                    {m.overdueCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{formatMoneySummary(m.pendingFinesAmountPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/library/reports/member-activity?page=${page - 1}`} className="font-semibold text-primary">Previous</Link>}
              {page < totalPages && <Link href={`/library/reports/member-activity?page=${page + 1}`} className="font-semibold text-primary">Next</Link>}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the member activity report</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
