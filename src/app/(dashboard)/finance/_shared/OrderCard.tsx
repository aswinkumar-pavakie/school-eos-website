"use client";

import { useActionState, useState } from "react";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderEvent } from "@/lib/finance-api";
import { OrderStepper } from "./OrderStepper";
import { OrderStageModal } from "./OrderStageModal";
import { allotAction, type FormState } from "./order-tracking-actions";

const initial: FormState = {};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-field">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** One order in the POP/SOP tracking board — stepper, progress bars, an expandable detail panel (requester, description, history), and the stage-update / allot actions. */
export function OrderCard({ order, events, revalidateTo }: { order: PurchaseOrder; events: PurchaseOrderEvent[]; revalidateTo: string }) {
  const [expanded, setExpanded] = useState(false);
  const [allotState, allotFormAction] = useActionState(allotAction.bind(null, order.id, revalidateTo), initial);
  const remainingToAllot = order.quantityDelivered - order.quantityAllotted;

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-[var(--radius-pill)] border border-border px-1.5 py-0.5 text-[10px] font-bold text-text-muted">{order.orderNo}</span>
          <span className="font-bold text-text">{order.itemName}</span>
          <StatusPill state={order.stage} />
        </div>
        <div className="flex items-center gap-2">
          <PlainButton
            type="button"
            variant="secondary"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`order-details-${order.id}`}
          >
            {expanded ? "Hide" : "Details"}
          </PlainButton>
          <OrderStageModal order={order} revalidateTo={revalidateTo} />
        </div>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {order.departmentName ?? "—"} · {order.vendorName ?? "no vendor"} · placed {formatDate(order.placedOn)}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-4 text-right sm:w-64">
        <div>
          <p className="text-[10px] font-bold tracking-wide text-text-muted uppercase">Value</p>
          <p className="font-mono text-sm font-bold text-text">{order.estimatedAmountPaise ? formatMoneySummary(order.estimatedAmountPaise) : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wide text-text-muted uppercase">Qty</p>
          <p className="font-mono text-sm font-bold text-text">{order.quantityDelivered}/{order.quantityOrdered}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wide text-text-muted uppercase">Allotted</p>
          <p className="font-mono text-sm font-bold text-text">{order.quantityAllotted}</p>
        </div>
      </div>

      <div className="mt-4">
        <OrderStepper stage={order.stage} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Delivered</span>
            <span className="font-mono">{order.quantityDelivered} / {order.quantityOrdered}</span>
          </div>
          <ProgressBar value={order.quantityDelivered} max={order.quantityOrdered} />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Allotted to faculty</span>
            <span className="font-mono">{order.quantityAllotted} / {order.quantityOrdered}</span>
          </div>
          <ProgressBar value={order.quantityAllotted} max={order.quantityOrdered} />
        </div>
      </div>
      {order.expectedOn && <p className="mt-2 text-xs font-bold text-text-muted">EXPECTED {formatDate(order.expectedOn)}</p>}

      {expanded && (
        <div id={`order-details-${order.id}`} className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Requested by</dt>
              <dd className="text-text">{order.requestedByEmail ?? order.requestedByName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Delivered</dt>
              <dd className="font-mono text-text">{order.quantityDelivered}</dd>
            </div>
            {order.description && (
              <div className="col-span-2">
                <dt className="text-xs font-bold tracking-wide text-text-muted uppercase">Description</dt>
                <dd className="text-text">{order.description}</dd>
              </div>
            )}
          </dl>

          {remainingToAllot > 0 && (
            <form action={allotFormAction} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-border bg-field p-3">
              <div className="w-32">
                <TextField label={`Allot (max ${remainingToAllot})`} name="quantity" type="number" min={1} max={remainingToAllot} required />
              </div>
              <div className="min-w-40 flex-1">
                <TextField label="Note (optional)" name="note" placeholder="e.g. Handed to lab in-charge" />
              </div>
              <Button variant="secondary" pendingLabel="Allotting…">Allot to faculty</Button>
              <FieldError message={allotState.error} />
            </form>
          )}

          {events.length > 0 && (
            <ol className="flex flex-col gap-2">
              {events.map((e) => (
                <li key={e.id} className="rounded-[var(--radius-card)] border border-border bg-field px-3 py-2 text-xs">
                  <span className="font-bold text-text">{formatDate(e.recordedAt)}</span>
                  <span className="text-text-muted"> · {e.recordedByEmail ?? "—"} — </span>
                  <span className="text-text">
                    {e.stage === "ORDERED" ? "Order placed on Finance approval" : `Stage updated to ${e.stage.replace(/_/g, " ")}`}
                    {e.quantityDelivered != null ? ` (qty delivered ${e.quantityDelivered})` : ""}
                    {e.note ? ` — ${e.note}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
