import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listPayments } from "@/lib/finance-api";
import { OFFLINE_PAYMENT_MODES, ONLINE_PAYMENT_MODES } from "@/lib/finance-constants";
import { CreatePaymentModal } from "./CreatePaymentModal";

const STATE_OPTIONS = ["INITIATED", "PENDING", "CONFIRMED", "FAILED", "RECONCILED", "REVERSED"];

// The dedicated Payments tab — every payment ever recorded, real filters, and a
// direct Print Receipt action per row. This is deliberately its own nav item now,
// not a small link tucked into the Fee Payments page (which stays the
// student-search/receive-payment hub).
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; mode?: string; studentSearch?: string; fromDate?: string; toDate?: string }>;
}) {
  const { state, mode, studentSearch, fromDate, toDate } = await searchParams;
  try {
    const { data: payments } = await listPayments({
      state: state || undefined,
      mode: mode || undefined,
      studentSearch: studentSearch || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      pageSize: 100,
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Payments</h1>
            <p className="mt-1 text-sm text-text-muted">Every payment recorded, with receipts ready to print.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/payments/reconciliations"><PlainButton variant="secondary">Reconciliation</PlainButton></Link>
            <CreatePaymentModal />
          </div>
        </div>

        <form action="/finance/payments" className="flex flex-wrap items-center gap-3">
          <input
            name="studentSearch"
            defaultValue={studentSearch}
            placeholder="Search by student name or admission no."
            className="min-w-56 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="mode" defaultValue={mode ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Mode: All</option>
            {[...OFFLINE_PAYMENT_MODES, ...ONLINE_PAYMENT_MODES].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" name="fromDate" defaultValue={fromDate ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
          <span className="text-xs text-text-muted">to</span>
          <input type="date" name="toDate" defaultValue={toDate ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/payments" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {payments.length === 0 ? (
          <EmptyState title="No payments match this view" body="Record a cash/cheque/DD payment, or create a gateway intent." />
        ) : (
          <DataTable
            getKey={(p) => p.id}
            rows={payments}
            columns={[
              { header: "Student", render: (p) => p.studentNames ?? <span className="text-text-muted">multiple / unallocated</span> },
              { header: "Mode", render: (p) => p.mode },
              { header: "Amount", align: "right", render: (p) => formatMoneySummary(p.amountPaise) },
              { header: "Initiated", render: (p) => formatDate(p.initiatedAt) },
              { header: "Status", render: (p) => <StatusPill state={p.state} /> },
              {
                header: "",
                render: (p) => (
                  <div className="flex justify-end gap-3">
                    {p.receiptId && (
                      <Link href={`/receipts/print?ids=${p.receiptId}`} target="_blank" className="text-xs font-bold text-primary hover:underline">
                        Print Receipt →
                      </Link>
                    )}
                    <Link href={`/finance/payments/${p.id}`} className="text-xs font-bold text-text-muted hover:text-text">
                      View →
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load payments. Nothing was submitted — try again." />;
  }
}
