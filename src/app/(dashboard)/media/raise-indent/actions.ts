"use server";

import { revalidatePath } from "next/cache";
import { createMediaIndent } from "@/lib/media-api";

export interface FormState {
  error?: string;
}

export async function createMediaIndentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const itemName = String(formData.get("itemName") ?? "").trim();
  if (!itemName) return { error: "Title is required." };
  const costRaw = String(formData.get("estimatedCostRupees") ?? "").trim();

  try {
    await createMediaIndent({
      requestType: formData.get("requestType") === "SERVICE" ? "SERVICE" : "GOODS",
      itemName,
      description: String(formData.get("description") ?? "").trim() || undefined,
      quantity: Number(formData.get("quantity") ?? "1") || 1,
      estimatedAmountPaise: costRaw ? String(Math.round(Number(costRaw) * 100)) : undefined,
      neededBy: String(formData.get("neededBy") ?? "").trim() || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit the indent." };
  }
  revalidatePath("/media/raise-indent");
  revalidatePath("/media");
  return {};
}
