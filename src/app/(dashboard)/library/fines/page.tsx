import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listFines } from "@/lib/library-api";
import { formatDate, formatMoneySummary, statusLabel, statusTone } from "@/lib/format";
import { FineRowActions } from "./FineRowActions";

const STATUS_OPTIONS = ["PENDING", "SENT_TO_FINANCE", "PARTIALLY_PAID", "PAID", "WAIVED", "CANCELLED"];

export default async function LibraryFinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; memberId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const { data: fines, meta } = await listFines({
      status: params.status || undefined,
      memberId: params.memberId || undefined,
      page,
      limit: 50,
    });
    const total = meta?.total ?? fines.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.status) next.set("status", params.status);
      if (params.memberId) next.set("memberId", params.memberId);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/fines?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1100px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Fines</h1>
          <p className="mt-1 text-sm text-text-muted">{total} fines in this view.</p>
        </div>

        <form action="/library/fines" className="mt-6 flex flex-wrap items-end gap-3">
          {params.memberId && <input type="hidden" name="memberId" value={params.memberId} />}
          <AutoSubmitSelect name="status" defaultValue={params.status ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </AutoSubmitSelect>
          <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/fines" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Assessed</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">No fines match this filter.</td>
                </tr>
              )}
              {fines.map((fine) => (
                <tr key={fine.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    <Link href={`/library/members/${fine.memberId}`} className="text-primary hover:underline">{fine.memberName}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{fine.reason}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(fine.assessedAt)}</td>
                  <td className="px-4 py-3 text-right font-mono text-text">{formatMoneySummary(fine.amountPaise)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(fine.status)} label={statusLabel(fine.status)} />
                    {fine.status === "WAIVED" && fine.waivedReason && (
                      <p className="mt-0.5 text-xs text-text-muted">{fine.waivedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <FineRowActions fine={fine} />
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
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load fines</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
