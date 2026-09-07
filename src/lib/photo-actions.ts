"use server";

// Shared photo upload/remove -- backs PersonPhotoEditor for Students, Faculty, and
// Parents alike, since all three read from the same person row (POST/DELETE
// /persons/:id/photo in the Identity/Access module already handles any person).

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface PhotoActionState {
  error?: string;
}

export async function uploadPersonPhotoAction(
  personId: string,
  revalidatePaths: string[],
  _prev: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo file first." };
  }

  const uploadBody = new FormData();
  uploadBody.set("photo", file);

  const res = await apiFetch(`/persons/${personId}/photo`, {
    method: "POST",
    body: uploadBody,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    return { error: message ?? "Couldn't upload that photo. Nothing was changed." };
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return {};
}

export async function removePersonPhotoAction(personId: string, revalidatePaths: string[]): Promise<void> {
  const res = await apiFetch(`/persons/${personId}/photo`, { method: "DELETE" });
  if (!res.ok) throw new Error("Couldn't remove the photo. Nothing was changed.");
  for (const path of revalidatePaths) revalidatePath(path);
}
