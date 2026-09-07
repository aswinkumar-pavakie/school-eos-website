import { redirect } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { AuthExpiredError } from "@/lib/api";
import { listTransactionHistory } from "@/lib/library-api";
import { formatDate, formatTime } from "@/lib/format";

function prettifyAction(action: string): string {
  const words = action.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export default async function LibraryTransactionHistoryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const { data: entries, meta } = await listTransactionHistory({
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      page,
      limit: 50,
    });
    const total = meta?.total ?? entries.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.startDate) next.set("startDate", params.startDate);
      if (params.endDate) next.set("endDate", params.endDate);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/reports/transaction-history?${next.toString()}`;
    }

    const exportHref = `/api/export/library-transaction-history?${new URLSearchParams({
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
    }).toString()}`;

    return (
      <div className="mx-auto max-w-[1100px]">
        <BackLink href="/library/reports" label="Back to Reports" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Transaction History Report</h1>
            <p className="mt-1 text-sm text-text-muted">{total} events -- operational Library history, not the final Audit/History module.</p>
          </div>
          <ExportCsvLink href={exportHref} />
        </div>

        <form action="/library/reports/transaction-history" className="mt-6 flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">From</span>
            <input type="date" name="startDate" defaultValue={params.startDate ?? ""} className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary focus:bg-surface" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">To</span>
            <input type="date" name="endDate" defaultValue={params.endDate ?? ""} className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary focus:bg-surface" />
          </label>
          <button type="submit" className="h-[42px] rounded-[11px] border border-border px-4 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/reports/transaction-history" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Date/time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">No events in this range.</td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-text-muted">{formatDate(e.occurredAt)} {formatTime(e.occurredAt)}</td>
                  <td className="px-4 py-3 font-semibold text-text">{prettifyAction(e.action)}</td>
                  <td className="px-4 py-3 text-text-muted">{e.detail ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{e.actorName ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{e.outcome}</td>
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
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load transaction history</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
