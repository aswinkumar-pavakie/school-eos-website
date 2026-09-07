import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import {
  getPurchaseOrdersSummary,
  getPurchaseRequestsSummary,
  listDepartments,
  listPurchaseRequests,
  type PurchaseRequestType,
} from "@/lib/finance-api";
import { ProcurementKpiCard } from "./ProcurementKpiCard";
import { InlineApproveReject } from "./InlineApproveReject";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Awaiting decision" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All statuses" },
] as const;

/**
 * Shared list+KPI+inline-decision view behind both /finance/pop-approval (GOODS) and
 * /finance/sop-approval (SERVICE) — same page structurally, filtered to one
 * request_type each, matching the reference portal's separate POP/SOP Approval pages.
 * Every KPI here is a real, backend-computed aggregate (PurchaseRequestRepository
 * .summary / PurchaseOrderRepository.summary) — never a client-side reduce over a
 * page of rows, and never a fabricated figure (no "total fund" card — that concept
 * doesn't exist anywhere in School EOS's schema, unlike the reference project's).
 */
export async function ApprovalQueueView({
  requestType,
  label,
  basePath,
  status,
  departmentId,
  search,
}: {
  requestType: PurchaseRequestType;
  label: "POP" | "SOP";
  basePath: string;
  status: string;
  departmentId?: string;
  search?: string;
}) {
  try {
    const [requestSummary, orderSummary, { data: requests }, departments] = await Promise.all([
      getPurchaseRequestsSummary(requestType),
      getPurchaseOrdersSummary(requestType),
      listPurchaseRequests({ requestType, state: status || undefined, departmentId: departmentId || undefined, search: search || undefined, pageSize: 100 }),
      listDepartments(),
    ]);

    const approvedRatio = requestSummary.totalCount > 0 ? (requestSummary.approvedCount / requestSummary.totalCount) * 100 : 0;
    const allotmentRatio = orderSummary.totalOrders > 0 ? (orderSummary.awaitingAllotmentCount / orderSummary.totalOrders) * 100 : 0;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{label} Approval</h1>
          <p className="mt-1 text-sm text-text-muted">
            {label === "POP"
              ? "Purchase requests raised by the Principal for goods — approve or reject, direct and secure."
              : "Service requests raised by the Principal — approve or reject, direct and secure."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ProcurementKpiCard
            title="Awaiting decision"
            value={String(requestSummary.pendingCount)}
            stat={`${requestSummary.totalCount} ${label} in view`}
            progress={approvedRatio}
            caption={`${requestSummary.approvedCount} approved so far`}
          />
          <ProcurementKpiCard
            title="Committed value"
            value={formatMoneySummary(requestSummary.approvedValuePaise)}
            stat={`${requestSummary.approvedCount} approved proposals`}
            progress={approvedRatio}
            caption={`of ${requestSummary.totalCount} total requests`}
          />
          <ProcurementKpiCard
            title="Awaiting allotment"
            value={String(orderSummary.awaitingAllotmentCount)}
            stat={`${orderSummary.totalOrders} orders tracked`}
            progress={allotmentRatio}
            caption="Delivered but not handed over"
          />
          <ProcurementKpiCard
            title="Total requests"
            value={String(requestSummary.totalCount)}
            stat={`${requestSummary.pendingCount} pending · ${requestSummary.approvedCount} approved`}
            caption={`${requestSummary.rejectedCount} rejected · ${requestSummary.cancelledCount} cancelled`}
          />
        </div>

        <form action={basePath} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder={`Search ${label} by item, reference, vendor or requester…`}
            className="flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.value === "PENDING" ? ` (${requestSummary.pendingCount})` : ""}
              </option>
            ))}
          </select>
          <select
            name="departmentId"
            defaultValue={departmentId ?? ""}
            className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field">
            Search
          </button>
        </form>

        {requests.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-field px-6 py-10 text-center">
            <p className="text-sm font-bold text-text">No {label} requests match this view</p>
            <p className="mt-1 text-sm text-text-muted">Try a different status or clear the search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead className="sticky top-0 bg-field">
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Proposal</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Department</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Status</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-bold tracking-wide text-text-muted uppercase">Amount</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-bold tracking-wide text-text-muted uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-field/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text">{r.itemName}</span>
                        <span className="rounded-[var(--radius-pill)] border border-border px-1.5 py-0.5 text-[10px] font-bold text-text-muted">{r.referenceNo}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Qty {r.quantity ?? "—"} · {r.vendorName ?? "no vendor"} · needed {formatDate(r.neededBy)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text">{r.departmentName ?? "—"}</td>
                    <td className="px-4 py-3"><StatusPill state={r.state} /></td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {r.estimatedAmountPaise ? formatMoneySummary(r.estimatedAmountPaise) : "—"}
                      <p className="font-sans text-[10px] font-normal text-text-muted">estimate</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.state === "PENDING" && r.approvalRequestId ? (
                        <InlineApproveReject purchaseRequestId={r.id} approvalRequestId={r.approvalRequestId} revalidateTo={basePath} />
                      ) : (
                        <div className="flex justify-end">
                          <Link
                            href={`/finance/purchase-requests/${r.id}`}
                            className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field"
                          >
                            Details
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={`Couldn't load ${label} requests. Nothing was submitted — try again.`} />;
  }
}
