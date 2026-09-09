"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/faculty-api";

export interface FormState {
  error?: string;
}

function sectionIdsFrom(formData: FormData): string[] {
  return formData.getAll("targetSectionIds").map(String).filter(Boolean);
}

export async function createAnnouncementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const targetSectionIds = sectionIdsFrom(formData);
  if (targetSectionIds.length === 0) return { error: "Pick at least one class to send this to." };
  try {
    await createAnnouncement({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      category: String(formData.get("category") ?? "") || undefined,
      priority: String(formData.get("priority") ?? "NORMAL"),
      isEmergency: formData.get("isEmergency") === "on",
      expiresAt: String(formData.get("expiresAt") ?? "") || undefined,
      targetSectionIds,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not post announcement." };
  }
  revalidatePath("/faculty/announcements");
  return {};
}

export async function updateAnnouncementAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const targetSectionIds = sectionIdsFrom(formData);
  try {
    await updateAnnouncement(id, {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      category: String(formData.get("category") ?? "") || undefined,
      priority: String(formData.get("priority") ?? "NORMAL"),
      isEmergency: formData.get("isEmergency") === "on",
      expiresAt: String(formData.get("expiresAt") ?? "") || undefined,
      targetSectionIds: targetSectionIds.length > 0 ? targetSectionIds : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save changes." };
  }
  revalidatePath("/faculty/announcements");
  return {};
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  await deleteAnnouncement(id);
  revalidatePath("/faculty/announcements");
  redirect("/faculty/announcements");
}
