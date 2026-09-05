"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPurchaseRequest, type PurchaseRequestType } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

// Only PRINCIPAL can reach this (enforced both by the backend's @Roles('PRINCIPAL')
// on POST /finance/purchase-requests and by the page only rendering the trigger for
// that role) — "principal itself creates the POP/SOP" per the workflow this mirrors.
export async function createPurchaseRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const amountRupeesRaw = String(formData.get("estimatedAmountRupees") ?? "").trim();

  let created;
  try {
    created = await createPurchaseRequest({
      requestType: String(formData.get("requestType")) as PurchaseRequestType,
      itemName: String(formData.get("itemName") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
      quantity: quantityRaw ? Number(quantityRaw) : undefined,
      vendorName: String(formData.get("vendorName") ?? "").trim() || undefined,
      estimatedAmountPaise: amountRupeesRaw ? String(Math.round(Number(amountRupeesRaw) * 100)) : undefined,
      neededBy: String(formData.get("neededBy") ?? "").trim() || undefined,
      departmentId: String(formData.get("departmentId") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/purchase-requests");
  redirect(`/finance/purchase-requests/${created.id}`);
}
