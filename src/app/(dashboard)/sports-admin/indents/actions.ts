"use server";

import { revalidatePath } from "next/cache";
import { createEquipmentIndent } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createEquipmentIndentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const equipmentId = String(formData.get("equipmentId") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!equipmentId) return { error: "Pick an equipment item." };
  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Enter a valid quantity." };
  if (!reason) return { error: "Reason is required." };

  try {
    await createEquipmentIndent({
      equipmentId,
      quantity,
      reason,
      vendorName: String(formData.get("vendorName") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit this indent." };
  }
  revalidatePath("/sports-admin/indents");
  return {};
}
