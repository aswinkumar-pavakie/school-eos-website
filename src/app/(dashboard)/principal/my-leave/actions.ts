"use server";

import { revalidatePath } from "next/cache";
import { createMyLeaveRequest, withdrawMyLeaveRequest } from "@/lib/principal-staff-api";

export interface FormState {
  error?: string;
}

export async function createMyLeaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createMyLeaveRequest({
      leaveType: String(formData.get("leaveType") ?? "CASUAL") as "CASUAL" | "MEDICAL" | "EARNED" | "ON_DUTY",
      fromDate: String(formData.get("fromDate") ?? ""),
      toDate: String(formData.get("toDate") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit request." };
  }
  revalidatePath("/principal/my-leave");
  return {};
}

export async function withdrawMyLeaveAction(id: string): Promise<{ error?: string }> {
  try {
    await withdrawMyLeaveRequest(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not withdraw request." };
  }
  revalidatePath("/principal/my-leave");
  return {};
}
