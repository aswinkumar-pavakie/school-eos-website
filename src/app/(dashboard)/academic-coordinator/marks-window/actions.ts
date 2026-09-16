"use server";

import { revalidatePath } from "next/cache";
import { setMarksEntryWindow } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
  saved?: boolean;
}

export async function setMarksWindowAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const examId = String(formData.get("examId") ?? "");
  const opensAt = String(formData.get("opensAt") ?? "");
  const closesAt = String(formData.get("closesAt") ?? "");
  if (!examId) return { error: "Missing exam." };
  if (opensAt && closesAt && new Date(opensAt) > new Date(closesAt)) {
    return { error: "Opens date must be before the closes date." };
  }
  try {
    await setMarksEntryWindow(examId, {
      opensAt: opensAt ? new Date(opensAt).toISOString() : undefined,
      closesAt: closesAt ? new Date(closesAt).toISOString() : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this window." };
  }
  revalidatePath("/academic-coordinator/marks-window");
  return { saved: true };
}
