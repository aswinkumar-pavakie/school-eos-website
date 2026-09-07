"use server";

import { revalidatePath } from "next/cache";
import { approveRequest, rejectRequest } from "@/lib/finance-api";

export interface FormState {
  error?: string;
}

// Bound with (approvalRequestId, revalidateTo) from the POP/SOP Approval table's own
// row — revalidateTo is the calling page's own path ("/finance/pop-approval" or
// "/finance/sop-approval") so only that list re-fetches, not both.
export async function approveInlineAction(
  approvalRequestId: string,
  revalidateTo: string,
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  try {
    await approveRequest(approvalRequestId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Approve failed." };
  }
  revalidatePath(revalidateTo);
  return {};
}

// Reject always demands a reason — enforced by the backend too (400 without one).
export async function rejectInlineAction(
  approvalRequestId: string,
  revalidateTo: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "Reason · required" };
  try {
    await rejectRequest(approvalRequestId, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reject failed." };
  }
  revalidatePath(revalidateTo);
  return {};
}
