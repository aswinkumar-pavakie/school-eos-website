"use server";

import { revalidatePath } from "next/cache";
import { createHomework, deleteHomework, updateHomework } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

export async function createHomeworkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const maxMarksRaw = String(formData.get("maxMarks") ?? "").trim();
  try {
    await createHomework({
      subjectOfferingId: String(formData.get("subjectOfferingId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? ""),
      maxMarks: maxMarksRaw ? Number(maxMarksRaw) : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not post homework." };
  }
  revalidatePath("/faculty/homework");
  return {};
}

export async function updateHomeworkAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const maxMarksRaw = String(formData.get("maxMarks") ?? "").trim();
  try {
    await updateHomework(id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? ""),
      maxMarks: maxMarksRaw ? Number(maxMarksRaw) : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/homework");
  return {};
}

export async function deleteHomeworkAction(id: string): Promise<void> {
  await deleteHomework(id);
  revalidatePath("/faculty/homework");
}

export async function closeHomeworkAction(id: string): Promise<void> {
  await updateHomework(id, { status: "CLOSED" });
  revalidatePath("/faculty/homework");
}
