"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { PurchaseOrder, PurchaseOrderStage } from "@/lib/finance-api";
import { OrderStepper } from "./OrderStepper";
import { updateStageAction, type FormState } from "./order-tracking-actions";

const STAGE_OPTIONS: { value: PurchaseOrderStage; label: string }[] = [
  { value: "ORDERED", label: "Ordered" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "PART_DELIVERED", label: "Part Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const initial: FormState = {};

/** "Update PO-2026-0008" — stepper preview, a Stage choice, quantity delivered, and a note for the order's own history timeline. */
export function OrderStageModal({ order, revalidateTo }: { order: PurchaseOrder; revalidateTo: string }) {
  const [selectedStage, setSelectedStage] = useState<PurchaseOrderStage>(order.stage);
  const [state, formAction] = useActionState(updateStageAction.bind(null, order.id, revalidateTo), initial);

  return (
    <Modal title={`Update ${order.orderNo}`} trigger={<PlainButton type="button" variant="primary">Update stage</PlainButton>}>
      <p className="-mt-2 mb-4 text-sm text-text-muted">Stages are advanced manually — select the stage this order has actually reached.</p>
      <OrderStepper stage={selectedStage} />
      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="stage" value={selectedStage} />
        <div>
          <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Stage</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {STAGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setSelectedStage(o.value)}
                className={`rounded-[var(--radius-input)] border px-3 py-2 text-sm font-bold transition-colors ${
                  selectedStage === o.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-text hover:bg-field"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <TextField
            label="Quantity delivered *"
            name="quantityDelivered"
            type="number"
            min={0}
            max={order.quantityOrdered}
            defaultValue={order.quantityDelivered}
            required
          />
          <p className="mt-1 text-xs text-text-muted">Allotment can never exceed this — the database enforces it.</p>
        </div>

        <TextField label="Note for the history" name="note" placeholder="e.g. Received at central stores" />

        <FieldError message={state.error} />

        <div className="flex justify-end gap-2">
          <Button variant="primary" pendingLabel="Saving…">Save stage</Button>
        </div>
      </form>
    </Modal>
  );
}
