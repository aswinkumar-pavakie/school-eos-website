import type { PurchaseOrderStage } from "@/lib/finance-api";

// The 4 stages an order actually progresses through, in order. PART_DELIVERED and
// CANCELLED are real states too (selectable on the update form) but branch off this
// main line rather than sitting on it, so the stepper only ever shows these 4 dots.
const STEPS: { stage: PurchaseOrderStage; label: string }[] = [
  { stage: "ORDERED", label: "Ordered" },
  { stage: "DISPATCHED", label: "Dispatched" },
  { stage: "IN_TRANSIT", label: "In Transit" },
  { stage: "DELIVERED", label: "Delivered" },
];

function stepIndexFor(stage: PurchaseOrderStage): number {
  if (stage === "PART_DELIVERED") return 3;
  if (stage === "CANCELLED") return 0;
  const idx = STEPS.findIndex((s) => s.stage === stage);
  return idx === -1 ? 0 : idx;
}

/** Horizontal 4-dot progress stepper — "Ordered -> Dispatched -> In Transit -> Delivered". */
export function OrderStepper({ stage }: { stage: PurchaseOrderStage }) {
  const currentIndex = stepIndexFor(stage);
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.stage} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${i <= currentIndex ? "bg-primary" : "border-2 border-border bg-surface"}`} />
            <span className={`text-xs font-bold ${i <= currentIndex ? "text-primary" : "text-text-muted"}`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 h-0.5 flex-1 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
