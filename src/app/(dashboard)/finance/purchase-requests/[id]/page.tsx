import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getPurchaseRequest, getPurchaseOrder } from "@/lib/finance-api";
import { StageForms } from "./StageForms";
import { ApprovalStatusPanel } from "../../_shared/ApprovalStatusPanel";

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [{ request, order }, actor] = await Promise.all([getPurchaseRequest(id), getCurrentActor()]);
    const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");
    const events = order ? (await getPurchaseOrder(order.id)).events : [];
    const kind = request.requestType === "GOODS" ? "pop" : "sop";
    const backHref = !isFinanceOrAdmin
      ? "/finance/purchase-requests"
      : order
        ? `/finance/${kind}-tracking`
        : `/finance/${kind}-approval`;
    const backLabel = !isFinanceOrAdmin
      ? "My Requests"
      : order
        ? `${kind.toUpperCase()} Tracking`
        : `${kind.toUpperCase()} Approval`;

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href={backHref} className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to {backLabel}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{request.itemName}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {request.referenceNo} · {request.requestType === "GOODS" ? "Purchase Request" : "Service Request"}
              {request.requestedByName ? ` · raised by ${request.requestedByName}` : ""} on {formatDate(request.createdAt)}
            </p>
          </div>
          <StatusPill state={request.state} />
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          {request.description && <p className="text-sm text-text">{request.description}</p>}
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {request.quantity != null && (
              <div>
                <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Quantity</dt>
                <dd className="text-text">{request.quantity}</dd>
              </div>
            )}
            {request.vendorName && (
              <div>
                <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Vendor</dt>
                <dd className="text-text">{request.vendorName}</dd>
              </div>
            )}
            {request.estimatedAmountPaise && (
              <div>
                <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Estimated amount</dt>
                <dd className="font-mono font-bold text-text">{formatMoneyDetail(request.estimatedAmountPaise)}</dd>
              </div>
            )}
            {request.neededBy && (
              <div>
                <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Needed by</dt>
                <dd className="text-text">{formatDate(request.neededBy)}</dd>
              </div>
            )}
          </dl>
        </div>

        {request.approvalRequestId && <ApprovalStatusPanel approvalRequestId={request.approvalRequestId} />}

        {order && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Fulfillment · {order.orderNo}</h2>
              <StatusPill state={order.stage} />
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <p className="text-sm text-text">
                Ordered <span className="font-mono font-bold">{order.quantityOrdered}</span> · Delivered{" "}
                <span className="font-mono font-bold">{order.quantityDelivered}</span> · Allotted{" "}
                <span className="font-mono font-bold">{order.quantityAllotted}</span>
              </p>
              <p className="mt-1 text-xs text-text-muted">Placed {formatDate(order.placedOn)}{order.expectedOn ? ` · expected ${formatDate(order.expectedOn)}` : ""}</p>
            </div>

            {events.length > 0 && (
              <ol className="flex flex-col gap-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                    <div>
                      <span className="font-bold text-text">{e.stage.replace(/_/g, " ")}</span>
                      {e.quantityDelivered != null && <span className="text-text-muted"> · qty delivered {e.quantityDelivered}</span>}
                      {e.note && <p className="mt-0.5 text-xs text-text-muted">{e.note}</p>}
                    </div>
                    <span className="text-xs text-text-muted">{formatDate(e.recordedAt)}</span>
                  </li>
                ))}
              </ol>
            )}

            {isFinanceOrAdmin && <StageForms requestId={id} order={order} />}
          </section>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this request. Nothing was submitted — try again." />;
  }
}
