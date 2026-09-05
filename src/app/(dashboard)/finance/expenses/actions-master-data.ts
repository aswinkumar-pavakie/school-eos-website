"use server";

import { revalidatePath } from "next/cache";
import { createExpenseCategory } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createExpenseCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const pettyLimitRupees = Number(formData.get("pettyLimitRupees") || "5000");
  try {
    await createExpenseCategory({
      name: String(formData.get("name")),
      code: String(formData.get("code") || "") || undefined,
      pettyLimitPaise: String(Math.round(pettyLimitRupees * 100)),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/expenses");
  return {};
}
