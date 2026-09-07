"use server";

import { revalidatePath } from "next/cache";
import { approveRequest, rejectRequest, withdrawRequest } from "@/lib/finance-api";

export interface DecisionState {
  error?: string;
}

export async function approveAction(id: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  try {
    await approveRequest(id, String(formData.get("comment") ?? "") || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Approve failed." };
  }
  revalidatePath(`/finance/approvals/${id}`);
  revalidatePath("/finance");
  return {};
}

// Reject always demands a reason — enforced by the backend too (400 without one).
export async function rejectAction(id: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason · required" };
  try {
    await rejectRequest(id, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reject failed." };
  }
  revalidatePath(`/finance/approvals/${id}`);
  revalidatePath("/finance");
  return {};
}

export async function withdrawAction(id: string): Promise<void> {
  await withdrawRequest(id);
  revalidatePath(`/finance/approvals/${id}`);
  revalidatePath("/finance");
}
