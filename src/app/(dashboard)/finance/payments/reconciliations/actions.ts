"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { closeReconciliation, createReconciliation, deleteReconciliation, resolveReconciliationEntry, runReconciliation } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

export async function createReconciliationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let created;
  try {
    created = await createReconciliation({
      gateway: String(formData.get("gateway")),
      periodFrom: String(formData.get("periodFrom")),
      periodTo: String(formData.get("periodTo")),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed." };
  }
  revalidatePath("/finance/payments/reconciliations");
  redirect(`/finance/payments/reconciliations/${created.id}`);
}

export async function deleteReconciliationAction(id: string): Promise<void> {
  await deleteReconciliation(id);
  revalidatePath("/finance/payments/reconciliations");
  redirect("/finance/payments/reconciliations");
}

export async function runReconciliationAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const refs = formData.getAll("gatewayRef") as string[];
  const amounts = formData.getAll("amountRupees") as string[];
  const rows = refs
    .map((gatewayRef, i) => ({ gatewayRef, amountPaise: String(Math.round(Number(amounts[i] || "0") * 100)) }))
    .filter((r) => r.gatewayRef && Number(r.amountPaise) > 0);
  if (rows.length === 0) return { error: "Add at least one settlement row" };
  try {
    await runReconciliation(id, rows);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Run failed." };
  }
  revalidatePath(`/finance/payments/reconciliations/${id}`);
  return {};
}

export async function resolveEntryAction(id: string, entryId: string, formData: FormData): Promise<void> {
  await resolveReconciliationEntry(id, entryId, String(formData.get("resolutionNote") || "Resolved by Finance"));
  revalidatePath(`/finance/payments/reconciliations/${id}`);
}

export async function closeReconciliationAction(id: string): Promise<void> {
  await closeReconciliation(id);
  revalidatePath(`/finance/payments/reconciliations/${id}`);
}
