import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listLostDamagedReports } from "@/lib/library-api";
import { formatDate, formatMoneySummary, statusLabel, statusTone } from "@/lib/format";

const TYPE_OPTIONS = ["LOST", "DAMAGED"];
const STATUS_OPTIONS = ["LOST", "DAMAGED", "UNDER_REPAIR", "RETIRED", "AVAILABLE"];

export default async function LibraryLostDamagedPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const { data: reports, meta } = await listLostDamagedReports({
      search: params.search || undefined,
      type: params.type || undefined,
      status: params.status || undefined,
      page,
      limit: 50,
    });
    const total = meta?.total ?? reports.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.search) next.set("search", params.search);
      if (params.type) next.set("type", params.type);
      if (params.status) next.set("status", params.status);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/lost-damaged?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1200px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Lost &amp; Damaged</h1>
          <p className="mt-1 text-sm text-text-muted">
            {total} incidents on record. Reported through a copy&apos;s own Mark lost / Mark damaged action -- this is
            the history, not a second place to make that change.
          </p>
        </div>

        <form action="/library/lost-damaged" className="mt-6 flex flex-wrap items-center gap-2.5">
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by book title or member…"
            className="h-[42px] w-full max-w-xs rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect name="type" defaultValue={params.type ?? ""} className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary focus:bg-surface">
            <option value="">Type: All</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="status" defaultValue={params.status ?? ""} className="h-[42px] rounded-[11px] border border-border bg-field px-3.5 text-sm text-text outline-none focus:border-primary focus:bg-surface">
            <option value="">Current status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </AutoSubmitSelect>
          <button type="submit" className="h-[42px] rounded-[11px] border border-border px-4 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/lost-damaged" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3">Copy</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3">Reported by</th>
                <th className="px-4 py-3">Current status</th>
                <th className="px-4 py-3">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-muted">No lost/damaged incidents match this filter.</td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    <Link href={`/library/books/${r.bookId}`} className="text-primary hover:underline">{r.bookTitle}</Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{r.copyCode}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {r.memberId ? (
                      <Link href={`/library/members/${r.memberId}`} className="text-primary hover:underline">{r.memberName}</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={r.type === "LOST" ? "critical" : "pending"} label={r.type} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {formatDate(r.reportedAt)}
                    {(r.reason || r.notes) && (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-text-muted" title={[r.reason, r.notes].filter(Boolean).join(" — ")}>
                        {[r.reason, r.notes].filter(Boolean).join(" — ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{r.reportedByName}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(r.currentCopyStatus)} label={statusLabel(r.currentCopyStatus)} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {r.fineId ? (
                      <>
                        {formatMoneySummary(r.fineAmountPaise ?? 0)}
                        <p className="text-xs">
                          <StatusPill tone={statusTone(r.fineStatus ?? "PENDING")} label={statusLabel(r.fineStatus ?? "PENDING")} />
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
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
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Lost &amp; Damaged</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
