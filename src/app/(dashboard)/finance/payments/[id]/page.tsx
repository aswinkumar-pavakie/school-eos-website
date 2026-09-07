import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getPayment, getReceipts, listRefundsForPayment } from "@/lib/finance-api";
import { generateReceiptsAction, processRefundAction } from "../actions";
import { AllocateForm } from "./AllocateForm";
import { CreateRefundModal } from "./CreateRefundModal";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [payment, receipts, refunds] = await Promise.all([getPayment(id), getReceipts(id), listRefundsForPayment(id)]);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/finance/payments" className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to Payments
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{formatMoneyDetail(payment.amountPaise)}</h1>
            <p className="mt-1 text-sm text-text-muted">{payment.mode} · initiated {formatDate(payment.initiatedAt)}</p>
          </div>
          <StatusPill state={payment.state} />
        </div>

        {payment.state === "CONFIRMED" && (
          <>
            <AllocateForm paymentId={id} />

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Receipts</h2>
                <form action={generateReceiptsAction.bind(null, id)}>
                  <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">Generate</PlainButton>
                </form>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {receipts.length === 0 ? (
                  <p className="text-sm text-text-muted">No receipts yet.</p>
                ) : (
                  receipts.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                      <span className="font-mono text-text">{r.receiptNo}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-text">{formatMoneyDetail(r.amountPaise)}</span>
                        <Link href={`/receipts/print?ids=${r.id}`} target="_blank" className="text-xs font-bold text-primary hover:underline">
                          Print →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Refunds</h2>
                <CreateRefundModal paymentId={id} />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {refunds.length === 0 ? (
                  <p className="text-sm text-text-muted">No refunds on this payment.</p>
                ) : (
                  refunds.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                      <div>
                        <p className="font-mono font-bold text-text">{formatMoneyDetail(r.amountPaise)}</p>
                        <p className="text-xs text-text-muted">{r.reason}</p>
                        {r.approvalRequestId && (
                          <a href={`/finance/approvals/${r.approvalRequestId}`} className="text-xs font-bold text-primary hover:underline">
                            View approval →
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill state={r.state} />
                        {r.state === "APPROVED" && (
                          <form action={processRefundAction.bind(null, id, r.id)}>
                            <PlainButton variant="primary" type="submit" className="px-2.5 py-1 text-xs">Mark paid out</PlainButton>
                          </form>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {payment.state === "INITIATED" && (
          <p className="text-sm text-text-muted">Awaiting the gateway's confirmation webhook — nothing else to do here yet.</p>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this payment. Nothing was submitted — try again." />;
  }
}
