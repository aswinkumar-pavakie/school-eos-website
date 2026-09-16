"use server";

import { revalidatePath } from "next/cache";
import { markAllPresentCoordinatorAttendance, markCoordinatorAttendanceRecord, publishCoordinatorAttendance } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function markAttendanceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const sectionId = String(formData.get("sectionId") ?? "");
  const recordId = String(formData.get("recordId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!sectionId || !recordId || !status) return { error: "Missing record." };
  try {
    await markCoordinatorAttendanceRecord(sectionId, recordId, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this record." };
  }
  revalidatePath(`/academic-coordinator/attendance/${sectionId}`);
  revalidatePath("/academic-coordinator/attendance");
  return {};
}

export async function markAllPresentAction(sectionId: string, date: string): Promise<void> {
  await markAllPresentCoordinatorAttendance(sectionId, date);
  revalidatePath(`/academic-coordinator/attendance/${sectionId}`);
  revalidatePath("/academic-coordinator/attendance");
}

export async function publishAttendanceAction(sectionId: string, date: string): Promise<void> {
  await publishCoordinatorAttendance(sectionId, date);
  revalidatePath(`/academic-coordinator/attendance/${sectionId}`);
  revalidatePath("/academic-coordinator/attendance");
}
