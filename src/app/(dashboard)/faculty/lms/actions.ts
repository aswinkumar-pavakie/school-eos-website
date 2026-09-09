"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLmsFolder,
  createLmsLessonPlan,
  createLmsTask,
  deleteLmsFile,
  deleteLmsFolder,
  deleteLmsLessonPlan,
  deleteLmsTask,
  getLmsFileUrl,
  updateLmsFolder,
  updateLmsLessonPlan,
  updateLmsTask,
  uploadLmsFile,
} from "@/lib/faculty-lms-api";

export interface FormState {
  error?: string;
}

function sectionIdsFrom(formData: FormData): string[] {
  return formData.getAll("shareOfferingIds").map(String).filter(Boolean);
}

// ---------- Folders ----------

export async function createFolderAction(subjectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createLmsFolder({
      subjectId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      shareOfferingIds: sectionIdsFrom(formData),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create folder." };
  }
  revalidatePath(`/faculty/lms/${subjectId}`);
  return {};
}

export async function updateFolderAction(folderId: string, subjectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateLmsFolder(folderId, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      shareOfferingIds: sectionIdsFrom(formData),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath(`/faculty/lms/folder/${folderId}`);
  revalidatePath(`/faculty/lms/${subjectId}`);
  return {};
}

export async function deleteFolderAction(folderId: string, subjectId: string): Promise<void> {
  await deleteLmsFolder(folderId);
  revalidatePath(`/faculty/lms/${subjectId}`);
  redirect(`/faculty/lms/${subjectId}`);
}

// ---------- Files ----------

export async function uploadFileAction(folderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  try {
    await uploadLmsFile(folderId, file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
  revalidatePath(`/faculty/lms/folder/${folderId}`);
  return {};
}

export async function deleteFileAction(fileId: string, folderId: string): Promise<void> {
  await deleteLmsFile(fileId);
  revalidatePath(`/faculty/lms/folder/${folderId}`);
}

export async function getFileUrlAction(fileId: string): Promise<string> {
  return getLmsFileUrl(fileId);
}

// ---------- Tasks ----------

export async function createTaskAction(subjectOfferingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createLmsTask({
      subjectOfferingId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create task." };
  }
  revalidatePath("/faculty/lms/[subjectId]", "page");
  return {};
}

export async function updateTaskAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateLmsTask(id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/lms/[subjectId]", "page");
  return {};
}

export async function toggleTaskStatusAction(id: string, nextStatus: "OPEN" | "CLOSED"): Promise<void> {
  await updateLmsTask(id, { status: nextStatus });
  revalidatePath("/faculty/lms/[subjectId]", "page");
}

export async function deleteTaskAction(id: string): Promise<void> {
  await deleteLmsTask(id);
  revalidatePath("/faculty/lms/[subjectId]", "page");
}

// ---------- Lesson plans ----------

export async function createLessonPlanAction(subjectOfferingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await createLmsLessonPlan({
      subjectOfferingId,
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      weekStart: String(formData.get("weekStart") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create lesson plan." };
  }
  revalidatePath("/faculty/lms/[subjectId]", "page");
  return {};
}

export async function updateLessonPlanAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updateLmsLessonPlan(id, {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      weekStart: String(formData.get("weekStart") ?? "") || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/lms/[subjectId]", "page");
  return {};
}

export async function deleteLessonPlanAction(id: string): Promise<void> {
  await deleteLmsLessonPlan(id);
  revalidatePath("/faculty/lms/[subjectId]", "page");
}
