"use server";

import { revalidatePath } from "next/cache";
import { refreshFineStatus, sendFineToFinance, waiveFine } from "@/lib/library-api";

export interface FormActionState {
  error?: string;
}

export async function sendFineToFinanceAction(id: string): Promise<void> {
  await sendFineToFinance(id);
  revalidatePath("/library/fines");
}

export async function refreshFineStatusAction(id: string): Promise<void> {
  await refreshFineStatus(id);
  revalidatePath("/library/fines");
}

export async function waiveFineAction(id: string, _prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to waive a fine." };
  try {
    await waiveFine(id, reason);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Waive failed." };
  }
  revalidatePath("/library/fines");
  return {};
}
