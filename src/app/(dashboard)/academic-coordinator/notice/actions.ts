"use server";

import { revalidatePath } from "next/cache";
import { createCoordinatorNotice, deleteCoordinatorNotice, updateCoordinatorNotice } from "@/lib/faculty-coordinator-api";

export interface FormState {
  error?: string;
}

export async function createNoticeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const title = formData.get("title");
  const body = formData.get("body");
  const priority = formData.get("priority");
  const audience = formData.get("audience");
  if (typeof title !== "string" || title.trim() === "") return { error: "Title is required." };
  if (typeof body !== "string" || body.trim() === "") return { error: "Details are required." };

  try {
    if (audience === "COORDINATORS") {
      await createCoordinatorNotice({
        title: title.trim(),
        body: body.trim(),
        priority: (priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") ?? "NORMAL",
        audienceType: "ROLE",
        targetRoles: ["ACADEMIC_COORDINATOR"],
      });
    } else {
      const targetSectionIds = formData.getAll("targetSectionIds").map(String).filter(Boolean);
      if (targetSectionIds.length === 0) return { error: "Pick at least one section." };
      await createCoordinatorNotice({
        title: title.trim(),
        body: body.trim(),
        priority: (priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") ?? "NORMAL",
        audienceType: "SECTION",
        targetSectionIds,
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not post this notice." };
  }

  revalidatePath("/academic-coordinator/notice");
  return {};
}

export async function updateNoticeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const title = formData.get("title");
  const body = formData.get("body");
  const priority = formData.get("priority");
  if (!id) return { error: "Missing notice." };
  if (typeof title !== "string" || title.trim() === "") return { error: "Title is required." };
  if (typeof body !== "string" || body.trim() === "") return { error: "Details are required." };
  try {
    await updateCoordinatorNotice(id, {
      title: title.trim(),
      body: body.trim(),
      priority: (priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") ?? "NORMAL",
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update this notice." };
  }
  revalidatePath("/academic-coordinator/notice");
  return {};
}

export async function deleteNoticeAction(id: string): Promise<void> {
  await deleteCoordinatorNotice(id);
  revalidatePath("/academic-coordinator/notice");
}
