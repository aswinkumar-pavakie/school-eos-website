"use server";

import { revalidatePath } from "next/cache";
import { assignSubstitution } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function assignSubstitutionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const timetableSlotId = String(formData.get("timetableSlotId") ?? "");
  const originalStaffId = String(formData.get("originalStaffId") ?? "");
  const substituteStaffId = String(formData.get("substituteStaffId") ?? "");
  const subDate = String(formData.get("subDate") ?? "");
  if (!timetableSlotId || !originalStaffId || !substituteStaffId || !subDate) {
    return { error: "Pick a substitute teacher." };
  }
  try {
    await assignSubstitution({ timetableSlotId, originalStaffId, substituteStaffId, subDate });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign this substitute." };
  }
  revalidatePath("/academic-coordinator/substitute");
  return {};
}
