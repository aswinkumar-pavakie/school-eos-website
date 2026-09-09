"use server";

import { revalidatePath } from "next/cache";
import { approveRequest, rejectRequest } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

export async function approveAction(approvalRequestId: string): Promise<void> {
  await approveRequest(approvalRequestId);
  revalidatePath("/faculty/student-leave");
}

export async function rejectAction(approvalRequestId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) return { error: "A reason is required to reject." };
  try {
    await rejectRequest(approvalRequestId, comment);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reject." };
  }
  revalidatePath("/faculty/student-leave");
  return {};
}
