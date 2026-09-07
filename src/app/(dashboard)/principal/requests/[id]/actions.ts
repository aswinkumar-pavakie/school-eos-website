"use server";

import { revalidatePath } from "next/cache";
import { approveRequest, rejectRequest, sendBackRequest, withdrawRequest } from "@/lib/finance-api";

export interface DecisionState {
  error?: string;
}

export async function approveAction(id: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  try {
    await approveRequest(id, String(formData.get("comment") ?? "") || undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Approve failed." };
  }
  revalidatePath(`/principal/requests/${id}`);
  revalidatePath("/principal");
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
  revalidatePath(`/principal/requests/${id}`);
  revalidatePath("/principal");
  return {};
}

export async function withdrawAction(id: string): Promise<void> {
  await withdrawRequest(id);
  revalidatePath(`/principal/requests/${id}`);
  revalidatePath("/principal");
}

// Send back always demands a reason/comment, same as reject — the request returns
// to the requester for revision rather than being decided.
export async function sendBackAction(id: string, _prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason/comment · required" };
  try {
    await sendBackRequest(id, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Send back failed." };
  }
  revalidatePath(`/principal/requests/${id}`);
  revalidatePath("/principal");
  return {};
}
