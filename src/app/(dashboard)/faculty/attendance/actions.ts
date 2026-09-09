"use server";

import { revalidatePath } from "next/cache";
import { markAllPresent, markAttendanceRecord } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

export async function markAllPresentAction(sectionId: string, date: string): Promise<void> {
  await markAllPresent(sectionId, date);
  revalidatePath("/faculty/attendance");
}

export async function markRecordAction(
  recordId: string,
  sectionId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const status = String(formData.get("status") ?? "");
  try {
    await markAttendanceRecord(recordId, sectionId, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update attendance." };
  }
  revalidatePath("/faculty/attendance");
  return {};
}
