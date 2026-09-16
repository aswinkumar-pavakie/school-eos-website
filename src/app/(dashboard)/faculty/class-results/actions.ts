"use server";

import { revalidatePath } from "next/cache";
import { setStudentRemark } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

export async function setRemarkAction(
  sectionId: string,
  examId: string,
  studentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const remark = String(formData.get("remark") ?? "").trim();
  try {
    await setStudentRemark(sectionId, examId, studentId, remark);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save the remark." };
  }
  revalidatePath("/faculty/class-results");
  return {};
}
