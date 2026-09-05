import Link from "next/link";
import { redirect } from "next/navigation";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listApprovals, listFeeStructures, listObligations, listPayments } from "@/lib/finance-api";

export default async function FinanceDashboardPage() {
  try {
    const [structures, obligations, payments, pendingApprovals] = await Promise.all([
      listFeeStructures({ state: "ACTIVE", pageSize: 1 }),
      listObligations({ state: "PENDING", pageSize: 1 }),
      listPayments({ state: "CONFIRMED", pageSize: 1 }),
      listApprovals({ status: "PENDING" }),
    ]);

    const outstandingTotal = obligations.data.reduce((sum, o) => sum + BigInt(o.amountPaise) - BigInt(o.paidPaise), BigInt(0));

    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Fee collection status, outstanding obligations, pending approvals.</p>
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Active fee structures" value={String(structures.meta?.total ?? 0)} />
          <KpiCard eyebrow="Pending obligations" value={String(obligations.meta?.total ?? 0)} delta={outstandingTotal > BigInt(0) ? formatMoneySummary(outstandingTotal.toString()) + " outstanding" : undefined} />
          <KpiCard eyebrow="Confirmed payments" value={String(payments.meta?.total ?? 0)} />
          <KpiCard eyebrow="Pending approvals" value={String(pendingApprovals.length)} />
        </KpiGrid>

        <section>
          <h2 className="text-sm font-bold tracking-wide text-text-muted uppercase">Approvals awaiting you</h2>
          <div className="mt-3 flex flex-col gap-2">
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-text-muted">Nothing pending right now.</p>
            ) : (
              pendingApprovals.slice(0, 8).map((a) => (
                <Link
                  key={a.id}
                  href={`/finance/approvals/${a.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-field"
                >
                  <div>
                    <p className="text-sm font-bold text-text">{a.requestType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-text-muted">
                      {a.requestedByName ?? a.requestedBy} · due {formatDate(a.dueAt)}
                      {a.amountPaise ? ` · ${formatMoneySummary(a.amountPaise)}` : ""}
                    </p>
                  </div>
                  <StatusPill state={a.state} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the Finance dashboard. Nothing was submitted — try again." />;
  }
}
