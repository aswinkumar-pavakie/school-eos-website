import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getPurchaseOrder, getPurchaseOrdersSummary, listPurchaseOrders, type PurchaseRequestType } from "@/lib/finance-api";
import { ProcurementKpiCard } from "./ProcurementKpiCard";
import { OrderCard } from "./OrderCard";

const STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "PART_DELIVERED", label: "Part Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

/**
 * Shared fulfillment-tracking board behind /finance/pop-tracking (GOODS) and
 * /finance/sop-tracking (SERVICE) — every purchase_order auto-created the moment
 * Finance approves the matching request. Every KPI is a real backend aggregate
 * (PurchaseOrderRepository.summary); no fabricated "fund" figures.
 */
export async function OrderTrackingView({
  requestType,
  label,
  basePath,
  stage,
  search,
}: {
  requestType: PurchaseRequestType;
  label: "POP" | "SOP";
  basePath: string;
  stage?: string;
  search?: string;
}) {
  try {
    const [summary, { data: orders }] = await Promise.all([
      getPurchaseOrdersSummary(requestType),
      listPurchaseOrders({ requestType, stage: stage || undefined, search: search || undefined, pageSize: 100 }),
    ]);
    const eventsByOrder = await Promise.all(orders.map((o) => getPurchaseOrder(o.id).then((r) => r.events)));

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{label}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {label === "POP"
              ? "Track approved purchase requests through to delivery and allotment."
              : "Track approved service requests through to completion and allotment."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ProcurementKpiCard
            title="Approved value"
            value={formatMoneySummary(summary.approvedValuePaise)}
            stat={`${summary.totalOrders} orders tracked`}
            caption="Total value of tracked orders"
          />
          <ProcurementKpiCard
            title="In progress"
            value={String(summary.inProgressCount)}
            caption="Dispatched or In Transit"
          />
          <ProcurementKpiCard
            title="Delivered"
            value={String(summary.deliveredCount)}
            stat={`of ${summary.totalOrders} orders total`}
            caption="Reached the final stage"
          />
          <ProcurementKpiCard
            title="Awaiting allotment"
            value={String(summary.awaitingAllotmentCount)}
            caption="Delivered but not yet handed to faculty"
          />
        </div>

        <form action={basePath} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="Search by order number, item, vendor, department or faculty…"
            className="flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select
            name="stage"
            defaultValue={stage ?? ""}
            className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="submit" className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field">
            Search
          </button>
        </form>

        {orders.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-field px-6 py-10 text-center">
            <p className="text-sm font-bold text-text">No {label} orders match this view</p>
            <p className="mt-1 text-sm text-text-muted">Orders appear here the moment Finance approves a {label === "POP" ? "purchase" : "service"} request.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, i) => (
              <OrderCard key={order.id} order={order} events={eventsByOrder[i]} revalidateTo={basePath} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={`Couldn't load ${label} tracking. Nothing was submitted — try again.`} />;
  }
}
