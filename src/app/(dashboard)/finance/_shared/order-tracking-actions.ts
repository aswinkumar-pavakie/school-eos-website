"use server";

import { revalidatePath } from "next/cache";
import { allotPurchaseOrder, updatePurchaseOrderStage, type PurchaseOrderStage } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

// Bound with (orderId, revalidateTo) from the POP/SOP tracking board itself —
// revalidateTo is "/finance/pop-tracking" or "/finance/sop-tracking" so only that
// board re-fetches.
export async function updateStageAction(
  orderId: string,
  revalidateTo: string,
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
  revalidatePath(revalidateTo);
  return {};
}

// "Allotted to faculty" — hand over delivered stock; bounded by quantity_delivered,
// DB-enforced (a 409 from the backend surfaces here verbatim).
export async function allotAction(
  orderId: string,
  revalidateTo: string,
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
  revalidatePath(revalidateTo);
  return {};
}
