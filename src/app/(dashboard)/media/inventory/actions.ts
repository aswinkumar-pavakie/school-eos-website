"use server";

import { revalidatePath } from "next/cache";
import { createMediaInventoryItem, updateMediaInventoryItem } from "@/lib/media-api";

export interface FormState {
  error?: string;
}

export async function createMediaInventoryItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Equipment name is required." };
  const costRaw = String(formData.get("acquisitionCostRupees") ?? "").trim();

  try {
    await createMediaInventoryItem({
      name,
      assetCode: String(formData.get("assetCode") ?? "").trim() || undefined,
      quantity: Number(formData.get("quantity") ?? "1") || 1,
      location: String(formData.get("location") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      vendor: String(formData.get("vendor") ?? "").trim() || undefined,
      acquisitionCostPaise: costRaw ? Math.round(Number(costRaw) * 100) : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add the asset." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function updateMediaInventoryItemAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateMediaInventoryItem(id, {
      name: String(formData.get("name") ?? "").trim() || undefined,
      assetCode: String(formData.get("assetCode") ?? "").trim() || undefined,
      location: String(formData.get("location") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      vendor: String(formData.get("vendor") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update the asset." };
  }
  revalidatePath("/media/inventory");
  return {};
}
