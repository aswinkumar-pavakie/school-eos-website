"use server";

import { revalidatePath } from "next/cache";
import { createStaffLeave } from "@/lib/faculty-staff-api";

export interface FormState {
  error?: string;
}

export async function createStaffLeaveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createStaffLeave({
      leaveType: String(formData.get("leaveType") ?? "CASUAL"),
      fromDate: String(formData.get("fromDate") ?? ""),
      toDate: String(formData.get("toDate") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not submit request." };
  }
  revalidatePath("/faculty/staff-leave");
  return {};
}
