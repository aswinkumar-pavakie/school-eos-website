"use server";

import { revalidatePath } from "next/cache";
import { createParentMeetingBooking } from "@/lib/parent-api";

export interface FormState {
  error?: string;
}

export async function createMeetingBookingAction(
  studentId: string,
  slotId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    await createParentMeetingBooking({ slotId, studentId, notes: notes || undefined });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not request this slot." };
  }
  revalidatePath("/parent/meetings");
  return {};
}
