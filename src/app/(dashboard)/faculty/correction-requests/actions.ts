"use server";

import { revalidatePath } from "next/cache";
import { correctMark } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
  saved?: boolean;
}

export async function correctMarkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const examSubjectId = String(formData.get("examSubjectId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const newMarksObtained = Number(formData.get("newMarksObtained") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!examSubjectId || !studentId) return { error: "Missing student." };
  if (Number.isNaN(newMarksObtained) || newMarksObtained < 0) return { error: "Enter a valid mark." };
  if (reason.length < 3) return { error: "Add a short reason for this correction." };
  try {
    await correctMark(examSubjectId, { studentId, newMarksObtained, reason });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this correction." };
  }
  revalidatePath("/faculty/correction-requests");
  return { saved: true };
}
