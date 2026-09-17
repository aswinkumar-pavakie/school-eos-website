"use server";

import { revalidatePath } from "next/cache";
import {
  createMediaInventoryItem,
  getMediaInventoryItemHistory,
  issueMediaInventoryItem,
  markMediaInventoryItemAvailable,
  markMediaInventoryItemDamaged,
  markMediaInventoryItemLost,
  retireMediaInventoryItem,
  returnMediaInventoryItem,
  updateMediaInventoryItem,
  type MediaInventoryHistoryEntry,
} from "@/lib/media-api";

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

export async function loadInventoryHistoryAction(id: string): Promise<MediaInventoryHistoryEntry[]> {
  return getMediaInventoryItemHistory(id);
}

export async function issueAssetAction(id: string, assignedToPersonId: string): Promise<{ error?: string }> {
  try {
    await issueMediaInventoryItem(id, { assignedToPersonId });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not issue this asset." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function returnAssetAction(id: string): Promise<{ error?: string }> {
  try {
    await returnMediaInventoryItem(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not mark this asset returned." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function sendToServiceAction(id: string): Promise<{ error?: string }> {
  try {
    await markMediaInventoryItemDamaged(id, "Sent for service from Inventory");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send this asset to service." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function markAvailableAction(id: string): Promise<{ error?: string }> {
  try {
    await markMediaInventoryItemAvailable(id, "Repair/service completed from Inventory");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not mark this asset available." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function markLostAction(id: string): Promise<{ error?: string }> {
  try {
    await markMediaInventoryItemLost(id, "Marked lost from Inventory");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not mark this asset lost." };
  }
  revalidatePath("/media/inventory");
  return {};
}

export async function retireAssetAction(id: string): Promise<{ error?: string }> {
  try {
    await retireMediaInventoryItem(id, "Retired from Inventory");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not retire this asset." };
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
