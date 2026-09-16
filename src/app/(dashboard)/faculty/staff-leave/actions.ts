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
  // This same form is reused by both /faculty/staff-leave and
  // /faculty/staff-od (leaveType='ON_DUTY' on the same real table, see
  // staff-od/page.tsx's own comment) -- both routes' caches must be
  // invalidated regardless of which screen the submit happened from, or the
  // OTHER screen's History tab keeps showing stale data.
  revalidatePath("/faculty/staff-leave");
  revalidatePath("/faculty/staff-od");
  return {};
}
