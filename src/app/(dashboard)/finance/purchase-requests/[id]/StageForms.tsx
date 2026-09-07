"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { PurchaseOrder } from "@/lib/finance-api";
import { allotAction, updateStageAction, type FormState } from "./actions";

const STAGE_OPTIONS: { value: PurchaseOrder["stage"]; label: string }[] = [
  { value: "ORDERED", label: "Ordered" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "PART_DELIVERED", label: "Partly delivered" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const initial: FormState = {};

// Finance-only (page only renders this for FINANCE/ADMIN) — tracks the physical
// fulfillment of an approved request: move it through Ordered -> Dispatched ->
// In Transit -> Delivered, then allot delivered stock to whoever asked for it.
// Every quantity bound here is re-checked and DB-enforced server-side regardless.
export function StageForms({ requestId, order }: { requestId: string; order: PurchaseOrder }) {
  const [stageState, stageFormAction] = useActionState(updateStageAction.bind(null, requestId, order.id), initial);
  const [allotState, allotFormAction] = useActionState(allotAction.bind(null, requestId, order.id), initial);
  const remainingToAllot = order.quantityDelivered - order.quantityAllotted;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form action={stageFormAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Update stage</p>
        <SelectField label="Stage" name="stage" required defaultValue={order.stage}>
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
        <TextField
          label={`Quantity delivered (of ${order.quantityOrdered} ordered)`}
          name="quantityDelivered"
          type="number"
          min={0}
          max={order.quantityOrdered}
          defaultValue={order.quantityDelivered}
        />
        <TextAreaField label="Note (optional)" name="note" rows={2} />
        <FieldError message={stageState.error} />
        <Button variant="primary" pendingLabel="Updating…">Update stage</Button>
      </form>

      <form action={allotFormAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Allot delivered stock</p>
        <p className="text-xs text-text-muted">{remainingToAllot > 0 ? `${remainingToAllot} delivered but not yet allotted.` : "Nothing delivered is awaiting allotment."}</p>
        <TextField label="Quantity" name="quantity" type="number" min={1} max={remainingToAllot > 0 ? remainingToAllot : undefined} required disabled={remainingToAllot <= 0} />
        <TextAreaField label="Note (optional)" name="note" rows={2} disabled={remainingToAllot <= 0} />
        <FieldError message={allotState.error} />
        <Button variant="secondary" pendingLabel="Allotting…" disabled={remainingToAllot <= 0}>Allot</Button>
      </form>
    </div>
  );
}
