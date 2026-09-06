import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listReservations } from "@/lib/library-api";
import { formatDate, formatTime, statusLabel, statusTone } from "@/lib/format";
import { ReservationRowActions } from "./ReservationRowActions";

const STATUS_OPTIONS = ["PENDING", "READY", "FULFILLED", "CANCELLED", "EXPIRED"];

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;

  try {
    const reservations = await listReservations({
      status: params.status || undefined,
      search: params.search || undefined,
    });

    return (
      <div className="mx-auto max-w-[1100px]">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Reservations</h1>
          <p className="mt-1 text-sm text-text-muted">{reservations.length} reservations in this view.</p>
        </div>

        <form action="/library/reservations" className="mt-6 flex flex-wrap items-end gap-3">
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by member or book…"
            className="w-full max-w-xs rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect name="status" defaultValue={params.status ?? ""} className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </AutoSubmitSelect>
          <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/reservations" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Book</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Queue #</th>
                <th className="px-4 py-3">Ready / expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted">No reservations match this filter.</td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-text">
                    <Link href={`/library/books/${r.bookId}`} className="text-primary hover:underline">{r.bookTitle}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    <Link href={`/library/members/${r.memberId}`} className="font-semibold text-primary hover:underline">{r.memberName}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(r.reservedAt)}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{r.queuePosition ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {r.status === "READY" && r.readyAt ? (
                      <>
                        <p className="text-[13px]">Ready {formatDate(r.readyAt)} {formatTime(r.readyAt)}</p>
                        {r.expiresAt && (
                          <p className="text-xs text-critical-text">Expires {formatDate(r.expiresAt)} {formatTime(r.expiresAt)}</p>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(r.status)} label={statusLabel(r.status)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ReservationRowActions reservationId={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load reservations</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
