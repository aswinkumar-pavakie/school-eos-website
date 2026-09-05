// Admin -> Finance: Payment visibility -- read-only (section 4 of the Admin
// Finance spec). Deliberately no Collect/Process/Confirm/Cancel/Refund
// controls anywhere on this page; those are Finance operational
// responsibilities.

import Link from "next/link";
import { FinanceTabBar } from "@/components/finance/FinanceTabBar";
import { PaymentsFilterBar } from "@/components/finance/PaymentsFilterBar";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface PaymentRow {
  id: string;
  studentId: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  admissionNo: string | null;
  amountPaise: string;
  mode: string;
  state: string;
  gatewayRef: string | null;
  confirmedAt: string | null;
  initiatedAt: string;
  receiptNo: string | null;
  issuedOn: string | null;
  collectedByName: string | null;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "CONFIRMED" || state === "RECONCILED") return "success";
  if (state === "FAILED" || state === "REVERSED") return "critical";
  return "pending";
}

export default async function FinancePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; state?: string; mode?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.state) query.set("state", params.state);
  if (params.mode) query.set("mode", params.mode);
  query.set("page", String(page));
  query.set("limit", "50");

  const res = await apiFetch(`/payments?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load payments</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: payments, meta } = (await res.json()) as {
    data: PaymentRow[];
    meta: { page: number; limit: number; total: number };
  };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.state) next.set("state", params.state);
    if (params.mode) next.set("mode", params.mode);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/finance/payments?${next.toString()}`;
  }

  function filterQuery() {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.state) q.set("state", params.state);
    if (params.mode) q.set("mode", params.mode);
    return q.toString();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Finance &amp; Fees</h1>
          <p className="mt-1 text-sm text-text-muted">
            {meta.total} payments — view-only. Collecting, confirming, cancelling or refunding a payment is a
            Finance/Accounts operation, not part of this view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/finance/payments?${filterQuery()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
          >
            Print / PDF
          </Link>
          <ExportCsvLink href={`/api/export/finance-payments?${filterQuery()}`} />
        </div>
      </div>
      <FinanceTabBar active="Payments" />

      <PaymentsFilterBar search={params.search ?? ""} state={params.state ?? ""} mode={params.mode ?? ""} />

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Collected by</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-muted">
                  No payments match this filter.
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold text-text">
                  {p.studentId ? (
                    <Link href={`/admin/students/${p.studentId}`} className="hover:underline">
                      {p.studentFirstName} {p.studentLastName ?? ""}
                    </Link>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                  {p.admissionNo && <p className="font-mono text-xs font-normal text-text-muted">{p.admissionNo}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{formatMoneySummary(p.amountPaise)}</td>
                <td className="px-4 py-3 text-text-muted">{p.mode.replace(/_/g, " ").toLowerCase()}</td>
                <td className="px-4 py-3 text-text-muted">{formatDate(p.confirmedAt ?? p.initiatedAt)}</td>
                <td className="px-4 py-3 text-text-muted">
                  {p.receiptNo ?? "—"}
                  {p.gatewayRef && <p className="font-mono text-xs">{p.gatewayRef}</p>}
                </td>
                <td className="px-4 py-3 text-text-muted">{p.collectedByName ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={stateTone(p.state)} label={p.state.charAt(0) + p.state.slice(1).toLowerCase()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
