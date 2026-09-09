"use server";

import { revalidatePath } from "next/cache";
import { createMeetingSlot, decideMeetingBooking, deleteMeetingSlot, updateMeetingSlot } from "@/lib/faculty-staff-api";

export interface FormState {
  error?: string;
}

export async function createSlotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createMeetingSlot({
      meetingDate: String(formData.get("meetingDate") ?? ""),
      fromTime: String(formData.get("fromTime") ?? ""),
      toTime: String(formData.get("toTime") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create slot." };
  }
  revalidatePath("/faculty/parent-meetings");
  return {};
}

export async function updateSlotAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateMeetingSlot(id, {
      meetingDate: String(formData.get("meetingDate") ?? ""),
      fromTime: String(formData.get("fromTime") ?? ""),
      toTime: String(formData.get("toTime") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/parent-meetings");
  return {};
}

export async function deleteSlotAction(id: string): Promise<void> {
  await deleteMeetingSlot(id);
  revalidatePath("/faculty/parent-meetings");
}

export async function decideBookingAction(bookingId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  await decideMeetingBooking(bookingId, decision);
  revalidatePath("/faculty/parent-meetings");
}
