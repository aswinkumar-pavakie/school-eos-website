"use server";

import { revalidatePath } from "next/cache";
import { createStudentDuty, removeStudentDuty, updateStudentDuty } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

export async function createDutyAction(sectionId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createStudentDuty(sectionId, {
      studentId: String(formData.get("studentId") ?? ""),
      title: String(formData.get("title") ?? ""),
      duties: String(formData.get("duties") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not assign duty." };
  }
  revalidatePath("/faculty/class-teacher");
  return {};
}

export async function updateDutyAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateStudentDuty(id, {
      title: String(formData.get("title") ?? ""),
      duties: String(formData.get("duties") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/class-teacher");
  return {};
}

export async function endDutyAction(id: string): Promise<void> {
  await updateStudentDuty(id, { status: "ENDED" });
  revalidatePath("/faculty/class-teacher");
}

export async function removeDutyAction(id: string): Promise<void> {
  await removeStudentDuty(id);
  revalidatePath("/faculty/class-teacher");
}
