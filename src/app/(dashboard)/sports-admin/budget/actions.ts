"use server";

import { revalidatePath } from "next/cache";
import { createBudgetRequest } from "@/lib/sports-admin-api";

export interface FormState {
  error?: string;
}

export async function createBudgetRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const title = String(formData.get("title") ?? "").trim();
  const estimatedAmountPaise = String(formData.get("estimatedAmountPaise") ?? "").trim();
  if (!title) return { error: "Enter what the request is for." };
  const rupees = Number(estimatedAmountPaise);
  if (!Number.isFinite(rupees) || rupees <= 0) return { error: "Enter a valid amount." };

  try {
    await createBudgetRequest({
      title,
      description: String(formData.get("description") ?? "").trim() || undefined,
      estimatedAmountPaise: String(Math.round(rupees * 100)),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit this request." };
  }
  revalidatePath("/sports-admin/budget");
  return {};
}
