"use server";

import { revalidatePath } from "next/cache";
import { allotPurchaseOrder, updatePurchaseOrderStage, type PurchaseOrderStage } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

// orderId (purchase_order.id) is distinct from the purchase_request id in the page's
// own URL — bound in from the server component, never trusted from the form itself.
export async function updateStageAction(
  requestId: string,
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const quantityDeliveredRaw = String(formData.get("quantityDelivered") ?? "").trim();
  try {
    await updatePurchaseOrderStage(orderId, {
      stage: String(formData.get("stage")) as PurchaseOrderStage,
      quantityDelivered: quantityDeliveredRaw ? Number(quantityDeliveredRaw) : undefined,
      note: String(formData.get("note") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stage update failed." };
  }
  revalidatePath(`/finance/purchase-requests/${requestId}`);
  return {};
}

// "Allotted to faculty" — hand over delivered stock; bounded by quantity_delivered,
// DB-enforced (the backend rejects an over-allotment with 409, surfaced here as-is).
export async function allotAction(
  requestId: string,
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const quantity = Number(String(formData.get("quantity") ?? "").trim());
  if (!quantity || quantity < 1) return { error: "Quantity · required" };
  try {
    await allotPurchaseOrder(orderId, {
      quantity,
      note: String(formData.get("note") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Allotment failed." };
  }
  revalidatePath(`/finance/purchase-requests/${requestId}`);
  return {};
}
