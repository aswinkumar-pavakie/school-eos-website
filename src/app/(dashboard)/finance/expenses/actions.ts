"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense, payExpense, submitExpense, updateExpense } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  let created;
  try {
    created = await createExpense({
      categoryId: String(formData.get("categoryId")),
      amountPaise: String(Math.round(amountRupees * 100)),
      incurredOn: String(formData.get("incurredOn")),
      vendorName: String(formData.get("vendorName") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/expenses");
  redirect(`/finance/expenses/${created.id}`);
}

export async function updateExpenseAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const amountRupees = Number(formData.get("amountRupees") || "0");
  try {
    await updateExpense(id, {
      amountPaise: String(Math.round(amountRupees * 100)),
      incurredOn: String(formData.get("incurredOn")),
      vendorName: String(formData.get("vendorName") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed." };
  }
  revalidatePath(`/finance/expenses/${id}`);
  return {};
}

export async function deleteExpenseAction(id: string): Promise<void> {
  await deleteExpense(id);
  revalidatePath("/finance/expenses");
  redirect("/finance/expenses");
}

export async function submitExpenseAction(id: string): Promise<void> {
  await submitExpense(id);
  revalidatePath(`/finance/expenses/${id}`);
}

export async function payExpenseAction(id: string): Promise<void> {
  await payExpense(id);
  revalidatePath(`/finance/expenses/${id}`);
}
